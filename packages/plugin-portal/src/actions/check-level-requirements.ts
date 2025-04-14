import {
    type Action,
    type Content,
    type HandlerCallback,
    type IAgentRuntime,
    type Memory,
    type State,
    logger,
    type Service,
} from '@elizaos/core';
import { type UserLevelService } from '../services/user-level-service';

interface MessageContent {
    userId: string;
}

/**
 * Action to check if a user has met the requirements for the next level
 */
export const checkLevelRequirementsAction: Action = {
    name: 'checkLevelRequirements',
    similes: ['VERIFY_LEVEL_REQUIREMENTS', 'ASSESS_LEVEL_PROGRESS'],
    description: 'Check if a user has met the requirements for the next level',

    validate: async (
        runtime: IAgentRuntime,
        message: Memory,
        _state: any
    ): Promise<boolean> => {
        const content = message.content as unknown as MessageContent;
        if (!content?.userId) {
            console.warn('No userId provided in message content');
            return false;
        }
        return true;
    },

    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        _state: any,
        _options: any,
        callback: HandlerCallback,
        _responses: Memory[]
    ) => {
        const userLevelService = runtime.getService('user-level') as UserLevelService;
        const content = message.content as unknown as MessageContent;
        const userId = content.userId;

        // Get current level
        const currentLevel = await userLevelService.getUserLevel(userId);
        if (!currentLevel) {
            const response: Content = {
                text: 'Unable to determine your current level. Please try again later.',
                data: { success: false }
            };
            await callback(response);
            return response;
        }

        // Get requirements for next level
        const nextLevel = currentLevel + 1;
        const requirements = await userLevelService.getLevelRequirements(nextLevel);

        // Check which requirements are met
        const unmetRequirements = await userLevelService.checkRequirements(userId, nextLevel);

        const response: Content = unmetRequirements.length === 0
            ? {
                text: `Congratulations! You have met all requirements for level ${nextLevel}. You can now proceed to the next level.`,
                data: {
                    success: true,
                    level: nextLevel,
                    requirementsMet: true
                }
            }
            : {
                text: `You still need to complete the following requirements for level ${nextLevel}:\n${unmetRequirements.map(req => `- ${req}`).join('\n')}`,
                data: {
                    success: true,
                    level: nextLevel,
                    requirementsMet: false,
                    unmetRequirements
                }
            };

        await callback(response);
        return response;
    },

    examples: [
        [
            {
                name: '{{name1}}',
                content: {
                    text: 'Have I met all requirements for the next level?',
                    userId: 'user123',
                },
            },
            {
                name: '{{name2}}',
                content: {
                    text: 'You still need to complete the following requirements for level 3:\n- Create a Discord server\n- Invite 4 team members',
                    actions: ['CHECK_LEVEL_REQUIREMENTS'],
                    data: {
                        userId: 'user123',
                        currentLevel: 2,
                        nextLevel: 3,
                        requirements: [
                            { id: 'discord_server', description: 'Create a Discord server' },
                            { id: 'team_members', description: 'Invite 4 team members' },
                        ],
                        metRequirements: [],
                        unmetRequirements: [
                            { id: 'discord_server', description: 'Create a Discord server' },
                            { id: 'team_members', description: 'Invite 4 team members' },
                        ],
                    },
                },
            },
        ],
    ],
}; 