// Updated file: packages/client/src/config/agent-levels.ts
export interface AgentLevel {
  level: number;
  name: string;
  description: string;
  entryMessage: string;
  levelupRequirements: string[];
  capabilities: string[];
  // Add metrics requirements
  metricRequirements?: {
    daoMembers?: number;
    papersShared?: number;
    messagesSent?: number;
    discordCreated?: boolean;
    nftsMinted?: number;
  };
  suggestedActions?: {
    label: string;
    actionType: 'show_module';
    actionTarget: string;
    condition?: (state: any) => boolean;
  }[];
}

export const agentLevels: Record<number, AgentLevel> = {
  1: {
    level: 1,
    name: 'Inception Stage',
    description: 'Begin your scientific journey by minting your first science NFTs.',
    entryMessage:
      "Welcome to BioDAO! Let's start by minting your first science NFTs to establish your project's foundation.",
    levelupRequirements: [
      'Mint 3 Science NFTs'
    ],
    capabilities: [
      'NFT minting',
      'Scientific documentation',
      'Project setup assistance',
    ],
    metricRequirements: {
      nftsMinted: 3
    },
    suggestedActions: [
      {
        label: 'Mint Science NFTs 🧪',
        actionType: 'show_module',
        actionTarget: 'science_bank'
      }
    ]
  },
  2: {
    level: 2,
    name: 'Community Builder',
    description: 'Create a community around your scientific project.',
    entryMessage:
      'Congratulations on reaching level 2! Now it\'s time to build your community by creating a Discord server and inviting members.',
    levelupRequirements: [
      'Create a Discord server for your project',
      'Invite our Discord bot',
      'Grow your community to 4 members'
    ],
    capabilities: ['Discord setup', 'Team invitation', 'Community building'],
    metricRequirements: {
      daoMembers: 4,
      discordCreated: true
    },
    suggestedActions: [
      {
        label: 'Create Discord Server 💬',
        actionType: 'show_module',
        actionTarget: 'discord_creator'
      },
      {
        label: 'Invite Team Members 👥',
        actionType: 'show_module',
        actionTarget: 'team_inviter'
      }
    ]
  },
  3: {
    level: 3,
    name: 'Scientific Collaborator',
    description: 'Scale your community and research collaboration.',
    entryMessage:
      'Welcome to level 3! Focus on expanding your community and sharing scientific papers in Discord to reach the next level.',
    levelupRequirements: [
      'Grow your community to 10 members',
      'Share 25 scientific papers',
      'Reach 100 messages in Discord'
    ],
    capabilities: [
      'Advanced community tools',
      'Paper sharing',
      'Scientific collaboration'
    ],
    metricRequirements: {
      daoMembers: 10,
      papersShared: 25,
      messagesSent: 100
    },
    suggestedActions: [
      {
        label: 'Invite More Members 👥',
        actionType: 'show_module',
        actionTarget: 'team_inviter'
      },
      {
        label: 'Share Scientific Papers 📄',
        actionType: 'show_module',
        actionTarget: 'paper_sharing'
      }
    ]
  },
  4: {
    level: 4,
    name: 'Ecosystem Partner',
    description: 'Bio team is now available to you, they\'ll reach out shortly.',
    entryMessage:
      "Congratulations on reaching the level 4! You now have access to all tools and resources in the BioDAO ecosystem.",
    levelupRequirements: [], // No more requirements for max level
    capabilities: [
      'Full ecosystem access',
      'Advanced analytics',
      'Expert networks',
      'Funding opportunities',
      'Community dashboard'
    ],
    metricRequirements: {}, // No metrics needed for max level
    suggestedActions: [
      {
        label: 'Explore Community Dashboard 📊',
        actionType: 'show_module',
        actionTarget: 'community_dashboard'
      },
      {
        label: 'Connect with Experts 👩‍🔬',
        actionType: 'show_module',
        actionTarget: 'expert_directory'
      },
      {
        label: 'Access Resources 🔍',
        actionType: 'show_module',
        actionTarget: 'advanced_resources'
      }
    ]
  },
};