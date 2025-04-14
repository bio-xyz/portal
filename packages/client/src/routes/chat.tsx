import { useAgent } from '@/hooks/use-query-hooks';
import { WorldManager } from '@/lib/world-manager';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router';

import { AgentSidebar } from '../components/agent-sidebar';
import type { UUID, Agent } from '@elizaos/core';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '../components/ui/resizable';
import { CoreAgentChat } from '../components/agent/core-agent-chat';
import { useAuth } from '../lib/use-auth';
import { useUserLevel } from '../hooks/use-user-level';
import SocketIOManager from '../lib/socketio-manager';
import { getEntityId } from '../lib/utils';
import clientLogger from '../lib/logger';

export default function AgentRoute() {
  const [showDetails, setShowDetails] = useState(false);
  const worldId = WorldManager.getWorldId();
  const { user } = useAuth();
  const { level } = useUserLevel();
  const { agentId } = useParams<{ agentId: UUID }>();
  const { data: agentData } = useAgent(agentId);
  const agent = agentData?.data as Agent;
  const [initialMessage, setInitialMessage] = useState<string | null>(null);
  const entityId = getEntityId();
  const socketIOManager = SocketIOManager.getInstance();

  // Initialize socket connection at the route level
  useEffect(() => {
    if (agentId && entityId) {
      // Initialize socket connection
      socketIOManager.initialize(entityId, [agentId]);
      clientLogger.info(`[AgentRoute] Initialized socket connection for agent ${agentId}`);
    }
  }, [agentId, entityId]);

  useEffect(() => {
    if (agent?.name) {
      setInitialMessage(`Hello, I'm ${agent.name}. How can I assist you with your project today?`);
    }
  }, [agent]);

  const toggleDetails = () => setShowDetails(!showDetails);

  if (!agentId || !user) return <div>No data or user not authenticated.</div>;

  return (
    <ResizablePanelGroup direction="horizontal" className="w-full h-full">
      <ResizablePanel defaultSize={65}>
        <CoreAgentChat
          agentId={agentId}
          worldId={worldId}
          agentData={agent}
          showDetails={showDetails}
          toggleDetails={toggleDetails}
        />
      </ResizablePanel>
      <ResizableHandle />
      {showDetails && (
        <ResizablePanel
          defaultSize={35}
          className="border rounded-lg m-4 overflow-y-scroll bg-background flex flex-col h-[96vh]"
        >
          <AgentSidebar agentId={agentId} agentName={agent.name} />
        </ResizablePanel>
      )}
    </ResizablePanelGroup>
  );
}
