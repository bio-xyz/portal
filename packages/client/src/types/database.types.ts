export interface Profile {
  id: string;
  user_id: string;
  username: string;
  avatar_url?: string;
  created_at: string;
  level?: number;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string;
  vision?: string;
  created_at: string;
}

export interface AgentInteraction {
  id: string;
  user_id: string;
  message: string;
  agent_response: string;
  created_at: string;
}

export interface UserProgress {
  id: string;
  user_id: string;
  level: number;
  discord_id?: string;
  updated_at: string;
}

export interface NFTMetadata {
  id: string;
  user_id: string;
  project_id: string;
  token_id: string;
  contract_address: string;
  metadata_uri: string;
  type: 'idea' | 'vision';
  created_at: string;
}
