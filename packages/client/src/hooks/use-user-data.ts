import { useState, useEffect } from 'react';
import { getUserProfile } from '../lib/api/users';
import { Profile } from '../types/database.types';
import { useAuth } from '../lib/auth-provider';

export function useUserData() {
  const { user } = useAuth();
  const [userData, setUserData] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (user?.id) {
      setIsLoading(true);
      setError(null);

      const fetchData = async () => {
        try {
          const data = await getUserProfile(user.id);
          setUserData(data);
        } catch (err) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
        } finally {
          setIsLoading(false);
        }
      };

      fetchData();
    }
  }, [user]);

  return { userData, isLoading, error };
}
