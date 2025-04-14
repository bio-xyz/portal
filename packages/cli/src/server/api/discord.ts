import express, { Request, Response } from 'express';
import fetch, { Headers } from 'node-fetch'; // Using node-fetch for backend requests
import { logger } from '@elizaos/core';
import dotenv from 'dotenv';
// --- Placeholder Imports - Adjust based on your actual project structure ---
// Assuming you have a way to get an authenticated Supabase admin client
// import { supabaseAdmin } from '../supabase-admin'; 
// Assuming you have an authentication middleware that populates req.user
// import { authenticateRequest } from '../middleware/auth';
// --- End Placeholder Imports ---

// Load environment variables
dotenv.config();


const router = express.Router();

// Define the expected structure for the Discord Guild API response
interface DiscordGuildResponse {
    id: string;
    name: string;
    approximate_member_count?: number; // Optional as per Discord docs
    // Add other fields if needed
}

// Define expected structure for Message Stats Response
interface MessageStatsResponse {
    success: boolean;
    totalUserMessageCount?: number;
    qualityMessageCount?: number;
    averageQualityScore?: number;
    error?: string;
}

// Define interfaces for additional data types
interface DiscordChannel {
    id: string;
    type: number; // 0: GUILD_TEXT, 5: GUILD_ANNOUNCEMENT (Treat as text)
    name: string;
    // Add other fields if needed
}

interface DiscordMessage {
    id: string;
    channel_id: string;
    content: string;
    author: {
        id: string;
        bot?: boolean;
        username: string;
    };
    timestamp: string;
    // Add other fields if needed
}

interface DiscordErrorResponse {
    message: string;
    code: number;
}

interface OpenAIChatChoice { message: { role: string; content: string; }; finish_reason: string; index: number; }
interface OpenAIChatCompletion { id: string; object: string; created: number; model: string; choices: OpenAIChatChoice[]; usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number; }; }

interface FetchMessagesOptions {
    limit?: number; // Max 100
    before?: string; // Message ID
}

interface FetchMessagesResult {
    messages: DiscordMessage[];
    rateLimitRemaining?: number;
    rateLimitResetAfter?: number;
}

// Define constants
const DISCORD_API_BASE = 'https://discord.com/api/v10';
const OPENAI_API_BASE = 'https://api.openai.com/v1';
const MAX_MESSAGES_PER_CHANNEL = 100; // Reduced limit due to AI call cost/latency
const OPENAI_MODEL = 'gpt-3.5-turbo';
const QUALITY_THRESHOLD = 0.15; // Lowered threshold to be more inclusive of quality messages
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const MAX_RETRIES = 3; // Maximum number of retries for OpenAI API calls
const RETRY_DELAY = 1000; // Delay between retries in milliseconds

// Add cache functions for quality scores
interface QualityScoreCache {
    [messageId: string]: {
        score: number;
        timestamp: number;
    };
}

// In-memory cache for quality scores
const qualityScoreCache: QualityScoreCache = {};

// Cache expiration time (24 hours)
const CACHE_EXPIRATION = 24 * 60 * 60 * 1000;

function getCachedQualityScore(messageId: string): number | null {
    const cached = qualityScoreCache[messageId];
    if (!cached) return null;

    // Check if cache is expired
    if (Date.now() - cached.timestamp > CACHE_EXPIRATION) {
        delete qualityScoreCache[messageId];
        return null;
    }

    return cached.score;
}

function cacheQualityScore(messageId: string, score: number): void {
    qualityScoreCache[messageId] = {
        score,
        timestamp: Date.now()
    };
}

// Helper function for Discord API calls
async function callDiscordApi<T>(endpoint: string, botToken: string, method: string = 'GET'): Promise<{ data: T | null; error?: string; status: number }> {
    const url = `${DISCORD_API_BASE}${endpoint}`;
    try {
        const response = await fetch(url, {
            method: method,
            headers: new Headers({ // Use Headers class for type safety
                'Authorization': `Bot ${botToken}`,
                'User-Agent': 'BioDAOAgentServer (API Call, v1.0)',
                'Content-Type': 'application/json', // Needed even for GET sometimes? Better safe.
            }),
        });

        if (!response.ok) {
            let errorData: DiscordErrorResponse | string = `Discord API Error: ${response.status} ${response.statusText}`;
            try {
                const jsonError = await response.json() as DiscordErrorResponse;
                errorData = jsonError.message || errorData;
            } catch (e) { /* Ignore if error response is not JSON */ }
            logger.warn(`[Discord API Call] Failed ${method} ${endpoint}: Status ${response.status}, Error: ${errorData}`);
            return { data: null, error: errorData as string, status: response.status };
        }

        // Handle potential empty response body (e.g., 204 No Content)
        if (response.status === 204) {
            return { data: null, status: response.status };
        }

        const data = await response.json() as T;
        return { data, status: response.status };

    } catch (error) {
        logger.error(`[Discord API Call] Network or other error calling ${method} ${endpoint}:`, error);
        return { data: null, error: error instanceof Error ? error.message : 'Network error during API call', status: 500 };
    }
}

// POST /api/discord/verify-server (WITHOUT AUTHENTICATION)
router.post('/verify-server', async (req: any, res: any) => {
    const { serverId } = req.body;

    if (!serverId || typeof serverId !== 'string') {
        logger.warn('[API /verify-server] Missing or invalid serverId');
        return res.status(400).json({ success: false, error: 'Missing or invalid serverId in request body.' });
    }

    logger.info(`[API /verify-server] Received verification request for serverId: ${serverId} (Unauthenticated)`);

    const botToken = process.env.DISCORD_BOT_TOKEN;

    if (!botToken) {
        logger.error('[API /verify-server] DISCORD_BOT_TOKEN is not configured on the server.');
        return res.status(500).json({ success: false, error: 'Server configuration error.' });
    }

    const { data, error, status } = await callDiscordApi<DiscordGuildResponse>(`/guilds/${serverId}?with_counts=true`, botToken);

    if (error) {
        return res.status(status).json({ success: false, error: error });
    }
    if (data) {
        logger.success(`[API /verify-server] Discord server ${serverId} verified (Unauthenticated): ${data.name} (${data.approximate_member_count || 0} members)`);
        return res.json({
            success: true,
            server: {
                id: serverId,
                name: data.name,
                memberCount: data.approximate_member_count || 0,
            },
        });
    }
    // Should not happen if status was ok, but handle defensively
    logger.error(`[API /verify-server] Unexpected: API call OK but no data for server ${serverId}`);
    return res.status(500).json({ success: false, error: 'Unexpected error verifying server.' });
});

// GET /api/discord/server/:serverId/message-stats
// TODO: Add authentication middleware here
router.get('/server/:serverId/message-stats', async (req: Request<{ serverId: string }>, res: any) => {
    const { serverId } = req.params;
    const botToken = process.env.DISCORD_BOT_TOKEN;
    const openaiApiKey = process.env.OPENAI_API_KEY;

    console.log(`[STATS] Fetching message stats for server: ${serverId}`);

    if (!botToken) {
        console.error(`[STATS] Missing DISCORD_BOT_TOKEN environment variable`);
        return res.status(500).json({ success: false, error: 'Discord bot token not configured' });
    }

    if (!openaiApiKey) {
        console.error(`[STATS] Missing OPENAI_API_KEY environment variable`);
        return res.status(500).json({ success: false, error: 'OpenAI API key not configured' });
    }

    try {
        // Get all channels in the server
        const { data: channels, error: channelsError } = await callDiscordApi<DiscordChannel[]>(
            `/guilds/${serverId}/channels`,
            botToken
        );

        if (channelsError || !channels) {
            console.error(`[STATS] Error fetching channels:`, channelsError);
            return res.status(500).json({ success: false, error: channelsError || 'Failed to fetch channels' });
        }

        console.log(`[STATS] Found ${channels.length} channels in server`);

        // Filter for text channels
        const textChannels = channels.filter(channel => channel.type === 0 || channel.type === 5);
        console.log(`[STATS] Found ${textChannels.length} text channels`);

        // Fetch messages from each channel
        let allMessages: DiscordMessage[] = [];
        let totalUserMessageCount = 0;
        let qualityMessageCount = 0;
        let totalQualityScore = 0;
        let skippedCount = 0;
        let aiCheckCount = 0;
        let errorCount = 0;

        for (const channel of textChannels) {
            console.log(`[STATS] Fetching messages from channel: ${channel.name} (${channel.id})`);
            try {
                const messages = await fetchChannelMessages(channel.id, botToken);
                console.log(`[STATS] Fetched ${messages.length} messages from channel ${channel.name}`);
                allMessages = allMessages.concat(messages);
            } catch (error) {
                console.error(`[STATS] Error fetching messages from channel ${channel.name}:`, error);
                errorCount++;
            }
        }

        console.log(`[STATS] Total messages fetched: ${allMessages.length}`);
        console.log(`[STATS] Channels with errors: ${errorCount}/${textChannels.length}`);

        // Filter out bot messages
        const userMessages = allMessages.filter(msg => !msg.author.bot);
        totalUserMessageCount = userMessages.length;
        console.log(`[STATS] User messages: ${totalUserMessageCount}`);

        // Assess quality of each user message
        for (const message of userMessages) {
            // Removed message length check
            aiCheckCount++;

            try {
                const qualityScore = await assessMessageQuality(message.content, openaiApiKey);
                console.log(`[STATS] Message quality score: ${qualityScore}`);

                totalQualityScore += qualityScore;

                if (qualityScore >= QUALITY_THRESHOLD) {
                    qualityMessageCount++;
                    console.log(`[STATS] Quality message detected! Score: ${qualityScore}, Content: "${message.content.substring(0, 50)}..."`);
                }
            } catch (error) {
                console.error(`[STATS] Error assessing message quality:`, error);
            }
        }

        // Calculate average quality score
        const averageQualityScore = aiCheckCount > 0 ? totalQualityScore / aiCheckCount : 0;

        console.log(`[STATS] Message stats summary:`);
        console.log(`[STATS] - Total user messages: ${totalUserMessageCount}`);
        console.log(`[STATS] - Messages checked by AI: ${aiCheckCount}`);
        console.log(`[STATS] - Messages skipped (too short): ${skippedCount}`);
        console.log(`[STATS] - Quality messages: ${qualityMessageCount}`);
        console.log(`[STATS] - Average quality score: ${averageQualityScore}`);
        console.log(`[STATS] - Quality threshold: 0.15`);

        return res.json({
            success: true,
            totalUserMessageCount,
            qualityMessageCount,
            averageQualityScore
        });
    } catch (error) {
        console.error(`[STATS] Error processing message stats:`, error);
        return res.status(500).json({ success: false, error: 'Failed to process message stats' });
    }
});

// Helper function to fetch messages for a single channel
async function fetchChannelMessages(channelId: string, botToken: string, limitTotal: number = MAX_MESSAGES_PER_CHANNEL): Promise<DiscordMessage[]> {
    let allMessages: DiscordMessage[] = [];
    let beforeId: string | undefined = undefined;
    let messagesFetched = 0;
    const fetchLimit = 100; // Max per API call

    while (messagesFetched < limitTotal) {
        const batchLimit = Math.min(fetchLimit, limitTotal - messagesFetched);
        const endpoint = `/channels/${channelId}/messages?limit=${batchLimit}${beforeId ? `&before=${beforeId}` : ''}`;
        const { data: messagesBatch, error, status } = await callDiscordApi<DiscordMessage[]>(endpoint, botToken);

        if (error || !messagesBatch) {
            logger.warn(`[fetchChannelMessages] Could not fetch messages for channel ${channelId} (Status: ${status}): ${error || 'No data'}`);
            break; // Stop fetching for this channel on error
        }

        if (messagesBatch.length === 0) {
            break; // No more messages
        }

        allMessages = allMessages.concat(messagesBatch);
        messagesFetched += messagesBatch.length;
        beforeId = messagesBatch[messagesBatch.length - 1].id;

        // Simple delay to try and respect rate limits (improve with actual header parsing if needed)
        await new Promise(resolve => setTimeout(resolve, 150));

        if (messagesBatch.length < batchLimit) {
            break; // Got fewer messages than requested, must be the end
        }
    }
    logger.debug(`[fetchChannelMessages] Fetched ${allMessages.length} messages for channel ${channelId}`);
    return allMessages;
}

// --- Helper Function for OpenAI Quality Assessment ---
async function assessMessageQuality(messageContent: string, apiKey: string): Promise<number> {
    // Check cache first
    const cachedScore = getCachedQualityScore(messageContent);
    if (cachedScore !== null) {
        console.log(`[QUALITY] Using cached score for message: ${cachedScore}`);
        return cachedScore;
    }

    console.log(`[QUALITY] Assessing message quality for: "${messageContent.substring(0, 50)}${messageContent.length > 50 ? '...' : ''}"`);

    try {
        const prompt = `You are a scientific content quality assessor. Evaluate the quality of the following message on a scale from 0.0 to 1.0, where:
- 0.0-0.3: Low quality (spam, irrelevant, too short, no substance)
- 0.4-0.7: Medium quality (some relevance, basic information, but limited depth)
- 0.8-1.0: High quality (substantive, relevant, well-reasoned, contributes to scientific discussion)

Consider factors like:
- Relevance to scientific topics
- Depth of information
- Usefulness to the community
- Originality of thought
- Clarity of expression

Message to evaluate: "${messageContent}"

Respond with ONLY a number between 0.0 and 1.0 representing the quality score.`;

        console.log(`[QUALITY] Sending request to OpenAI API with prompt length: ${prompt.length}`);

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.3,
                max_tokens: 10
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[QUALITY] OpenAI API error: ${response.status} ${response.statusText}`);
            console.error(`[QUALITY] Error details: ${errorText}`);
            throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json() as OpenAIChatCompletion;
        console.log(`[QUALITY] OpenAI API response:`, JSON.stringify(data, null, 2));

        const scoreText = data.choices[0]?.message?.content?.trim();
        console.log(`[QUALITY] Raw score text: "${scoreText}"`);

        if (!scoreText) {
            console.error(`[QUALITY] No score text returned from OpenAI API`);
            throw new Error('No score text returned from OpenAI API');
        }

        const score = parseFloat(scoreText);
        console.log(`[QUALITY] Parsed score: ${score}`);

        if (isNaN(score) || score < 0 || score > 1) {
            console.error(`[QUALITY] Invalid score: ${score}`);
            throw new Error(`Invalid score: ${score}`);
        }

        // Cache the score
        cacheQualityScore(messageContent, score);
        console.log(`[QUALITY] Cached score: ${score}`);

        return score;
    } catch (error) {
        console.error(`[QUALITY] Error assessing message quality:`, error);
        // Default to medium quality in case of error
        return 0.5;
    }
}

// Export the router to be used in packages/cli/src/server/index.ts
export default router; 