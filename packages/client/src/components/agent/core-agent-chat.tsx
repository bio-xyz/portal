'use client';

import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { agentLevels, AgentLevel } from '../../config/agent-levels';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface CoreAgentChatProps {
  userId: string;
  userLevel: number;
  initialMessage?: string | null;
}

export function CoreAgentChat({ userId, userLevel, initialMessage }: CoreAgentChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Get agent configuration based on user level
  const agentLevel: AgentLevel = agentLevels[userLevel] || agentLevels[1];

  // Send entry message when component first loads
  useEffect(() => {
    if (messages.length === 0) {
      // Use the custom initial message if provided, otherwise use the default level-based message
      const messageContent = initialMessage || agentLevel.entryMessage;

      addMessage({
        id: uuidv4(),
        role: 'assistant',
        content: messageContent,
        timestamp: new Date(),
      });
    }
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const addMessage = (message: Message) => {
    setMessages((prev) => [...prev, message]);
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };
    addMessage(userMessage);

    // Clear input
    setInput('');

    // Show loading state
    setIsLoading(true);

    try {
      // This is where you would normally call your AI service
      // For now, we'll simulate a response with setTimeout
      setTimeout(() => {
        const botResponse: Message = {
          id: uuidv4(),
          role: 'assistant',
          content: `I'm your level ${userLevel} agent (${agentLevel.name}). I can help with: ${agentLevel.capabilities.join(', ')}. How can I assist with your project today?`,
          timestamp: new Date(),
        };
        addMessage(botResponse);
        setIsLoading(false);
      }, 1000);

      // Save the interaction to the database (in a real app)
      // await saveAgentInteraction({ userId, message: input, agentResponse: response });
    } catch (error) {
      console.error('Error sending message:', error);
      setIsLoading(false);
    }
  };

  return (
    <Card className="flex flex-col h-[600px] max-w-2xl mx-auto">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold">{agentLevel.name}</h2>
        <p className="text-sm text-gray-500">{agentLevel.description}</p>
      </div>

      <ScrollArea className="flex-grow p-4">
        <div className="space-y-4" ref={scrollRef}>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground ml-12'
                  : 'bg-muted text-muted-foreground mr-12'
              }`}
            >
              <p className="whitespace-pre-line">{message.content}</p>
              <div className="text-xs opacity-70 mt-1">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="bg-muted text-muted-foreground p-3 rounded-lg mr-12">
              <p>Thinking...</p>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t flex gap-2">
        <Input
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') handleSendMessage();
          }}
          disabled={isLoading}
        />
        <Button onClick={handleSendMessage} disabled={isLoading}>
          Send
        </Button>
      </div>
    </Card>
  );
}
