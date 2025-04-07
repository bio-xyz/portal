import { supabase } from '../supabase-client';

/**
 * Initialize a new user with default level 1
 */
export async function initializeUserLevel(userId: string) {
  const { data, error } = await supabase
    .from('user_levels')
    .insert({
      user_id: userId,
      level: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get the current level for a user
 */
export async function getUserLevel(userId: string) {
  const { data, error } = await supabase
    .from('user_levels')
    .select('level, updated_at')
    .eq('user_id', userId)
    .single();

  if (error) {
    // If the record doesn't exist, initialize it
    if (error.code === 'PGRST116') {
      return await initializeUserLevel(userId);
    }
    throw error;
  }

  return data;
}

/**
 * Update the user's level
 */
export async function updateUserLevel(userId: string, newLevel: number) {
  const { data, error } = await supabase
    .from('user_levels')
    .update({
      level: newLevel,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Increment the user's level by 1
 */
export async function incrementUserLevel(userId: string) {
  // First get the current level
  const { level } = await getUserLevel(userId);

  // Then increment it
  return updateUserLevel(userId, level + 1);
}
