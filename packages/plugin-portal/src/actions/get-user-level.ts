import {
  type Action,
  type Content,
  type HandlerCallback,
  type IAgentRuntime,
  type Memory,
  type State,
  logger,
} from '@elizaos/core';
import { UserLevelService } from '../services/user-level-service';

/**
 * Action to get a user's current level from Supabase
 */
export const getUserLevelAction: Action = {
  name: 'GET_USER_LEVEL',
  similes: ['CHECK_USER_LEVEL', 'FETCH_USER_LEVEL'],
  description: 'Retrieves the current level of a user from the database',

  validate: async (runtime: IAgentRuntime, message: Memory, state: State): Promise<boolean> => {
    // Check if we have a user ID in the message or state
    const userId = message.content.userId || message.content.user_id || state?.data?.userId;

    if (!userId) {
      logger.warn('[GET_USER_LEVEL] No user ID provided for GET_USER_LEVEL action');
      logger.info(`[GET_USER_LEVEL] Message content: ${JSON.stringify(message.content)}`);
      logger.info(`[GET_USER_LEVEL] State values: ${JSON.stringify(state.values)}`);
      return false;
    }

    logger.info(`[GET_USER_LEVEL] User ID found: ${userId}`);
    return true;
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: any,
    callback: HandlerCallback,
    _responses: Memory[]
  ) => {
    try {
      logger.info('[GET_USER_LEVEL] Handling GET_USER_LEVEL action');

      // Get the user ID from the message or state
      const userId = message.content.userId || message.content.user_id || state?.data?.userId;

      if (!userId || typeof userId !== 'string') {
        logger.error(`[GET_USER_LEVEL] Invalid user ID: ${userId}`);
        throw new Error('Invalid user ID provided for GET_USER_LEVEL action');
      }

      logger.info(`[GET_USER_LEVEL] Using user ID: ${userId}`);

      // Get the user level service
      const userLevelService = runtime.getService('user-level') as UserLevelService;
      if (!userLevelService) {
        logger.error('[GET_USER_LEVEL] User level service not found');
        throw new Error('User level service not found');
      }

      // Get the user level object
      const userLevelData = await userLevelService.getUserLevel(userId);
      // Extract the numeric level value, or null if not found
      const level = userLevelData ? userLevelData.level : null;
      logger.info(`[GET_USER_LEVEL] User level retrieved: ${level}`);

      // Create the response content
      const responseContent: Content = {
        text: level !== null ? `The user's current level is ${level}.` : 'User level not found.',
        actions: ['GET_USER_LEVEL'],
        source: message.content.source,
        data: {
          userId,
          level,
        },
      };

      // Call back with the response
      await callback(responseContent);

      return responseContent;
    } catch (error) {
      logger.error('[GET_USER_LEVEL] Error in GET_USER_LEVEL action:', error);
      throw error;
    }
  },

  examples: [
    [
      {
        name: '{{name1}}',
        content: {
          text: 'What is my level?',
          userId: 'user123',
        },
      },
      {
        name: '{{name2}}',
        content: {
          text: "The user's current level is 3.",
          actions: ['GET_USER_LEVEL'],
          data: {
            userId: 'user123',
            level: 3,
          },
        },
      },
    ],
  ],
};
