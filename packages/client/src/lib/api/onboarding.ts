import { supabase } from '../supabase-client';
import { OnboardingProfile } from '../../types/database.types';

export async function getOnboardingProfile(userId: string) {
  const { data, error } = await supabase
    .from('onboarding_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  return data as OnboardingProfile;
}

export async function createOnboardingProfile(
  profile: Omit<OnboardingProfile, 'id' | 'created_at' | 'updated_at'>
) {
  const { data, error } = await supabase
    .from('onboarding_profiles')
    .insert(profile)
    .select()
    .single();

  if (error) throw error;
  return data as OnboardingProfile;
}

export async function updateOnboardingProfile(userId: string, updates: Partial<OnboardingProfile>) {
  const { data, error } = await supabase
    .from('onboarding_profiles')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data as OnboardingProfile;
}
