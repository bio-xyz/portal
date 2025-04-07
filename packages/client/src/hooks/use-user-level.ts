import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth-provider';
import { getUserLevel, updateUserLevel, incrementUserLevel } from '../lib/api/user-levels';
import { supabase } from '../lib/supabase-client';

interface UserLevel {
  level: number;
  updated_at: string;
}

export function useUserLevel() {
  const { user } = useAuth();
  const [level, setLevel] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const fetchUserLevel = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getUserLevel(user.id);
        setLevel(data.level);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserLevel();

    // Set up real-time subscription for level changes
    const subscription = supabase
      .channel('user-level-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_levels',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setLevel((payload.new as UserLevel).level);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user]);

  const setUserLevel = async (newLevel: number) => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      await updateUserLevel(user.id, newLevel);
      // Note: We don't need to update the state here as the real-time subscription will handle it
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const incrementLevel = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      await incrementUserLevel(user.id);
      // Note: We don't need to update the state here as the real-time subscription will handle it
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    level,
    isLoading,
    error,
    setUserLevel,
    incrementLevel,
  };
}
