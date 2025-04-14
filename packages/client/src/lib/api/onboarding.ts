import { getSupabase } from '../supabase-client';
import { Profile } from '../../types/database.types';

/**
 * Get profile by privy_id using the get_full_profile RPC.
 * This function bypasses RLS using SECURITY DEFINER.
 */
export async function getOnboardingProfile(privyId: string): Promise<Profile> {
  console.log('getOnboardingProfile (RPC) called with:', { privyId });

  if (!privyId) {
    console.error('getOnboardingProfile requires privyId.');
    throw new Error('Privy identifier required.');
  }

  try {
    // Always get the latest client with JWT token
    const supabase = getSupabase();
    const { data, error } = await supabase.rpc(
      'get_full_profile',
      { p_privy_id: privyId }
    );

    if (error) {
      console.error('Error calling get_full_profile RPC:', error);
      throw new Error(`Failed to fetch profile: ${error.message}`);
    }

    if (!data) {
      console.warn('get_full_profile RPC returned no data for:', { privyId });
      throw new Error('Profile not found.');
    }

    console.log('Successfully fetched profile via RPC:', data);

    return data as Profile;

  } catch (error) {
    // Catch potential re-thrown errors
    console.error('Error in getOnboardingProfile:', error);
    throw error; // Re-throw the error to be handled by the caller
  }
}

/**
 * Create or update a profile (using privy_id as the conflict target)
 */
export async function createOnboardingProfile(
  profile: Omit<Profile, 'id' | 'created_at' | 'updated_at' | 'user_id'> & { privy_id: string }
) {
  console.log('Creating/updating profile:', profile);

  // User must have privy_id
  if (!profile.privy_id) {
    throw new Error('Profile must have privy_id');
  }

  // Always get the latest client with JWT token
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('profiles')
    .upsert(profile, {
      onConflict: 'privy_id',
      ignoreDuplicates: false,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating/updating profile:', error);
    // Check RLS error specifically
    if (error.code === '42501') {
      console.error('RLS Error: Ensure the client JWT has the correct privy_id claim and RLS policies allow insert/update based on request.jwt.claims ->> \'privy_id\'.');
    }
    throw new Error('Failed to save profile');
  }

  console.log('Profile created/updated successfully:', data);
  return data as unknown as Profile;
}

/**
 * Update an existing profile using privy_id
 */
export async function updateOnboardingProfile(privyId: string, updates: Partial<Omit<Profile, 'id' | 'privy_id' | 'created_at' | 'updated_at'>>) {
  // Ensure privy_id is not accidentally included in updates
  const { privy_id, ...safeUpdates } = updates as any;

  // Always get the latest client with JWT token
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('profiles')
    .update(safeUpdates)
    .eq('privy_id', privyId)
    .select()
    .single();

  if (error) {
    console.error('Error updating profile:', error);
    if (error.code === '42501') {
      console.error('RLS Error: Ensure the client JWT has the correct privy_id claim and RLS policies allow update based on request.jwt.claims ->> \'privy_id\'.');
    }
    throw new Error('Failed to update profile');
  }

  return data as unknown as Profile;
}

/**
 * Delete a profile using privy_id
 */
export async function deleteOnboardingProfile(privyId: string) {
  // Always get the latest client with JWT token
  const supabase = getSupabase();
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('privy_id', privyId);

  if (error) {
    console.error('Error deleting profile:', error);
    if (error.code === '42501') {
      console.error('RLS Error: Ensure the client JWT has the correct privy_id claim and RLS policies allow delete based on request.jwt.claims ->> \'privy_id\'.');
    }
    throw new Error('Failed to delete profile');
  }
}
