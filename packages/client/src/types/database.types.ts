export interface Profile {
  id: string;
  user_id: string;
  username: string;
  avatar_url?: string;
  created_at: string;
  level?: number;
}

export interface OnboardingProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  project_name: string;
  project_description: string;
  project_vision: string;
  scientific_references: string;
  credential_links: string;
  team_members: string;
  motivation: string;
  progress: string;
  created_at: string;
  updated_at: string;
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
