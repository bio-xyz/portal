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
 * Action to check if a user has met the requirements for a specific level
 */
export const checkLevelRequirementsAction: Action = {
  name: 'CHECK_LEVEL_REQUIREMENTS',
  similes: ['VERIFY_LEVEL_REQUIREMENTS', 'VALIDATE_LEVEL_REQUIREMENTS'],
  description: 'Checks if a user has met the requirements for a specific level',

  validate: async (runtime: IAgentRuntime, message: Memory, state: State): Promise<boolean> => {
    // Check if we have a user ID in the message or state
    const userId = message.content.userId || message.content.user_id || state.values?.userId;

    if (!userId) {
      logger.warn(
        '[CHECK_LEVEL_REQUIREMENTS] No user ID provided for CHECK_LEVEL_REQUIREMENTS action'
      );
      logger.info(`[CHECK_LEVEL_REQUIREMENTS] Message content: ${JSON.stringify(message.content)}`);
      logger.info(`[CHECK_LEVEL_REQUIREMENTS] State values: ${JSON.stringify(state.values)}`);
      return false;
    }

    // Check if we have a level in the message or state
    const level = message.content.level || state.values?.level;

    if (!level || typeof level !== 'number') {
      logger.warn(
        '[CHECK_LEVEL_REQUIREMENTS] No level provided for CHECK_LEVEL_REQUIREMENTS action'
      );
      logger.info(`[CHECK_LEVEL_REQUIREMENTS] Message content: ${JSON.stringify(message.content)}`);
      logger.info(`[CHECK_LEVEL_REQUIREMENTS] State values: ${JSON.stringify(state.values)}`);
      return false;
    }

    logger.info(`[CHECK_LEVEL_REQUIREMENTS] User ID found: ${userId}, Level: ${level}`);
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
      logger.info('[CHECK_LEVEL_REQUIREMENTS] Handling CHECK_LEVEL_REQUIREMENTS action');

      // Get the user ID from the message or state
      const userId = message.content.userId || message.content.user_id || state.values?.userId;

      if (!userId || typeof userId !== 'string') {
        logger.error(`[CHECK_LEVEL_REQUIREMENTS] Invalid user ID: ${userId}`);
        throw new Error('Invalid user ID provided for CHECK_LEVEL_REQUIREMENTS action');
      }

      // Get the level from the message or state
      const level = message.content.level || state.values?.level;

      if (!level || typeof level !== 'number') {
        logger.error(`[CHECK_LEVEL_REQUIREMENTS] Invalid level: ${level}`);
        throw new Error('Invalid level provided for CHECK_LEVEL_REQUIREMENTS action');
      }

      logger.info(`[CHECK_LEVEL_REQUIREMENTS] Using user ID: ${userId}, Level: ${level}`);

      // Get the user level service
      const userLevelService = runtime.getService('user-level') as UserLevelService;
      if (!userLevelService) {
        logger.error('[CHECK_LEVEL_REQUIREMENTS] User level service not found');
        throw new Error('User level service not found');
      }

      // Check if the user has met the requirements for the specified level
      const hasMetRequirements = await userLevelService.hasMetLevelRequirements(userId, level);
      logger.info(
        `[CHECK_LEVEL_REQUIREMENTS] User has met requirements for level ${level}: ${hasMetRequirements}`
      );

      // Create the response content
      const responseContent: Content = {
        text: hasMetRequirements
          ? `You have met all the requirements for Level ${level}!`
          : `You have not yet met all the requirements for Level ${level}.`,
        actions: ['CHECK_LEVEL_REQUIREMENTS'],
        source: message.content.source,
        data: {
          userId,
          level,
          hasMetRequirements,
        },
      };

      // Call back with the response
      await callback(responseContent);

      return responseContent;
    } catch (error) {
      logger.error('[CHECK_LEVEL_REQUIREMENTS] Error in CHECK_LEVEL_REQUIREMENTS action:', error);
      throw error;
    }
  },

  examples: [
    [
      {
        name: '{{name1}}',
        content: {
          text: 'Have I met the requirements for level 3?',
          userId: 'user123',
          level: 3,
        },
      },
      {
        name: '{{name2}}',
        content: {
          text: 'You have not yet met all the requirements for Level 3.',
          actions: ['CHECK_LEVEL_REQUIREMENTS'],
          data: {
            userId: 'user123',
            level: 3,
            hasMetRequirements: false,
          },
        },
      },
    ],
  ],
};
