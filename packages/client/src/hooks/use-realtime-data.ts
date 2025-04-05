import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase-client';
import { Profile, Project } from '../types/database.types';

export function useRealtimeUserProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) return;

    // Initial fetch
    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (error) throw error;
        setProfile(data as Profile);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      }
    };

    fetchProfile();

    // Set up real-time subscription
    const subscription = supabase
      .channel('profiles-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setProfile(payload.new as Profile);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [userId]);

  return { profile, error };
}

export function useRealtimeProject(projectId: string | undefined) {
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!projectId) return;

    // Initial fetch
    const fetchProject = async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single();

        if (error) throw error;
        setProject(data as Project);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      }
    };

    fetchProject();

    // Set up real-time subscription
    const subscription = supabase
      .channel('projects-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'projects',
          filter: `id=eq.${projectId}`,
        },
        (payload) => {
          setProject(payload.new as Project);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [projectId]);

  return { project, error };
}
