import {
    type Action,
    type Content,
    type HandlerCallback,
    type IAgentRuntime,
    type Memory,
    type State,
    logger,
} from '@elizaos/core';

/**
 * Action to fetch a user's level from Supabase
 */
export const fetchUserLevelAction: Action = {
    name: 'FETCH_USER_LEVEL',
    similes: ['GET_USER_LEVEL', 'CHECK_USER_LEVEL'],
    description: 'Fetches the current level of a user from the database',

    validate: async (
        runtime: IAgentRuntime,
        message: Memory,
        _state: State
    ): Promise<boolean> => {
        // Check if we have a user ID in the message
        const userId = message.content.userId || message.content.user_id;
        if (!userId) {
            logger.warn('No user ID provided for FETCH_USER_LEVEL action');
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
            logger.info('Handling FETCH_USER_LEVEL action');

            // Get the user ID from the message
            const userId = message.content.userId || message.content.user_id;

            // Get the user level service
            const userLevelService = runtime.getService('user-level');
            if (!userLevelService) {
                throw new Error('User level service not found');
            }

            // Fetch the user level
            const level = await userLevelService.getUserLevel(userId);

            // Create the response content
            const responseContent: Content = {
                text: level !== null
                    ? `The user's current level is ${level}.`
                    : 'No level found for this user.',
                actions: ['FETCH_USER_LEVEL'],
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
            logger.error('Error in FETCH_USER_LEVEL action:', error);
            throw error;
        }
    },

    examples: [
        [
            {
                name: '{{name1}}',
                content: {
                    text: 'What is my current level?',
                    userId: 'user123',
                },
            },
            {
                name: '{{name2}}',
                content: {
                    text: 'The user\'s current level is 2.',
                    actions: ['FETCH_USER_LEVEL'],
                    data: {
                        userId: 'user123',
                        level: 2,
                    },
                },
            },
        ],
    ],
}; 