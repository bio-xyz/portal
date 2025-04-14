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
 * Action to generate a Discord bot invitation link for the BioDAO bot
 */
export const inviteDiscordBotAction: Action = {
    name: 'INVITE_DISCORD_BOT',
    similes: ['GET_DISCORD_INVITE', 'JOIN_DISCORD_SERVER', 'ADD_BOT_TO_DISCORD'],
    description: 'Generates an invitation link for the BioDAO Discord bot',

    validate: async (
        runtime: IAgentRuntime,
        message: Memory,
        _state: State
    ): Promise<boolean> => {
        // No specific validation needed for this action
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
            logger.info('Handling INVITE_DISCORD_BOT action');

            // Get the Discord bot client ID from environment variables or configuration
            const clientId = process.env.DISCORD_BOT_CLIENT_ID || '123456789012345678';

            // Define the required permissions for the bot
            // These permissions allow the bot to:
            // - Read messages and view channels
            // - Send messages
            // - Read message history
            // - Add reactions
            // - Use external emojis
            // - Create public threads
            // - Send messages in threads
            // - Manage messages
            // - Embed links
            // - Attach files
            // - Read message history
            // - Use slash commands
            const permissions = '274878221312';

            // Generate the invitation URL
            const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=${permissions}&scope=bot%20applications.commands`;

            // Create the response content
            const responseContent: Content = {
                text: `Here's the invitation link for the BioDAO Discord bot. Click the link to add the bot to your server:\n\n${inviteUrl}\n\nOnce added, the bot will help track member counts and other metrics for your DAO.`,
                actions: ['INVITE_DISCORD_BOT'],
                source: message.content.source,
                data: {
                    inviteUrl,
                    clientId,
                },
            };

            // Call back with the response
            await callback(responseContent);

            return responseContent;
        } catch (error) {
            logger.error('Error in INVITE_DISCORD_BOT action:', error);
            throw error;
        }
    },

    examples: [
        [
            {
                name: '{{name1}}',
                content: {
                    text: 'How can I add the BioDAO bot to my Discord server?',
                },
            },
            {
                name: '{{name2}}',
                content: {
                    text: 'Here\'s the invitation link for the BioDAO Discord bot. Click the link to add the bot to your server:\n\nhttps://discord.com/api/oauth2/authorize?client_id=123456789012345678&permissions=274878221312&scope=bot%20applications.commands\n\nOnce added, the bot will help track member counts and other metrics for your DAO.',
                    actions: ['INVITE_DISCORD_BOT'],
                    data: {
                        inviteUrl: 'https://discord.com/api/oauth2/authorize?client_id=123456789012345678&permissions=274878221312&scope=bot%20applications.commands',
                        clientId: '123456789012345678',
                    },
                },
            },
        ],
    ],
}; 