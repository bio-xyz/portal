import { supabase } from '../supabase-client';
import { Profile } from '../../types/database.types';

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  return data as Profile;
}

export async function createUserProfile(profile: Omit<Profile, 'id' | 'created_at'>) {
  const { data, error } = await supabase.from('profiles').insert(profile).select().single();

  if (error) throw error;
  return data as Profile;
}

export async function updateUserProfile(userId: string, updates: Partial<Profile>) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data as Profile;
}
