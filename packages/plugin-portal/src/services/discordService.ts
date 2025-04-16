import { IAgentRuntime, Service, logger } from '@elizaos/core';
import { supabase } from '../lib/supabase'; // Assuming supabase client is configured

// Placeholder types for external bot data structure
interface DiscordMetrics {
    memberCount: number;
    paperShares: number;
    totalMessages: number;
    lastUpdated: Date;
}

export class DiscordService extends Service {
    public readonly capabilityDescription = "Handles storing user Discord server info and fetching community metrics (via external bot).";

    constructor(runtime: IAgentRuntime) {
        super(runtime);
    }

    /**
     * Stores the user's provided Discord server information using the 'user_discord_info' table.
     */
    async storeUserServerInfo(privyId: string, serverId: string, inviteLink: string): Promise<boolean> {
        logger.info(`[DiscordService] Storing server info for ${privyId}: ServerID=${serverId}, Invite=${inviteLink}`);
        try {
            // Upsert into the user_discord_info table
            const { error } = await supabase
                .from('user_discord_info')
                .upsert({
                    privy_id: privyId,
                    server_id: serverId,
                    invite_link: inviteLink,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'privy_id' }); // Use privy_id as the conflict target

            if (error) {
                logger.error(`[DiscordService] Failed to store server info for ${privyId}:`, error);
                return false;
            }
            logger.info(`[DiscordService] Successfully stored/updated server info for ${privyId}.`);
            return true;
        } catch (error) {
            logger.error(`[DiscordService] Exception storing server info for ${privyId}:`, error);
            return false;
        }
    }

    /**
     * Retrieves the stored server ID for a given user from the 'user_discord_info' table.
     */
    async getUserServerId(privyId: string): Promise<string | null> {
        logger.info(`[DiscordService] Getting server ID for ${privyId}`);
        try {
            // Select server_id from user_discord_info table
            const { data, error } = await supabase
                .from('user_discord_info')
                .select('server_id')
                .eq('privy_id', privyId)
                .maybeSingle(); // Use maybeSingle to handle 0 or 1 row without error

            if (error) {
                // Log any error that isn't just "no rows found"
                logger.error(`[DiscordService] Failed to get server ID for ${privyId}:`, error);
                return null;
            }

            if (data?.server_id) {
                logger.info(`[DiscordService] Found server ID ${data.server_id} for ${privyId}.`);
                return data.server_id;
            } else {
                logger.info(`[DiscordService] No server ID found for ${privyId}.`);
                return null;
            }

        } catch (error) {
            logger.error(`[DiscordService] Exception getting server ID for ${privyId}:`, error);
            return null;
        }
    }

    /**
     * Retrieves the latest tracked metrics for a given Discord server.
     * TODO: Implement logic to fetch data reported by the external tracking bot.
     * This might involve querying a database table updated by the bot, calling a bot API, or reading from a cache.
     */
    async getDiscordMetrics(serverId: string): Promise<DiscordMetrics | null> {
        logger.info(`[DiscordService] Getting metrics for server ID: ${serverId}`);
        if (!serverId) {
            logger.warn('[DiscordService] Cannot get metrics without a server ID.');
            return null;
        }
        try {
            // Placeholder: Replace with actual logic to fetch metrics
            // This data should originate from the external tracking bot.
            logger.warn(`[DiscordService] Metrics fetching from external bot/data source is not implemented yet.`);
            // Return mock data for testing purposes, or null
            /*
            return {
                memberCount: 5, // Example data
                paperShares: 10,
                totalMessages: 50,
                lastUpdated: new Date()
            };
            */
            return null;
        } catch (error) {
            logger.error(`[DiscordService] Exception getting metrics for server ${serverId}:`, error);
            return null;
        }
    }

    // Required by Service base class
    async start(): Promise<void> {
        logger.info('[DiscordService] DiscordService started');
    }
    async stop(): Promise<void> {
        logger.info('[DiscordService] DiscordService stopped');
    }
} 