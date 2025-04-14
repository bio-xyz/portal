import {
    type Action,
    type Content,
    type HandlerCallback,
    type IAgentRuntime,
    type Memory,
    type State,
    logger,
} from '@elizaos/core';

// Import the sendEmailAction to reuse its functionality
import { sendEmailAction } from './send-email';

/**
 * Action to send a level-up email to a user
 */
export const sendLevelUpEmailAction: Action = {
    name: 'SEND_LEVEL_UP_EMAIL',
    similes: ['NOTIFY_LEVEL_UP', 'EMAIL_LEVEL_UP', 'CONGRATULATE_USER'],
    description: 'Sends a congratulatory email to a user when they level up',

    validate: async (
        runtime: IAgentRuntime,
        message: Memory,
        _state: State
    ): Promise<boolean> => {
        // Validate that we have the required data
        const levelData = message.content.data as LevelUpEmailData | undefined;
        return !!(
            levelData?.email &&
            levelData?.level &&
            levelData?.username
        );
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
            logger.info('Handling SEND_LEVEL_UP_EMAIL action');

            // Extract level-up data from the message
            const levelData = message.content.data as LevelUpEmailData;

            if (!levelData.email || !levelData.level || !levelData.username) {
                const errorContent: Content = {
                    text: "I couldn't send the level-up email because some required information is missing. Please provide the user's email, username, and new level.",
                    source: message.content.source,
                };
                await callback(errorContent);
                return errorContent;
            }

            // Generate the email content based on the level
            const { subject, html } = generateLevelUpEmail(levelData.level, levelData.username);

            // Create a new memory with the email data
            const emailMemory: Memory = {
                ...message,
                content: {
                    ...message.content,
                    data: {
                        to: levelData.email,
                        subject,
                        html,
                        from: 'BioDAO <noreply@biodao.xyz>',
                    },
                },
            };

            // Use the sendEmailAction to send the email
            const emailContent = await sendEmailAction.handler(
                runtime,
                emailMemory,
                _state,
                _options,
                callback,
                _responses
            );

            // Create the response content
            const responseContent: Content = {
                text: `Level-up email sent successfully to ${levelData.username} (${levelData.email}).`,
                actions: ['SEND_LEVEL_UP_EMAIL'],
                source: message.content.source,
                data: {
                    emailSent: true,
                    recipient: levelData.email,
                    username: levelData.username,
                    level: levelData.level,
                },
            };

            // Call back with the response
            await callback(responseContent);

            return responseContent;
        } catch (error) {
            logger.error('Error in SEND_LEVEL_UP_EMAIL action:', error);
            throw error;
        }
    },

    examples: [
        [
            {
                name: '{{name1}}',
                content: {
                    text: 'Send a level up email to the user',
                    data: {
                        email: 'user@example.com',
                        username: 'BioScientist',
                        level: 3,
                    },
                },
            },
            {
                name: '{{name2}}',
                content: {
                    text: 'Level-up email sent successfully to BioScientist (user@example.com).',
                    actions: ['SEND_LEVEL_UP_EMAIL'],
                    data: {
                        emailSent: true,
                        recipient: 'user@example.com',
                        username: 'BioScientist',
                        level: 3,
                    },
                },
            },
        ],
    ],
};

// Define the level-up email data interface
interface LevelUpEmailData {
    email: string;
    username: string;
    level: number;
}

/**
 * Generate the email content based on the level
 */
function generateLevelUpEmail(level: number, username: string): { subject: string; html: string } {
    let subject = '';
    let html = '';

    switch (level) {
        case 2:
            subject = `Congratulations ${username}! You've Reached Level 2 in BioDAO`;
            html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                    <h1 style="color: #4a6cf7; text-align: center;">Congratulations ${username}!</h1>
                    <p>You've successfully reached <strong>Level 2</strong> in the BioDAO community!</p>
                    <p>You've minted your Science NFTs, which is a significant step in your journey.</p>
                    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="margin-top: 0;">What's Next?</h3>
                        <p>To reach Level 3, you need to:</p>
                        <ul>
                            <li>Create a Discord server</li>
                            <li>Invite at least 4 members to your Discord</li>
                        </ul>
                    </div>
                    <p>Keep up the great work and continue building your scientific community!</p>
                    <p style="text-align: center; margin-top: 30px;">
                        <a href="https://biodao.xyz" style="background-color: #4a6cf7; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Visit BioDAO</a>
                    </p>
                </div>
            `;
            break;
        case 3:
            subject = `Amazing work ${username}! You've Reached Level 3 in BioDAO`;
            html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                    <h1 style="color: #4a6cf7; text-align: center;">Amazing work ${username}!</h1>
                    <p>You've successfully reached <strong>Level 3</strong> in the BioDAO community!</p>
                    <p>You've created a Discord server and invited at least 4 members, which is a significant achievement.</p>
                    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="margin-top: 0;">What's Next?</h3>
                        <p>To reach Level 4, you need to:</p>
                        <ul>
                            <li>Grow your Discord to at least 10 members</li>
                            <li>Share at least 25 scientific papers</li>
                            <li>Send at least 100 messages</li>
                        </ul>
                    </div>
                    <p>Keep growing your community and sharing knowledge!</p>
                    <p style="text-align: center; margin-top: 30px;">
                        <a href="https://biodao.xyz" style="background-color: #4a6cf7; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Visit BioDAO</a>
                    </p>
                </div>
            `;
            break;
        case 4:
            subject = `Incredible achievement ${username}! You've Reached Level 4 in BioDAO`;
            html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                    <h1 style="color: #4a6cf7; text-align: center;">Incredible achievement ${username}!</h1>
                    <p>You've successfully reached <strong>Level 4</strong> in the BioDAO community!</p>
                    <p>You've grown your Discord to at least 10 members, shared 25 scientific papers, and sent 100 messages. This is a remarkable achievement!</p>
                    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="margin-top: 0;">What's Next?</h3>
                        <p>You've reached the highest level in the BioDAO community! Now you can:</p>
                        <ul>
                            <li>Apply for the sandbox program</li>
                            <li>Collaborate with other high-level members</li>
                            <li>Contribute to the BioDAO ecosystem</li>
                        </ul>
                    </div>
                    <p>Thank you for your dedication to building the BioDAO community!</p>
                    <p style="text-align: center; margin-top: 30px;">
                        <a href="https://biodao.xyz" style="background-color: #4a6cf7; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Visit BioDAO</a>
                    </p>
                </div>
            `;
            break;
        default:
            subject = `Congratulations ${username}! You've Reached Level ${level} in BioDAO`;
            html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                    <h1 style="color: #4a6cf7; text-align: center;">Congratulations ${username}!</h1>
                    <p>You've successfully reached <strong>Level ${level}</strong> in the BioDAO community!</p>
                    <p>Keep up the great work and continue building your scientific community!</p>
                    <p style="text-align: center; margin-top: 30px;">
                        <a href="https://biodao.xyz" style="background-color: #4a6cf7; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Visit BioDAO</a>
                    </p>
                </div>
            `;
    }

    return { subject, html };
} 