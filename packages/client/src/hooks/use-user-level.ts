import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../lib/use-auth';
import { updateUserLevel, incrementUserLevel, getUserLevel, createDefaultUserLevel, createOrUpdateUserLevel } from '../lib/api/user-levels';
import { supabase } from '../lib/supabase-client';

interface UserLevel {
  level: number;
  updated_at: string;
}

export function useUserLevel() {
  const { user } = useAuth();
  const privyId = user?.id;
  const [level, setLevel] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLevel = useCallback(async () => {
    if (!privyId) {
      setIsLoading(false);
      setLevel(1);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const userLevelData = await getUserLevel(privyId);
      if (userLevelData && typeof userLevelData.level === 'number') {
        setLevel(userLevelData.level);
      } else {
        console.log(`No level data found for ${privyId}, attempting to ensure level 1 record exists.`);
        setLevel(1);
        createOrUpdateUserLevel(privyId).catch(err => console.error("Error ensuring level 1 record:", err));
      }
    } catch (err: any) {
      console.error("Error fetching user level:", err);
      setError(err.message || 'Failed to fetch user level');
      setLevel(1);
    } finally {
      setIsLoading(false);
    }
  }, [privyId]);

  useEffect(() => {
    fetchLevel();
  }, [fetchLevel]);

  const incrementLevel = useCallback(async () => {
    if (!privyId) {
      console.error("Cannot increment level without privyId.");
      throw new Error("User not authenticated");
    }

    const currentLevel = level;
    const nextLevel = currentLevel + 1;

    setLevel(nextLevel);
    setError(null);

    try {
      const { success, error: updateError } = await updateUserLevel(privyId, nextLevel);
      if (!success) {
        console.error("Failed to update level on backend:", updateError);
        setLevel(currentLevel);
        setError(updateError?.message || 'Failed to update level');
        throw updateError || new Error('Failed to update level');
      }
      console.log(`Successfully updated level to ${nextLevel} for ${privyId}`);
    } catch (err) {
      if (level !== currentLevel) {
        setLevel(currentLevel);
      }
      setError(err instanceof Error ? err.message : 'An unknown error occurred during level update');
      throw err;
    }
  }, [privyId, level]);

  return { level, isLoading, error, refetchLevel: fetchLevel, incrementLevel };
}
