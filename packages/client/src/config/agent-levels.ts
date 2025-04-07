export interface AgentLevel {
  level: number;
  name: string;
  description: string;
  entryMessage: string;
  levelupRequirements: string[];
  capabilities: string[];
}

export const agentLevels: Record<number, AgentLevel> = {
  1: {
    level: 1,
    name: 'Scientific Advisor',
    description: 'Basic scientific guidance',
    entryMessage:
      "Welcome to BioDAO! I'm your scientific advisor. I can help you refine your project concept and connect you with relevant research.",
    levelupRequirements: [
      'Complete project description',
      'Provide 3 scientific references',
      'Engage in 5 chat sessions',
    ],
    capabilities: ['Research assistance', 'Project refinement'],
  },
  2: {
    level: 2,
    name: 'Strategic Partner',
    description: 'Strategic planning and connections',
    entryMessage:
      'Congratulations on reaching level 2! I can now help with strategic planning and connections to relevant experts.',
    levelupRequirements: [
      'Define project milestones',
      'Create project vision document',
      'Mint Idea NFT',
    ],
    capabilities: ['Strategic planning', 'Expert connections', 'Milestone tracking'],
  },
  3: {
    level: 3,
    name: 'Implementation Guide',
    description: 'Technical and execution support',
    entryMessage:
      'Welcome to level 3! I can now assist with implementation details, technical guidance, and resource allocation.',
    levelupRequirements: [
      'Complete implementation plan',
      'Set up project timeline',
      'Mint Vision NFT',
    ],
    capabilities: ['Technical guidance', 'Resource planning', 'Implementation support'],
  },
  4: {
    level: 4,
    name: 'Ecosystem Partner',
    description: 'Community and ecosystem integration',
    entryMessage:
      "You've reached the highest level! I can now help you integrate with the broader ecosystem and build community engagement.",
    levelupRequirements: [],
    capabilities: [
      'Community building',
      'Ecosystem integration',
      'Advanced resources',
      'Full platform access',
    ],
  },
};
