'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '../ui/button';
import {
  ChatBubble,
  ChatBubbleMessage,
  ChatBubbleTimestamp,
} from '../ui/chat/chat-bubble';
import { ChatInput } from '../ui/chat/chat-input';
import { ChatMessageList } from '../ui/chat/chat-message-list';
import { USER_NAME } from '@/constants';
import { useMessages } from '@/hooks/use-query-hooks';
import SocketIOManager from '@/lib/socketio-manager';
import { cn, getEntityId, moment } from '@/lib/utils';
import { WorldManager } from '@/lib/world-manager';
import type { Agent, Content, UUID } from '@elizaos/core';
import { AgentStatus } from '@elizaos/core';
import { useQueryClient } from '@tanstack/react-query';
import { PanelRight, Paperclip, Send, X } from 'lucide-react';
import AIWriter from 'react-aiwriter';
import { AudioRecorder } from '../audio-recorder';
import CopyButton from '../copy-button';
import { Avatar, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import ChatTtsButton from '../ui/chat/chat-tts-button';
import { useAutoScroll } from '../ui/chat/hooks/useAutoScroll';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { CHAT_SOURCE } from '@/constants';
import clientLogger from '@/lib/logger';

type ExtraContentFields = {
  name: string;
  createdAt: number;
  isLoading?: boolean;
};

type ContentWithUser = Content & ExtraContentFields;

interface CoreAgentChatProps {
  agentId: UUID;
  worldId: UUID;
  agentData: Agent;
  showDetails: boolean;
  toggleDetails: () => void;
}

const MemoizedMessageContent = React.memo(MessageContent);

function MessageContent({
  message,
  agentId,
  shouldAnimate,
}: {
  message: ContentWithUser;
  agentId: UUID;
  shouldAnimate: boolean;
}) {
  return (
    <div className="flex flex-col w-full">
      <ChatBubbleMessage
        isLoading={message.isLoading}
        {...(message.name === USER_NAME ? { variant: 'sent' } : {})}
        {...(!message.text ? { className: 'bg-transparent' } : {})}
      >
        <div className="py-2">
          {message.name === USER_NAME ? (
            message.text
          ) : shouldAnimate ? (
            <AIWriter>{message.text}</AIWriter>
          ) : (
            message.text
          )}
        </div>
        {message.text && message.createdAt && (
          <ChatBubbleTimestamp timestamp={moment(message.createdAt).format('LT')} />
        )}
      </ChatBubbleMessage>
      {message.name !== USER_NAME && message.text && !message.isLoading && (
        <div className="flex justify-between items-end w-full">
          <div className="flex items-center gap-2">
            <CopyButton text={message.text} />
            <ChatTtsButton agentId={agentId} text={message.text} />
          </div>
        </div>
      )}
    </div>
  );
}

export function CoreAgentChat({
  agentId,
  worldId,
  agentData,
  showDetails,
  toggleDetails,
}: CoreAgentChatProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [input, setInput] = useState('');
  const [messageProcessing, setMessageProcessing] = useState<boolean>(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const queryClient = useQueryClient();

  const entityId = getEntityId();
  const roomId = WorldManager.generateRoomId(agentId);

  const { data: messages = [] } = useMessages(agentId, roomId);
  const socketIOManager = SocketIOManager.getInstance();
  const animatedMessageIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Initialize Socket.io connection
    socketIOManager.initialize(entityId, [agentId]);

    // Join room after initialization
    const joinRoom = async () => {
      try {
        await socketIOManager.joinRoom(roomId);
        clientLogger.info(`[CoreAgentChat] Joined room ${roomId} with agent ${agentId}`);
        
        // Send initial greeting message to activate the agent
        if (agentData?.name) {
          const greeting = `Hello, I'm ${agentData.name}. How can I assist you with your project today?`;
          socketIOManager.sendMessage(greeting, roomId, CHAT_SOURCE);
        }
      } catch (error) {
        clientLogger.error(`[CoreAgentChat] Failed to join room ${roomId}:`, error);
      }
    };
    joinRoom();

    const handleMessageBroadcasting = (data: ContentWithUser) => {
      if (!data || data.roomId !== roomId) return;

      const isCurrentUser = data.senderId === entityId;
      const newMessage: ContentWithUser = {
        ...data,
        name: isCurrentUser ? USER_NAME : (data.senderName as string),
        createdAt: data.createdAt || Date.now(),
        isLoading: false,
      };

      queryClient.setQueryData(
        ['messages', agentId, roomId, worldId],
        (old: ContentWithUser[] = []) => {
          const isDuplicate = old.some(
            (msg) =>
              msg.text === newMessage.text &&
              msg.name === newMessage.name &&
              Math.abs((msg.createdAt || 0) - (newMessage.createdAt || 0)) < 5000
          );

          if (isDuplicate) return old;

          animatedMessageIdRef.current = typeof newMessage.id === 'string' ? newMessage.id : null;
          return [...old, newMessage];
        }
      );
    };

    const handleMessageComplete = (data: any) => {
      if (data.roomId === roomId) {
        setMessageProcessing(false);
      }
    };

    const msgHandler = socketIOManager.evtMessageBroadcast.attach((data) => [
      data as unknown as ContentWithUser,
    ]);
    const completeHandler = socketIOManager.evtMessageComplete.attach((data) => [
      data as unknown as any,
    ]);

    msgHandler.attach(handleMessageBroadcasting);
    completeHandler.attach(handleMessageComplete);

    return () => {
      socketIOManager.leaveRoom(roomId);
      msgHandler.detach();
      completeHandler.detach();
    };
  }, [roomId, agentId, entityId, queryClient, socketIOManager, worldId]);

  const { scrollRef, isAtBottom, scrollToBottom, disableAutoScroll } = useAutoScroll({
    smooth: true,
  });

  const prevMessageCountRef = useRef(0);

  const safeScrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollToBottom();
    }, 0);
  }, [scrollToBottom]);

  useEffect(() => {
    if (messages.length !== prevMessageCountRef.current) {
      safeScrollToBottom();
      prevMessageCountRef.current = messages.length;
    }
  }, [messages.length, safeScrollToBottom]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input || messageProcessing) return;

    const messageId = uuidv4();
    const userMessage: ContentWithUser = {
      text: input,
      name: USER_NAME,
      createdAt: Date.now(),
      senderId: entityId,
      senderName: USER_NAME,
      roomId: roomId,
      source: CHAT_SOURCE,
      id: messageId,
    };

    queryClient.setQueryData(
      ['messages', agentId, roomId, worldId],
      (old: ContentWithUser[] = []) => {
        const exists = old.some(
          (msg) =>
            msg.text === userMessage.text &&
            msg.name === USER_NAME &&
            Math.abs((msg.createdAt || 0) - userMessage.createdAt) < 1000
        );

        if (exists) return old;
        return [...old, userMessage];
      }
    );

    socketIOManager.sendMessage(input, roomId, CHAT_SOURCE);
    setMessageProcessing(true);
    setSelectedFile(null);
    setInput('');
    formRef.current?.reset();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file?.type.startsWith('image/')) {
      setSelectedFile(file);
    }
  };

  return (
    <div className={`flex flex-col w-full h-screen p-4 ${showDetails ? 'col-span-3' : 'col-span-4'}`}>
      {/* Agent Header */}
      <div className="flex items-center justify-between mb-4 p-3 bg-card rounded-lg border">
        <div className="flex items-center gap-3">
          <Avatar className="size-10 border rounded-full">
            <AvatarImage
              src={agentData?.settings?.avatar ? agentData?.settings?.avatar : '/bioicon.png'}
            />
          </Avatar>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-lg">{agentData?.name || 'Agent'}</h2>
              {agentData?.status === AgentStatus.ACTIVE ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="size-2.5 rounded-full bg-green-500 ring-2 ring-green-500/20 animate-pulse" />
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Agent is active</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="size-2.5 rounded-full bg-gray-300 ring-2 ring-gray-300/20" />
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Agent is inactive</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            {agentData?.bio && (
              <p className="text-sm text-muted-foreground line-clamp-1">
                {Array.isArray(agentData.bio) ? agentData.bio[0] : agentData.bio}
              </p>
            )}
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={toggleDetails}
          className={cn('gap-1.5', showDetails && 'bg-secondary')}
        >
          <PanelRight className="size-4" />
        </Button>
      </div>

      <div className="flex flex-row w-full overflow-y-auto grow gap-4">
        <div className={cn('flex flex-col transition-all duration-300 w-full')}>
          <ChatMessageList
            scrollRef={scrollRef}
            isAtBottom={isAtBottom}
            scrollToBottom={safeScrollToBottom}
            disableAutoScroll={disableAutoScroll}
          >
            {messages.map((message: ContentWithUser, index: number) => {
              const isUser = message.name === USER_NAME;
              const shouldAnimate =
                index === messages.length - 1 &&
                message.name !== USER_NAME &&
                message.id === animatedMessageIdRef.current;
              return (
                <div
                  key={`${message.id as string}-${message.createdAt}`}
                  className={cn(
                    'flex flex-col gap-1 p-1',
                    isUser ? 'justify-start' : 'justify-start'
                  )}
                >
                  <ChatBubble
                    variant={isUser ? 'sent' : 'received'}
                    className={`flex flex-row items-end gap-2`}
                  >
                    {message.text && !isUser && (
                      <Avatar className="size-8 border rounded-full select-none mb-2">
                        <AvatarImage
                          src={
                            isUser
                              ? '/user-icon.png'
                              : agentData?.settings?.avatar
                              ? agentData?.settings?.avatar
                              : '/bioicon.png'
                          }
                        />
                      </Avatar>
                    )}

                    <MemoizedMessageContent
                      message={message}
                      agentId={agentId}
                      shouldAnimate={shouldAnimate}
                    />
                  </ChatBubble>
                </div>
              );
            })}
          </ChatMessageList>

          <div className="px-4 pb-4 mt-auto">
            <form
              ref={formRef}
              onSubmit={handleSendMessage}
              className="relative rounded-md border bg-card"
            >
              {selectedFile ? (
                <div className="p-3 flex">
                  <div className="relative rounded-md border p-2">
                    <Button
                      onClick={() => setSelectedFile(null)}
                      className="absolute -right-2 -top-2 size-[22px] ring-2 ring-background"
                      variant="outline"
                      size="icon"
                    >
                      <X />
                    </Button>
                    <img
                      alt="Selected file"
                      src={URL.createObjectURL(selectedFile)}
                      height="100%"
                      width="100%"
                      className="aspect-square object-contain w-16"
                    />
                  </div>
                </div>
              ) : null}
              <ChatInput
                ref={inputRef}
                value={input}
                onChange={({ target }) => setInput(target.value)}
                placeholder="Type your message here..."
                className="min-h-12 resize-none rounded-md bg-card border-0 p-3 shadow-none focus-visible:ring-0"
              />
              <div className="flex items-center p-3 pt-0">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (fileInputRef.current) {
                            fileInputRef.current.click();
                          }
                        }}
                      >
                        <Paperclip className="size-4" />
                        <span className="sr-only">Attach file</span>
                      </Button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <p>Attach file</p>
                  </TooltipContent>
                </Tooltip>
                <AudioRecorder
                  agentId={agentId}
                  onChange={(newInput: string) => setInput(newInput)}
                />
                <Button
                  disabled={messageProcessing}
                  type="submit"
                  size="sm"
                  className="ml-auto gap-1.5 h-[30px]"
                >
                  {messageProcessing ? (
                    <div className="flex gap-0.5 items-center justify-center">
                      <span className="w-[4px] h-[4px] bg-gray-500 rounded-full animate-bounce [animation-delay:0s]" />
                      <span className="w-[4px] h-[4px] bg-gray-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="w-[4px] h-[4px] bg-gray-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  ) : (
                    <Send className="size-3.5" />
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
