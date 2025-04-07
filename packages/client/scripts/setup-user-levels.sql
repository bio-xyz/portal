-- Create the user_levels table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  level INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_levels_user_id ON user_levels(user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update timestamp on change
DROP TRIGGER IF EXISTS update_user_levels_updated_at ON user_levels;
CREATE TRIGGER update_user_levels_updated_at
BEFORE UPDATE ON user_levels
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

-- Create RLS (Row Level Security) policies
ALTER TABLE user_levels ENABLE ROW LEVEL SECURITY;

-- Policy for reading user levels (user can only read their own)
DROP POLICY IF EXISTS "Users can read their own level" ON user_levels;
CREATE POLICY "Users can read their own level"
ON user_levels FOR SELECT
USING (auth.uid()::text = user_id);

-- Policy for inserting user levels (user can only insert their own)
DROP POLICY IF EXISTS "Users can insert their own level" ON user_levels;
CREATE POLICY "Users can insert their own level"
ON user_levels FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

-- Policy for updating user levels (user can only update their own)
DROP POLICY IF EXISTS "Users can update their own level" ON user_levels;
CREATE POLICY "Users can update their own level"
ON user_levels FOR UPDATE
USING (auth.uid()::text = user_id); 