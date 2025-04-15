import { Provider, type IAgentRuntime, type Memory, type State, logger } from '@elizaos/core';

/**
 * User State Provider
 *
 * This provider extracts the user ID from the runtime state and makes it available
 * to all actions in the portal plugin.
 */
export const userStateProvider: Provider = {
  name: 'user-state',
  description: 'Provides user state information including user ID',

  get: async (runtime: IAgentRuntime, message: Memory, state: State): Promise<any> => {
    try {
      // Try to get the user ID from various sources
      let userId = null;
      let userAddress = null;
      let userMetadata = {};
      let source = 'unknown';

      // Log the full message and state for debugging
      logger.info(`[UserStateProvider] Message content: ${JSON.stringify(message.content)}`);
      logger.info(`[UserStateProvider] Message metadata: ${JSON.stringify(message.metadata)}`);
      logger.info(`[UserStateProvider] State socket auth: ${JSON.stringify(state.socket?.auth)}`);
      logger.info(`[UserStateProvider] State user: ${JSON.stringify(state.user)}`);
      logger.info(`[UserStateProvider] State auth: ${JSON.stringify(state.auth)}`);

      // 1. Check if it's in the message content (highest priority)
      if (message.content.userId) {
        userId = message.content.userId;
        source = 'message.content';
        logger.info(`[UserStateProvider] User ID found in message content: ${userId}`);
      }
      // 2. Check if it's in the message metadata
      else if (message.metadata && 'userId' in message.metadata) {
        userId = message.metadata.userId as string;
        source = 'message.metadata';
        logger.info(`[UserStateProvider] User ID found in message metadata: ${userId}`);
      }
      // 3. Check if it's in the socket auth data
      else if (state.socket?.auth?.userId) {
        userId = state.socket.auth.userId;
        userAddress = state.socket.auth.userAddress;
        userMetadata = state.socket.auth.userMetadata || {};
        source = 'socket.auth';
        logger.info(`[UserStateProvider] User ID found in socket auth: ${userId}`);
      }
      // 4. Check if it's in the user object
      else if (state.user?.id) {
        userId = state.user.id;
        userAddress = state.user.address;
        userMetadata = state.user.metadata || {};
        source = 'state.user';
        logger.info(`[UserStateProvider] User ID found in user object: ${userId}`);
      }
      // 5. Check if it's in the auth object
      else if (state.auth?.userId) {
        userId = state.auth.userId;
        userAddress = state.auth.userAddress;
        userMetadata = state.auth.userMetadata || {};
        source = 'state.auth';
        logger.info(`[UserStateProvider] User ID found in auth object: ${userId}`);
      }

      if (!userId) {
        logger.warn('[UserStateProvider] No user ID found in runtime state');
      } else {
        logger.info(
          `[UserStateProvider] Successfully extracted user ID: ${userId} from source: ${source}`
        );
      }

      // Return the user state
      return {
        values: {
          userId: userId,
          userAddress: userAddress,
        },
        data: {
          user: {
            id: userId,
            address: userAddress,
            metadata: userMetadata,
          },
        },
        text: `User ID: ${userId || 'Not available'} (from ${source})`,
      };
    } catch (error) {
      logger.error('[UserStateProvider] Error in user state provider:', error);
      return {
        values: { userId: null },
        data: { user: { id: null } },
        text: 'User ID: Not available',
      };
    }
  },
};
