import { createClient } from '@supabase/supabase-js';
import { logger } from '@elizaos/core';

// Define the environment variables needed for Supabase
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_KEY;
// Check if the required environment variables are set
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    logger.warn(
        '[Supabase] Supabase environment variables are not set. Supabase functionality will not work.'
    );
} else {
    logger.info('[Supabase] Supabase environment variables are set.');
}

export const supabase = SUPABASE_SERVICE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false
        },
        global: {
            headers: {
                'apikey': SUPABASE_SERVICE_KEY
            }
        }
    })
    : null;

// User level interface
export interface UserLevel {
    id: string;
    privy_id: string;
    level: number;
    created_at: string;
    updated_at: string;
}

// Function to fetch user level from Supabase
export async function fetchUserLevel(privyId: string): Promise<UserLevel | null> {
    try {
        logger.info(`[Supabase] Fetching user level for privy ID: ${privyId}`);

        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
            logger.error('[Supabase] Supabase environment variables are not set');
            return null;
        }

        const { data, error } = await supabase
            .from('user_levels')
            .select('*') // Select all known columns
            .eq('privy_id', privyId)
            .maybeSingle();

        if (error) {
            if (error.code === 'PGRST116') {
                logger.info(`[Supabase] No user level found for privy ID: ${privyId}. Returning null.`);
                return null;
            }
            logger.error(`[Supabase] Error fetching user level for ${privyId}:`, error);
            return null;
        }

        logger.info({ levelData: data }, `[Supabase] User level data for ${privyId}`);
        return data as UserLevel;
    } catch (error) {
        logger.error(`[Supabase] Exception while fetching user level for ${privyId}:`, error);
        return null;
    }
}

// Function to update user level in Supabase
export async function updateUserLevel(privyId: string, level: number): Promise<boolean> {
    try {
        logger.info(`[Supabase] Updating user level for privy ID: ${privyId} to level: ${level}`);

        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
            logger.error('[Supabase] Supabase environment variables are not set');
            return false;
        }

        const { error } = await supabase.from('user_levels').upsert(
            {
                privy_id: privyId,
                level: level,
                updated_at: new Date().toISOString(),
            },
            {
                onConflict: 'privy_id',
            }
        );

        if (error) {
            logger.error(`[Supabase] Error updating user level for ${privyId}:`, error);
            return false;
        }

        logger.info(`[Supabase] Successfully updated user level for ${privyId} to ${level}`);
        return true;
    } catch (error) {
        logger.error(`[Supabase] Exception while updating user level for ${privyId}:`, error);
        return false;
    }
}
