# Feature Specifications

## 1. Privy Connection for Email and Passkey

**Overview:**
Implement Privy for authentication to provide a seamless and secure login experience using email and passkeys.

**Technical Details:**

- Install Privy SDK: `bun install @privy-io/react-auth`
- Create a PrivyProvider wrapper in `packages/client/src/lib/auth-provider.tsx`
- Configure Privy with:
  ```typescript
  const privyConfig = {
    appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID,
    loginMethods: ['email', 'passkey'],
    appearance: {
      theme: 'dark',
      accentColor: '#8bff2a',
    },
    embeddedWallets: {
      createOnLogin: true,
    },
  };
  ```
- Implement hooks for auth state:
  ```typescript
  export function useAuth() {
    const { authenticated, user, login, logout, createWallet } = usePrivy();

    return {
      isAuthenticated: authenticated,
      user,
      login,
      logout,
      wallet: user?.wallet,
      createWallet,
    };
  }
  ```
- Replace existing auth code in welcome form with Privy flow
- Store user data in Supabase after successful authentication

## 2. Backend Connection to Supabase

**Overview:**
Implement Supabase as the backend database, with proper authentication flow and data models.

**Technical Details:**

- Install Supabase SDK: `bun install @supabase/supabase-js`
- Create client in `packages/client/src/lib/supabase-client.ts`:

  ```typescript
  import { createClient } from '@supabase/supabase-js';

  export const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  ```

- Create data models:

  - Users (linked to Privy users)
  - Projects (storing project details)
  - Agent interactions
  - User levels and progress
  - NFT metadata

- Implement server-side functions for data operations:

  ```typescript
  export async function getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  }
  ```

- Create database hooks for client components:
  ```typescript
  export function useUserData() {
    const { user } = useAuth();
    const [userData, setUserData] = useState(null);

    useEffect(() => {
      if (user?.id) {
        const fetchData = async () => {
          const data = await getUserProfile(user.id);
          setUserData(data);
        };
        fetchData();
      }
    }, [user]);

    return userData;
  }
  ```

## 3. AI Agent Chats with Specific Levelup and Entry Messages

**Overview:**
Implement a progressive AI agent experience with customized entry messages and level-based progression.

**Technical Details:**

- Create agent level configuration:

  ```typescript
  interface AgentLevel {
    level: number;
    name: string;
    description: string;
    entryMessage: string;
    levelupRequirements: string[];
    capabilities: string[];
  }

  const agentLevels: Record<number, AgentLevel> = {
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
    // Additional levels...
  };
  ```

- Update CoreAgent to support level-based interactions:

  ```typescript
  export function CoreAgentChat({ userId, userLevel }: { userId: string; userLevel: number }) {
    const agentLevel = agentLevels[userLevel] || agentLevels[1];

    useEffect(() => {
      // Send entry message based on user's level
      if (messages.length === 0) {
        addMessage({
          id: uuidv4(),
          role: 'assistant',
          content: agentLevel.entryMessage,
          timestamp: new Date(),
        });
      }
    }, []);

    // Chat implementation
  }
  ```

- Create levelup detection system:
  ```typescript
  export function checkLevelupEligibility(userId: string, currentLevel: number) {
    const requirements = agentLevels[currentLevel].levelupRequirements;
    // Check user progress against requirements
    // Update user level in Supabase if eligible
  }
  ```

## 4. Mint Idea NFT and Vision NFT with Zora

**Overview:**
Enable users to mint their project ideas and visions as NFTs using Zora's infrastructure.

**Technical Details:**

- Install Zora SDK: `bun install @zoralabs/zora-721-contracts`
- Implement minting functionality:

  ```typescript
  async function mintIdeaNFT({ userId, projectName, projectDescription, recipient }) {
    // Generate NFT metadata from project details
    const metadata = {
      name: `${projectName} - BioDAO Idea`,
      description: projectDescription,
      image: await generateProjectImage(projectName, projectDescription),
      attributes: [
        { trait_type: 'Type', value: 'Idea' },
        { trait_type: 'Creator', value: userId },
      ],
    };

    // Upload metadata to IPFS
    const metadataUri = await uploadToIPFS(metadata);

    // Mint NFT using Zora
    const zoraContract = new ZoraERC721Drop({
      contractAddress: process.env.IDEA_NFT_CONTRACT_ADDRESS,
      chain: 'zora-mainnet',
    });

    return await zoraContract.mint({
      recipient,
      quantity: 1,
      metadataUri,
    });
  }
  ```

- Create UI for NFT minting in the user dashboard:
  ```tsx
  function MintNFTButton({ type, projectData, disabled }) {
    const { user } = useAuth();
    const [isMinting, setIsMinting] = useState(false);

    const handleMint = async () => {
      setIsMinting(true);
      try {
        if (type === 'idea') {
          await mintIdeaNFT({
            userId: user.id,
            projectName: projectData.name,
            projectDescription: projectData.description,
            recipient: user.wallet.address,
          });
        } else if (type === 'vision') {
          await mintVisionNFT({
            userId: user.id,
            projectName: projectData.name,
            projectVision: projectData.vision,
            recipient: user.wallet.address,
          });
        }
      } catch (error) {
        console.error('Minting failed:', error);
      } finally {
        setIsMinting(false);
      }
    };

    return (
      <Button
        className="bg-bio-accent hover:bg-bio-accent/90 text-bio-accent-foreground"
        onClick={handleMint}
        disabled={disabled || isMinting}
      >
        {isMinting ? 'Minting...' : `Mint ${type.charAt(0).toUpperCase() + type.slice(1)} NFT`}
      </Button>
    );
  }
  ```

## 5. CoreAgent Personality Levels with Discord Integration

**Overview:**
Implement a leveling system for CoreAgent with Discord integration for level progression and channel creation.

**Technical Details:**

- Create Discord bot integration:

  ```typescript
  // packages/client/src/lib/discord-integration.ts
  import { Client, GatewayIntentBits } from 'discord.js';

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  client.login(process.env.DISCORD_BOT_TOKEN);

  export async function checkDiscordRequirements(discordUserId: string, requirements: string[]) {
    // Logic to check if user has completed requirements in Discord
    // e.g., message count, participation in channels, etc.
    return true; // Replace with actual check
  }

  export async function createProjectChannel(projectName: string, userId: string) {
    try {
      const guild = client.guilds.cache.get(process.env.DISCORD_GUILD_ID);

      if (!guild) {
        throw new Error('Guild not found');
      }

      // Create a new channel in the Projects category
      const channel = await guild.channels.create({
        name: projectName.replace(/\s+/g, '-').toLowerCase(),
        type: 0, // Text channel
        parent: process.env.DISCORD_PROJECTS_CATEGORY_ID,
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            deny: ['ViewChannel'],
          },
          {
            id: userId,
            allow: ['ViewChannel', 'SendMessages'],
          },
        ],
      });

      // Send welcome message
      await channel.send(`Welcome to your project channel for ${projectName}!`);

      return channel.id;
    } catch (error) {
      console.error('Error creating Discord channel:', error);
      throw error;
    }
  }
  ```

- Implement level progression system:

  ```typescript
  // packages/client/src/lib/user-progression.ts
  import { supabase } from './supabase-client';
  import { checkDiscordRequirements } from './discord-integration';

  export async function checkAndUpdateUserLevel(userId: string) {
    // Get current user level
    const { data: userData, error } = await supabase
      .from('user_profiles')
      .select('level, discord_id')
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    const currentLevel = userData.level;
    const nextLevel = currentLevel + 1;

    // Get next level requirements
    const levelRequirements = agentLevels[nextLevel]?.levelupRequirements;

    if (!levelRequirements) return false; // No next level available

    // Check Discord requirements
    const meetsDiscordRequirements = await checkDiscordRequirements(
      userData.discord_id,
      levelRequirements
    );

    if (meetsDiscordRequirements) {
      // Update user level in Supabase
      await supabase.from('user_profiles').update({ level: nextLevel }).eq('user_id', userId);

      return true;
    }

    return false;
  }
  ```

- Automate channel creation through CoreAgent:
  ```typescript
  // In chat handler for CoreAgent
  async function handleProjectChannelCreation(message: string, userId: string) {
    if (message.toLowerCase().includes('create project channel')) {
      const { data: userData } = await supabase
        .from('user_profiles')
        .select('project_name, discord_id')
        .eq('user_id', userId)
        .single();

      if (userData.project_name && userData.discord_id) {
        const channelId = await createProjectChannel(userData.project_name, userData.discord_id);

        // Store channel ID in database
        await supabase.from('project_channels').insert({
          user_id: userId,
          project_name: userData.project_name,
          discord_channel_id: channelId,
        });

        return `I've created a Discord channel for your project "${userData.project_name}". Check your Discord server!`;
      }

      return 'I need your project name and Discord account to be linked before creating a channel.';
    }

    return null; // Not a channel creation request
  }
  ```

These implementations provide a solid foundation for each requested feature. All code snippets follow modern TypeScript practices and integrate well with the existing BioDAO architecture. The features work together to create a cohesive user experience with progressive engagement through AI agents, Discord integration, and web3 capabilities.
