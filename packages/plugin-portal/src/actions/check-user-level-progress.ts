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
 * Action to check a user's level progress
 */
export const checkUserLevelProgressAction: Action = {
  name: 'CHECK_USER_LEVEL_PROGRESS',
  similes: ['GET_USER_LEVEL_PROGRESS', 'VIEW_USER_LEVEL_PROGRESS'],
  description: "Checks a user's progress towards their next level",

  validate: async (runtime: IAgentRuntime, message: Memory, state: State): Promise<boolean> => {
    // Check if we have a user ID in the message or state
    const userId = message.content.userId || message.content.user_id || state.values?.userId;

    if (!userId) {
      logger.warn(
        '[CHECK_USER_LEVEL_PROGRESS] No user ID provided for CHECK_USER_LEVEL_PROGRESS action'
      );
      logger.info(
        `[CHECK_USER_LEVEL_PROGRESS] Message content: ${JSON.stringify(message.content)}`
      );
      logger.info(`[CHECK_USER_LEVEL_PROGRESS] State values: ${JSON.stringify(state.values)}`);
      return false;
    }

    logger.info(`[CHECK_USER_LEVEL_PROGRESS] User ID found: ${userId}`);
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
      logger.info('[CHECK_USER_LEVEL_PROGRESS] Handling CHECK_USER_LEVEL_PROGRESS action');

      // Get the user ID from the message or state
      const userId = message.content.userId || message.content.user_id || state.values?.userId;

      if (!userId || typeof userId !== 'string') {
        logger.error(`[CHECK_USER_LEVEL_PROGRESS] Invalid user ID: ${userId}`);
        throw new Error('Invalid user ID provided for CHECK_USER_LEVEL_PROGRESS action');
      }

      logger.info(`[CHECK_USER_LEVEL_PROGRESS] Using user ID: ${userId}`);

      // Get the user level service
      const userLevelService = runtime.getService('user-level') as UserLevelService;
      if (!userLevelService) {
        logger.error('[CHECK_USER_LEVEL_PROGRESS] User level service not found');
        throw new Error('User level service not found');
      }

      // Get the user's level progress
      const progress = await userLevelService.getUserLevelProgress(userId);
      logger.info(`[CHECK_USER_LEVEL_PROGRESS] User level progress: ${JSON.stringify(progress)}`);

      if (!progress) {
        // Create the response content for when no progress is found
        const responseContent: Content = {
          text: 'Unable to retrieve your level progress at this time.',
          actions: ['CHECK_USER_LEVEL_PROGRESS'],
          source: message.content.source,
          data: {
            userId,
            error: 'No progress data found',
          },
        };

        // Call back with the response
        await callback(responseContent);

        return responseContent;
      }

      // Format the requirements for display
      const requirementsText = progress.requirements
        .map((req) => {
          const status = req.completed ? '✅' : '❌';
          if (typeof req.required === 'boolean') {
            return `${status} ${req.description}`;
          } else {
            return `${status} ${req.description}: ${req.current}/${req.required}`;
          }
        })
        .join('\n');

      // Create the response content
      const responseContent: Content = {
        text: `You are currently at Level ${progress.currentLevel} and are ${progress.progressPercentage}% of the way to Level ${progress.nextLevel}.\n\nRequirements for Level ${progress.nextLevel}:\n${requirementsText}`,
        actions: ['CHECK_USER_LEVEL_PROGRESS'],
        source: message.content.source,
        data: {
          userId,
          currentLevel: progress.currentLevel,
          nextLevel: progress.nextLevel,
          progressPercentage: progress.progressPercentage,
          requirements: progress.requirements,
        },
      };

      // Call back with the response
      await callback(responseContent);

      return responseContent;
    } catch (error) {
      logger.error('[CHECK_USER_LEVEL_PROGRESS] Error in CHECK_USER_LEVEL_PROGRESS action:', error);
      throw error;
    }
  },

  examples: [
    [
      {
        name: '{{name1}}',
        content: {
          text: 'What is my level progress?',
          userId: 'user123',
        },
      },
      {
        name: '{{name2}}',
        content: {
          text: 'You are currently at Level 2 and are 50% of the way to Level 3.\n\nRequirements for Level 3:\n✅ Create Discord Server\n❌ Discord Members: 2/4',
          actions: ['CHECK_USER_LEVEL_PROGRESS'],
          data: {
            userId: 'user123',
            currentLevel: 2,
            nextLevel: 3,
            progressPercentage: 50,
            requirements: [
              {
                metric: 'discord_created',
                description: 'Create Discord Server',
                required: true,
                current: true,
                completed: true,
              },
              {
                metric: 'discord_members',
                description: 'Discord Members',
                required: 4,
                current: 2,
                completed: false,
              },
            ],
          },
        },
      },
    ],
  ],
};
