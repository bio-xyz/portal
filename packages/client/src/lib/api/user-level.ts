import { getSupabase } from '../supabase-client';
import { UserProgress } from '../../types/database.types';

/**
 * Creates or updates a user's level
 * @param privyId The privy id of the user
 * @param level The level to set for the user, defaults to 1
 */
export async function createOrUpdateUserLevel(privyId: string, level: number = 1): Promise<UserProgress> {
    if (!privyId) {
        throw new Error('Privy ID is required to create a user level');
    }

    const supabase = getSupabase();

    // Create or update user level
    const { data, error } = await supabase
        .from('user_levels')
        .upsert({
            privy_id: privyId,
            level: level
        }, {
            onConflict: 'privy_id',
            // Don't update if the record already exists
            ignoreDuplicates: false
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating/updating user level:', error);
        if (error.code === '42501') {
            console.error('RLS Error: Ensure JWT has correct privy_id claim and RLS policies allow operation.');
        }
        throw new Error('Failed to create/update user level');
    }

    return data as unknown as UserProgress;
}

/**
 * Gets the current level for a user
 * @param privyId The privy id of the user
 */
export async function getUserLevel(privyId: string): Promise<UserProgress | null> {
    if (!privyId) {
        throw new Error('Privy ID is required to get a user level');
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
        .from('user_levels')
        .select('*')
        .eq('privy_id', privyId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            // No results found
            return null;
        }
        console.error('Error getting user level:', error);
        throw new Error('Failed to get user level');
    }

    return data as unknown as UserProgress;
}

/**
 * Updates a user's level to a higher level
 * Only allows increasing levels, not decreasing
 * @param privyId The privy id of the user
 * @param level The new level to set
 */
export async function levelUpUser(privyId: string, level: number): Promise<UserProgress> {
    if (!privyId) {
        throw new Error('Privy ID is required to level up a user');
    }

    if (level < 1) {
        throw new Error('Level must be at least 1');
    }

    // First get the current level
    const currentUserLevel = await getUserLevel(privyId);
    const currentLevel = currentUserLevel?.level || 0;

    // Only allow leveling up (not down)
    if (level <= currentLevel) {
        throw new Error(`Cannot level down user. Current level: ${currentLevel}, Requested level: ${level}`);
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
        .from('user_levels')
        .upsert({
            privy_id: privyId,
            level: level
        }, {
            onConflict: 'privy_id',
            ignoreDuplicates: false
        })
        .select()
        .single();

    if (error) {
        console.error('Error leveling up user:', error);
        throw new Error('Failed to level up user');
    }

    return data as unknown as UserProgress;
} 