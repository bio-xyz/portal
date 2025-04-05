import { supabase } from '../supabase-client';
import { AgentInteraction } from '../../types/database.types';

export async function getAgentInteractions(userId: string, limit = 10) {
  const { data, error } = await supabase
    .from('agent_interactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as AgentInteraction[];
}

export async function saveAgentInteraction(
  interaction: Omit<AgentInteraction, 'id' | 'created_at'>
) {
  const { data, error } = await supabase
    .from('agent_interactions')
    .insert(interaction)
    .select()
    .single();

  if (error) throw error;
  return data as AgentInteraction;
}
