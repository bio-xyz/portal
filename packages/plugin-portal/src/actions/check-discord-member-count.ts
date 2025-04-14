import {
    type Action,
    type Content,
    type HandlerCallback,
    type IAgentRuntime,
    type Memory,
    type State,
    logger,
} from '@elizaos/core';
import fetch from 'node-fetch';

// Define interfaces for the data structures
interface DiscordServerData {
    serverId?: string;
    serverName?: string;
    memberCount?: number;
}

/**
 * Action to check the member count of a Discord server
 */
export const checkDiscordMemberCountAction: Action = {
    name: 'CHECK_DISCORD_MEMBER_COUNT',
    similes: ['GET_DISCORD_MEMBERS', 'CHECK_SERVER_SIZE', 'VERIFY_DISCORD_SERVER'],
    description: 'Checks the member count of a Discord server',

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
            logger.info('Handling CHECK_DISCORD_MEMBER_COUNT action');

            // Extract server ID from the message or state
            // This could be stored in state.data.serverId or extracted from the message
            const messageData = message.content.data as DiscordServerData | undefined;
            const stateData = _state.data as DiscordServerData | undefined;

            const serverId = messageData?.serverId ||
                stateData?.serverId ||
                extractServerIdFromMessage(message.content.text);

            if (!serverId) {
                const errorContent: Content = {
                    text: "I couldn't find a Discord server ID. Please provide the server ID or make sure the bot has been added to your server.",
                    source: message.content.source,
                };
                await callback(errorContent);
                return errorContent;
            }

            // Call the API to verify the server and get member count
            const response = await fetch(`${process.env.API_BASE_URL || 'http://localhost:3000'}/api/discord/verify-server`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ serverId }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                const errorContent: Content = {
                    text: `Failed to verify Discord server: ${errorData.error || 'Unknown error'}`,
                    source: message.content.source,
                };
                await callback(errorContent);
                return errorContent;
            }

            const data = await response.json();

            if (!data.success || !data.server) {
                const errorContent: Content = {
                    text: "I couldn't verify your Discord server. Make sure the bot has been added to your server and try again.",
                    source: message.content.source,
                };
                await callback(errorContent);
                return errorContent;
            }

            const { name, memberCount } = data.server;

            // Create the response content
            const responseContent: Content = {
                text: `Your Discord server "${name}" currently has ${memberCount} members.`,
                actions: ['CHECK_DISCORD_MEMBER_COUNT'],
                source: message.content.source,
                data: {
                    serverId,
                    serverName: name,
                    memberCount,
                },
            };

            // Call back with the response
            await callback(responseContent);

            return responseContent;
        } catch (error) {
            logger.error('Error in CHECK_DISCORD_MEMBER_COUNT action:', error);
            throw error;
        }
    },

    examples: [
        [
            {
                name: '{{name1}}',
                content: {
                    text: 'How many members are in my Discord server?',
                    data: {
                        serverId: '123456789012345678',
                    },
                },
            },
            {
                name: '{{name2}}',
                content: {
                    text: 'Your Discord server "BioDAO Community" currently has 7 members.',
                    actions: ['CHECK_DISCORD_MEMBER_COUNT'],
                    data: {
                        serverId: '123456789012345678',
                        serverName: 'BioDAO Community',
                        memberCount: 7,
                    },
                },
            },
        ],
    ],
};

/**
 * Helper function to extract a Discord server ID from a message
 * This is a simple implementation that looks for a pattern like "server: 123456789012345678"
 * or just a 18-19 digit number that could be a Discord ID
 */
function extractServerIdFromMessage(text: string): string | null {
    if (!text) return null;

    // Try to find a pattern like "server: 123456789012345678"
    const serverPattern = /server:?\s*(\d{17,19})/i;
    const serverMatch = text.match(serverPattern);
    if (serverMatch && serverMatch[1]) {
        return serverMatch[1];
    }

    // Try to find just a 18-19 digit number that could be a Discord ID
    const idPattern = /\b(\d{17,19})\b/;
    const idMatch = text.match(idPattern);
    if (idMatch && idMatch[1]) {
        return idMatch[1];
    }

    return null;
} 