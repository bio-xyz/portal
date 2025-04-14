import type { Action, IAgentRuntime, Memory, State, Content, HandlerCallback } from '@elizaos/core'; // Import Content and HandlerCallback

// Placeholder for state tracking if needed for multi-step actions
// This might live in the runtime's state or a dedicated context managed by the runtime
interface OnboardingActionState extends State {
  activeOnboardingFlow?: 'nftMint' | 'discordCreate' | 'teamInvite' | null;
  nftMintState?: {
    step: 'getType' | 'getName' | 'getDescription' | 'confirm' | 'execute';
    type?: string;
    name?: string;
    description?: string;
  };
  // ... other flow states
}

export const InitiateNftMintAction: Action = {
  name: 'INITIATE_NFT_MINT',
  similes: ['mint nft', 'start nft minting', 'create science nft'],
  description: 'Initiates the conversational flow for minting a new Science NFT for onboarding.',

  validate: async (runtime: IAgentRuntime, message: Memory, state?: OnboardingActionState): Promise<boolean> => {
    // Basic validation: Check if user level allows minting and if more NFTs are needed.
    // More sophisticated validation could check intent using the LLM or keywords.
    // Also check if another onboarding flow is already active.
    const userLevel = state?.agent?.userLevel ?? 1; // Get user level from state (adjust path as needed)
    const mintedCount = state?.agent?.mintedNFTCount ?? 0; // Get count from state (adjust path as needed)
    const requiredCount = 3; // Example requirement for Level 1->2

    // TODO: Access agent state more robustly via runtime if possible
    // const agentState = await runtime.getState('onboarding'); // Example

    const canMint = userLevel === 1 && mintedCount < requiredCount;
    const isFlowInactive = !state?.activeOnboardingFlow;

    return canMint && isFlowInactive;
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: OnboardingActionState,
    options?: any,
    callback?: HandlerCallback // Use the imported HandlerCallback type
  ): Promise<boolean> => {
    if (!callback) {
      console.error('INITIATE_NFT_MINT: Handler callback is missing!');
      return false;
    }

    // 1. Update state to indicate the NFT minting flow is active and waiting for type
    // TODO: Implement robust state update via runtime
    // await runtime.updateState({ activeOnboardingFlow: 'nftMint', nftMintState: { step: 'getType' } });
    console.log('Updating state (placeholder): Start NFT Mint, wait for type');


    // 2. Send the first message to the user, ensuring it matches the Content interface
    const responseContent: Content = {
        text: "Okay, let's mint a new Science NFT! What type of NFT would you like to create? (e.g., Idea, Vision, Discovery)",
        // thought: "Initiated NFT minting flow. Asking user for the NFT type." // Optional internal thought
    };
    await callback(responseContent);

    return true; // Indicate the handler completed successfully
  },

  examples: [
    // TODO: Add examples if needed for LLM guidance
    // [{ role: 'user', content: 'I want to mint an NFT' }, { role: 'assistant', content: 'Okay, let\'s mint a new Science NFT! ...', action: 'INITIATE_NFT_MINT' }]
  ],
};

// Export other actions related to NFT minting from this plugin/area later
// export const ProvideNftDetailAction: Action = { ... };
// export const ConfirmNftMintAction: Action = { ... };
// export const ExecuteNftMintAction: Action = { ... };
// export const CancelNftMintAction: Action = { ... };