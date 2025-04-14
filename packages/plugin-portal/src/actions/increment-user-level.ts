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
 * Action to increment a user's level in Supabase
 */
export const incrementUserLevelAction: Action = {
    name: 'INCREMENT_USER_LEVEL',
    similes: ['LEVEL_UP', 'INCREASE_USER_LEVEL'],
    description: 'Increments the level of a user in the database',

    validate: async (
        runtime: IAgentRuntime,
        message: Memory,
        _state: State
    ): Promise<boolean> => {
        // Check if we have a user ID in the message
        const userId = message.content.userId || message.content.user_id;

        if (!userId) {
            logger.warn('No user ID provided for INCREMENT_USER_LEVEL action');
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
            logger.info('Handling INCREMENT_USER_LEVEL action');

            // Get the user ID from the message
            const userId = message.content.userId || message.content.user_id;

            // Get the user level service
            const userLevelService = runtime.getService('user-level');
            if (!userLevelService) {
                throw new Error('User level service not found');
            }

            // Increment the user level
            const success = await userLevelService.incrementUserLevel(userId);

            // Create the response content
            const responseContent: Content = {
                text: success
                    ? 'Successfully incremented the user\'s level.'
                    : 'Failed to increment the user\'s level.',
                actions: ['INCREMENT_USER_LEVEL'],
                source: message.content.source,
                data: {
                    userId,
                    success,
                },
            };

            // Call back with the response
            await callback(responseContent);

            return responseContent;
        } catch (error) {
            logger.error('Error in INCREMENT_USER_LEVEL action:', error);
            throw error;
        }
    },

    examples: [
        [
            {
                name: '{{name1}}',
                content: {
                    text: 'Level me up',
                    userId: 'user123',
                },
            },
            {
                name: '{{name2}}',
                content: {
                    text: 'Successfully incremented the user\'s level.',
                    actions: ['INCREMENT_USER_LEVEL'],
                    data: {
                        userId: 'user123',
                        success: true,
                    },
                },
            },
        ],
    ],
}; 