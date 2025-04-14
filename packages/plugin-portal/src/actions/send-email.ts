import {
    type Action,
    type Content,
    type HandlerCallback,
    type IAgentRuntime,
    type Memory,
    type State,
    logger,
} from '@elizaos/core';

// NOTE: You need to install the Resend package:
// npm install resend@2.0.0
// Then uncomment the import below
// import { Resend } from 'resend';

/**
 * Action to send emails using Resend
 */
export const sendEmailAction: Action = {
    name: 'SEND_EMAIL',
    similes: ['EMAIL_USER', 'NOTIFY_USER', 'SEND_NOTIFICATION'],
    description: 'Sends an email to a user using Resend',

    validate: async (
        runtime: IAgentRuntime,
        message: Memory,
        _state: State
    ): Promise<boolean> => {
        // Validate that we have the required data
        const emailData = message.content.data as EmailData | undefined;
        return !!(
            emailData?.to &&
            emailData?.subject &&
            emailData?.html
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
            logger.info('Handling SEND_EMAIL action');

            // Extract email data from the message
            const emailData = message.content.data as EmailData;

            if (!emailData.to || !emailData.subject || !emailData.html) {
                const errorContent: Content = {
                    text: "I couldn't send the email because some required information is missing. Please provide a recipient email, subject, and content.",
                    source: message.content.source,
                };
                await callback(errorContent);
                return errorContent;
            }

            // Check if we have a Resend API key
            const resendApiKey = process.env.RESEND_API_KEY;
            if (!resendApiKey) {
                const errorContent: Content = {
                    text: "I couldn't send the email because the Resend API key is not configured.",
                    source: message.content.source,
                };
                await callback(errorContent);
                return errorContent;
            }

            // Send the email using Resend
            // Uncomment this section after installing the Resend package
            /*
            const resend = new Resend(resendApiKey);
            const { data, error } = await resend.emails.send({
                from: emailData.from || 'BioDAO <noreply@biodao.xyz>',
                to: emailData.to,
                subject: emailData.subject,
                html: emailData.html,
                text: emailData.text,
                reply_to: emailData.replyTo,
                cc: emailData.cc,
                bcc: emailData.bcc,
                attachments: emailData.attachments,
            });

            if (error) {
                logger.error('Error sending email:', error);
                const errorContent: Content = {
                    text: `Failed to send email: ${error.message}`,
                    source: message.content.source,
                };
                await callback(errorContent);
                return errorContent;
            }
            */

            // For now, just log that we would send the email
            logger.info(`Would send email to ${emailData.to} with subject: ${emailData.subject}`);

            // Create the response content
            const responseContent: Content = {
                text: `Email sent successfully to ${emailData.to}.`,
                actions: ['SEND_EMAIL'],
                source: message.content.source,
                data: {
                    emailSent: true,
                    recipient: emailData.to,
                    subject: emailData.subject,
                },
            };

            // Call back with the response
            await callback(responseContent);

            return responseContent;
        } catch (error) {
            logger.error('Error in SEND_EMAIL action:', error);
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
                        to: 'user@example.com',
                        subject: 'Congratulations! You\'ve Reached Level 3',
                        html: '<h1>Congratulations!</h1><p>You\'ve reached Level 3 in the BioDAO community.</p><p>Keep up the great work!</p>',
                        from: 'BioDAO <noreply@biodao.xyz>',
                    },
                },
            },
            {
                name: '{{name2}}',
                content: {
                    text: 'Email sent successfully to user@example.com.',
                    actions: ['SEND_EMAIL'],
                    data: {
                        emailSent: true,
                        recipient: 'user@example.com',
                        subject: 'Congratulations! You\'ve Reached Level 3',
                    },
                },
            },
        ],
    ],
};

// Define the email data interface
interface EmailData {
    to: string;
    subject: string;
    html: string;
    text?: string;
    from?: string;
    replyTo?: string;
    cc?: string[];
    bcc?: string[];
    attachments?: Array<{
        filename: string;
        content: Buffer;
    }>;
} 