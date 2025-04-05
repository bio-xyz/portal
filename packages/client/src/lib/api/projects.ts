import { supabase } from '../supabase-client';
import { Project } from '../../types/database.types';

export async function getProject(projectId: string) {
  const { data, error } = await supabase.from('projects').select('*').eq('id', projectId).single();

  if (error) throw error;
  return data as Project;
}

export async function getUserProjects(userId: string) {
  const { data, error } = await supabase.from('projects').select('*').eq('user_id', userId);

  if (error) throw error;
  return data as Project[];
}

export async function createProject(project: Omit<Project, 'id' | 'created_at'>) {
  const { data, error } = await supabase.from('projects').insert(project).select().single();

  if (error) throw error;
  return data as Project;
}

export async function updateProject(projectId: string, updates: Partial<Project>) {
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', projectId)
    .select()
    .single();

  if (error) throw error;
  return data as Project;
}
