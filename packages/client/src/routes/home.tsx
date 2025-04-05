import PageTitle from '@/components/page-title';
import ProfileCard from '@/components/profile-card';
import ProfileOverlay from '@/components/profile-overlay';
import { useAgents } from '@/hooks/use-query-hooks';
import { formatAgentName } from '@/lib/utils';
import type { Agent } from '@elizaos/core';
import { AgentStatus } from '@elizaos/core';
import { Tooltip, TooltipContent, TooltipTrigger } from '@radix-ui/react-tooltip';
import { Cog, InfoIcon, Plus } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAgentManagement } from '../hooks/use-agent-management';

import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import { WelcomeForm } from '@/components/onboarding-form';
import { useWelcomeForm } from '@/lib/welcome-form-context';

export default function Home() {
  const { data: { data: agentsData } = {}, isLoading, isError, error } = useAgents();
  const navigate = useNavigate();
  const { isFormSubmitted } = useWelcomeForm();

  // Extract agents properly from the response
  const agents = agentsData?.agents || [];

  const [isOverlayOpen, setOverlayOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const { startAgent, isAgentStarting, isAgentStopping } = useAgentManagement();

  const openOverlay = (agent: Agent) => {
    setSelectedAgent(agent);
    setOverlayOpen(true);
  };

  const closeOverlay = () => {
    setSelectedAgent(null);
    setOverlayOpen(false);
  };

  return (
    <>
      {!isFormSubmitted && <WelcomeForm />}

      <div className="flex-1 p-3">
        <div className="flex flex-col gap-4 h-full">{/* Agent section removed */}</div>
      </div>

      <ProfileOverlay
        isOpen={isOverlayOpen}
        onClose={closeOverlay}
        agent={
          agents.find((a) => a.id === selectedAgent?.id) ||
          (selectedAgent as Agent) ||
          agents[0] ||
          ({} as Agent)
        }
        agents={agents}
      />
    </>
  );
}
