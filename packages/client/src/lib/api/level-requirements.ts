import { supabase } from '../supabase-client';
import { agentLevels } from '../../config/agent-levels';

export interface RequirementProgress {
  requirement: string;
  completed: boolean;
  completed_at?: string;
}

/**
 * Get all requirements and their completion status for a user's current level
 */
export async function getUserRequirements(
  userId: string,
  level: number
): Promise<RequirementProgress[]> {
  // Get requirements from agent levels config
  const requirements = agentLevels[level]?.levelupRequirements || [];

  // Get completed requirements from database
  const { data, error } = await supabase
    .from('requirement_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('level', level);

  if (error) throw error;

  // Map requirements to their completion status
  return requirements.map((requirement) => {
    const progress = data?.find((item) => item.requirement === requirement);
    return {
      requirement,
      completed: !!progress?.completed,
      completed_at: progress?.completed_at,
    };
  });
}

/**
 * Mark a requirement as completed
 */
export async function completeRequirement(
  userId: string,
  level: number,
  requirement: string
): Promise<void> {
  const { error } = await supabase.from('requirement_progress').upsert(
    {
      user_id: userId,
      level,
      requirement,
      completed: true,
      completed_at: new Date().toISOString(),
    },
    {
      onConflict: 'user_id,level,requirement',
    }
  );

  if (error) throw error;
}

/**
 * Check if all requirements for the current level are completed
 */
export async function checkAllRequirementsCompleted(
  userId: string,
  level: number
): Promise<boolean> {
  const requirements = await getUserRequirements(userId, level);
  return requirements.every((req) => req.completed);
}
