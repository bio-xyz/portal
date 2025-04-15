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
 * Action to update a user's level in Supabase
 */
export const updateUserLevelAction: Action = {
  name: 'UPDATE_USER_LEVEL',
  similes: ['SET_USER_LEVEL', 'CHANGE_USER_LEVEL'],
  description: 'Updates the level of a user in the database',

  validate: async (runtime: IAgentRuntime, message: Memory, _state: State): Promise<boolean> => {
    // Check if we have a user ID and level in the message
    const userId = message.content.userId || message.content.user_id;
    const level = message.content.level;

    if (!userId) {
      logger.warn('No user ID provided for UPDATE_USER_LEVEL action');
      return false;
    }

    if (level === undefined || level === null) {
      logger.warn('No level provided for UPDATE_USER_LEVEL action');
      return false;
    }

    // Ensure level is a number
    if (typeof level !== 'number') {
      logger.warn('Level must be a number for UPDATE_USER_LEVEL action');
      return false;
    }

    return true;
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state: State,
    _options: any,
    callback: HandlerCallback,
    _responses: Memory[]
  ) => {
    try {
      logger.info('Handling UPDATE_USER_LEVEL action');

      // Get the user ID and level from the message
      const userId = message.content.userId || message.content.user_id;
      const level = message.content.level;

      // Get the user level service
      const userLevelService = runtime.getService('user-level') as UserLevelService;
      if (!userLevelService) {
        throw new Error('User level service not found');
      }

      // Update the user level
      const success = await userLevelService.setUserLevel(userId as string, level as number);

      // Create the response content
      const responseContent: Content = {
        text: success
          ? `Successfully updated the user's level to ${level}.`
          : "Failed to update the user's level.",
        actions: ['UPDATE_USER_LEVEL'],
        source: message.content.source,
        data: {
          userId,
          level,
          success,
        },
      };

      // Call back with the response
      await callback(responseContent);

      return responseContent;
    } catch (error) {
      logger.error('Error in UPDATE_USER_LEVEL action:', error);
      throw error;
    }
  },

  examples: [
    [
      {
        name: '{{name1}}',
        content: {
          text: 'Set my level to 3',
          userId: 'user123',
          level: 3,
        },
      },
      {
        name: '{{name2}}',
        content: {
          text: "Successfully updated the user's level to 3.",
          actions: ['UPDATE_USER_LEVEL'],
          data: {
            userId: 'user123',
            level: 3,
            success: true,
          },
        },
      },
    ],
  ],
};
