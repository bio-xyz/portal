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

// Create and export the Supabase client
export const supabase = createClient(
  SUPABASE_URL || '',
  SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY || '',
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
    logger.info(`[Supabase] Fetching user level for user ID: ${userId}`);

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      logger.error('[Supabase] Supabase environment variables are not set');
      return null;
    }

    const { data, error } = await supabase
      .from('user_levels')
      .select('*')
      .eq('privy_id', userId)
      .single();

    if (error) {
      logger.error(`[Supabase] Error fetching user level for ${userId}:`, error);
      return null;
    }

    logger.info(`[Supabase] User level data for ${userId}: ${JSON.stringify(data)}`);
    return data as UserLevel;
  } catch (error) {
    logger.error(`[Supabase] Exception while fetching user level for ${userId}:`, error);
    return null;
  }
}

// Function to update user level in Supabase
export async function updateUserLevel(userId: string, level: number): Promise<boolean> {
  try {
    logger.info(`[Supabase] Updating user level for user ID: ${userId} to level: ${level}`);

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      logger.error('[Supabase] Supabase environment variables are not set');
      return false;
    }

    const { error } = await supabase.from('user_levels').upsert({
      user_id: userId,
      level: level,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      logger.error(`[Supabase] Error updating user level for ${userId}:`, error);
      return false;
    }

    logger.info(`[Supabase] Successfully updated user level for ${userId} to ${level}`);
    return true;
  } catch (error) {
    logger.error(`[Supabase] Exception while updating user level for ${userId}:`, error);
    return false;
  }
}
