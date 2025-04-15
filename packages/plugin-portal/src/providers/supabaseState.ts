import type { IAgentRuntime, Memory, Provider, State } from '@elizaos/core';
import { logger } from '@elizaos/core';
import { UserLevelService } from '../services/user-level-service';

/**
 * Represents a provider for retrieving Supabase state information.
 * @type {Provider}
 * @property {string} name - The name of the Supabase state provider.
 * @property {Function} get - Asynchronous function that retrieves Supabase state information based on the provided runtime, message, and optional state parameters.
 * @param {IAgentRuntime} runtime - The agent runtime.
 * @param {Memory} message - The message object.
 * @param {State} [state] - Optional state object.
 * @returns {Promise<Object>} A promise that resolves to an object containing Supabase state data, values, and text.
 */
export const supabaseStateProvider: Provider = {
  name: 'supabaseState',
  get: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
    // Get the user ID from the message or state
    const userId = message.content.userId || message.content.user_id || state?.data?.userId;

    if (!userId) {
      return {
        data: null,
        values: {},
        text: 'No user ID provided for Supabase state provider.',
      };
    }

    // Get the user level service
    const userLevelService = runtime.getService('user-level') as UserLevelService;
    if (!userLevelService) {
      logger.warn('User level service not found');
      return {
        data: null,
        values: {},
        text: 'User level service not available.',
      };
    }

    try {
      // Get the user's current level
      const userLevel = await userLevelService.getUserLevel(userId);

      if (userLevel === null) {
        return {
          data: {
            userId,
            userLevel: null,
          },
          values: {
            userId,
            userLevel: null,
          },
          text: `User ${userId} does not have a level assigned yet.`,
        };
      }

      // Get the level requirements for the next level
      const nextLevel = userLevel + 1;
      const levelRequirements = await userLevelService.getLevelRequirements(nextLevel);

      // Check which requirements are completed
      const completedRequirements = await userLevelService.checkRequirements(userId, nextLevel);

      // Format the response text
      let responseText = `User ${userId} is currently at level ${userLevel}.`;

      if (levelRequirements.length > 0) {
        responseText += ` To reach level ${nextLevel}, the following requirements must be met:`;

        levelRequirements.forEach((req) => {
          const isCompleted = completedRequirements.includes(req.id);
          responseText += `\n- ${req.description} (${isCompleted ? 'Completed' : 'Not completed'})`;
        });
      } else {
        responseText += ` This is the maximum level.`;
      }

      return {
        data: {
          userId,
          userLevel,
          nextLevel,
          levelRequirements,
          completedRequirements,
        },
        values: {
          userId,
          userLevel,
          nextLevel,
          levelRequirementsCount: levelRequirements.length,
          completedRequirementsCount: completedRequirements.length,
        },
        text: responseText,
      };
    } catch (error) {
      logger.error('Error in Supabase state provider:', error);
      return {
        data: {
          userId,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        values: {
          userId,
        },
        text: `Error retrieving Supabase state for user ${userId}.`,
      };
    }
  },
};

export default supabaseStateProvider;
