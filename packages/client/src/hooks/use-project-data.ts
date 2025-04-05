import { useState, useEffect } from 'react';
import { getUserProjects, getProject } from '../lib/api/projects';
import { Project } from '../types/database.types';
import { useAuth } from '../lib/auth-provider';

export function useUserProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (user?.id) {
      setIsLoading(true);
      setError(null);

      const fetchData = async () => {
        try {
          const data = await getUserProjects(user.id);
          setProjects(data);
        } catch (err) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
        } finally {
          setIsLoading(false);
        }
      };

      fetchData();
    }
  }, [user]);

  return { projects, isLoading, error };
}

export function useProject(projectId: string | undefined) {
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (projectId) {
      setIsLoading(true);
      setError(null);

      const fetchData = async () => {
        try {
          const data = await getProject(projectId);
          setProject(data);
        } catch (err) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
        } finally {
          setIsLoading(false);
        }
      };

      fetchData();
    }
  }, [projectId]);

  return { project, isLoading, error };
}
