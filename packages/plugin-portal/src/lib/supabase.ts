import { createClient } from '@supabase/supabase-js';
import { logger } from '@elizaos/core';

// Define the environment variables needed for Supabase
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Check if the required environment variables are set
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    logger.warn('Supabase environment variables are not set. Supabase functionality will not work.');
}

// Create and export the Supabase client
export const supabase = createClient(
    SUPABASE_URL || '',
    SUPABASE_ANON_KEY || '',
    {
        auth: {
            persistSession: false,
        },
    }
);

// User level interface
export interface UserLevel {
    id: string;
    user_id: string;
    level: number;
    created_at: string;
    updated_at: string;
}

// Function to fetch user level from Supabase
export async function fetchUserLevel(userId: string): Promise<UserLevel | null> {
    try {
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
            logger.error('Supabase environment variables are not set');
            return null;
        }

        const { data, error } = await supabase
            .from('user_levels')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) {
            logger.error('Error fetching user level:', error);
            return null;
        }

        return data as UserLevel;
    } catch (error) {
        logger.error('Exception while fetching user level:', error);
        return null;
    }
}

// Function to update user level in Supabase
export async function updateUserLevel(userId: string, level: number): Promise<boolean> {
    try {
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
            logger.error('Supabase environment variables are not set');
            return false;
        }

        const { error } = await supabase
            .from('user_levels')
            .upsert({
                user_id: userId,
                level: level,
                updated_at: new Date().toISOString(),
            });

        if (error) {
            logger.error('Error updating user level:', error);
            return false;
        }

        return true;
    } catch (error) {
        logger.error('Exception while updating user level:', error);
        return false;
    }
} 