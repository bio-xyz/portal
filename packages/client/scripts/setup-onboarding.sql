-- Create the onboarding_profiles table
CREATE TABLE IF NOT EXISTS onboarding_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  project_name TEXT NOT NULL,
  project_description TEXT NOT NULL,
  project_vision TEXT NOT NULL,
  scientific_references TEXT NOT NULL,
  credential_links TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_onboarding_profiles_user_id ON onboarding_profiles(user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update timestamp on change
DROP TRIGGER IF EXISTS update_onboarding_profiles_updated_at ON onboarding_profiles;
CREATE TRIGGER update_onboarding_profiles_updated_at
BEFORE UPDATE ON onboarding_profiles
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

-- Create RLS (Row Level Security) policies
ALTER TABLE onboarding_profiles ENABLE ROW LEVEL SECURITY;

-- Policy for reading onboarding profiles (user can only read their own)
DROP POLICY IF EXISTS "Users can read their own onboarding profile" ON onboarding_profiles;
CREATE POLICY "Users can read their own onboarding profile"
ON onboarding_profiles FOR SELECT
USING (auth.uid()::text = user_id);

-- Policy for inserting onboarding profiles (user can only insert their own)
DROP POLICY IF EXISTS "Users can insert their own onboarding profile" ON onboarding_profiles;
CREATE POLICY "Users can insert their own onboarding profile"
ON onboarding_profiles FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

-- Policy for updating onboarding profiles (user can only update their own)
DROP POLICY IF EXISTS "Users can update their own onboarding profile" ON onboarding_profiles;
CREATE POLICY "Users can update their own onboarding profile"
ON onboarding_profiles FOR UPDATE
USING (auth.uid()::text = user_id); 