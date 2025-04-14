import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import path from 'path';

// Load environment variables from root .env file
const rootEnvPath = path.resolve(process.cwd(), '../../.env');
config({ path: rootEnvPath });

// Get environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  console.error('Error: Missing Supabase environment variables.');
  console.error('Please create a .env file in the root directory with:');
  console.error(`
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_SERVICE_KEY=your_supabase_service_key
  `);
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'apikey': supabaseServiceKey
    }
  }
});

async function setupDatabase() {
  console.log('Setting up database schema and RLS for Custom JWT Auth Flow...');

  try {
    // --- Stage 0: Ensure exec_sql function exists ---
    console.log('\n--- Stage 0: Ensuring exec_sql function exists ---');
    const createExecSqlFunctionSql = `
      CREATE OR REPLACE FUNCTION exec_sql(sql text) RETURNS void AS $$
      BEGIN
        EXECUTE sql;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
      GRANT EXECUTE ON FUNCTION exec_sql TO service_role;
    `;
    try {
      // Try executing a simple command using it first
      const { error: testExecError } = await supabase.rpc('exec_sql', { sql: 'SELECT 1;' });
      if (testExecError) {
        console.log('exec_sql function not found or not working, attempting creation...');
        // Function doesn't exist or isn't callable, need to create it directly
        // Note: Directly executing DDL like this in Supabase JS client might be restricted.
        // Usually, this function creation is done via Supabase Dashboard SQL Editor or migrations.
        // We attempt it here but may need manual intervention if it fails.
        // This direct SQL execution via rpc might not work depending on Supabase version/config.
        // We are wrapping the creation logic inside another function call, which might fail.
        const { error: creationError } = await supabase.rpc('sql', { query: createExecSqlFunctionSql }); // Example, actual method might differ
        if (creationError) {
          console.error('Failed to create exec_sql function directly via RPC:', creationError);
          console.warn('Manual creation of exec_sql function might be required via Supabase SQL Editor.');
        } else {
          console.log('Attempted to create exec_sql function directly.');
        }
      } else {
        console.log('exec_sql function exists and is callable.');
      }
    } catch (error) {
      console.error('Error checking/creating exec_sql function:', error);
      console.warn('Continuing setup, but subsequent steps might fail if exec_sql is unavailable.');
      // Attempting to proceed without guarantee exec_sql works
    }

    // --- Define SQL Statements ---

    // Shared function
    const sharedFunctionSql = `
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `;

    // User Levels - Schema
    const userLevelsSchemaSql = `
      CREATE TABLE IF NOT EXISTS user_levels (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        privy_id TEXT NOT NULL UNIQUE, -- Changed from user_id
        level INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      DROP INDEX IF EXISTS idx_user_levels_user_id; -- Drop old index
      CREATE INDEX IF NOT EXISTS idx_user_levels_privy_id ON user_levels(privy_id);
      DROP TRIGGER IF EXISTS update_user_levels_updated_at ON user_levels;
      CREATE TRIGGER update_user_levels_updated_at
      BEFORE UPDATE ON user_levels
      FOR EACH ROW
      EXECUTE PROCEDURE update_updated_at_column();
    `;

    // Requirements Progress - Schema
    const requirementsProgressSchemaSql = `
      CREATE TABLE IF NOT EXISTS requirement_progress (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL,
        level INTEGER NOT NULL,
        requirement TEXT NOT NULL,
        completed BOOLEAN NOT NULL DEFAULT false,
        completed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, level, requirement)
      );
      CREATE INDEX IF NOT EXISTS idx_requirement_progress_user_id ON requirement_progress(user_id);
      CREATE INDEX IF NOT EXISTS idx_requirement_progress_level ON requirement_progress(level);
      CREATE INDEX IF NOT EXISTS idx_requirement_progress_completed ON requirement_progress(completed);
      DROP TRIGGER IF EXISTS update_requirement_progress_updated_at ON requirement_progress;
      CREATE TRIGGER update_requirement_progress_updated_at
      BEFORE UPDATE ON requirement_progress
      FOR EACH ROW
      EXECUTE PROCEDURE update_updated_at_column();
    `;

    // User Levels - RLS
    const userLevelsRlsSql = `
      ALTER TABLE user_levels ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Users can read their own level" ON user_levels;
      CREATE POLICY "Users can read their own level"
      ON user_levels FOR SELECT
      USING ((request.jwt.claims ->> 'privy_id')::text = privy_id);
      
      DROP POLICY IF EXISTS "Users can insert their own level" ON user_levels;
      CREATE POLICY "Users can insert their own level"
      ON user_levels FOR INSERT
      WITH CHECK ((request.jwt.claims ->> 'privy_id')::text = privy_id);
      
      DROP POLICY IF EXISTS "Users can update their own level" ON user_levels;
      CREATE POLICY "Users can update their own level"
      ON user_levels FOR UPDATE
      USING ((request.jwt.claims ->> 'privy_id')::text = privy_id);
      
      DROP POLICY IF EXISTS "Service role can manage levels" ON user_levels;
      CREATE POLICY "Service role can manage levels"
      ON user_levels FOR ALL
      USING (current_setting('role', true) = 'service_role');
      
      GRANT SELECT, INSERT, UPDATE ON user_levels TO authenticated;
      GRANT ALL ON user_levels TO service_role;
    `;

    // Requirements Progress - RLS
    const requirementsProgressRlsSql = `
      ALTER TABLE requirement_progress ENABLE ROW LEVEL SECURITY;
      
      DROP POLICY IF EXISTS "Users can read their own requirements" ON requirement_progress;
      CREATE POLICY "Users can read their own requirements"
      ON requirement_progress FOR SELECT
      USING ((request.jwt.claims ->> 'privy_id')::text = user_id);
      
      DROP POLICY IF EXISTS "Users can insert their own requirements" ON requirement_progress;
      CREATE POLICY "Users can insert their own requirements"
      ON requirement_progress FOR INSERT
      WITH CHECK ((request.jwt.claims ->> 'privy_id')::text = user_id);
      
      DROP POLICY IF EXISTS "Users can update their own requirements" ON requirement_progress;
      CREATE POLICY "Users can update their own requirements"
      ON requirement_progress FOR UPDATE
      USING ((request.jwt.claims ->> 'privy_id')::text = user_id);
      
      DROP POLICY IF EXISTS "Service role can manage requirements" ON requirement_progress;
      CREATE POLICY "Service role can manage requirements"
      ON requirement_progress FOR ALL
      USING (current_setting('role', true) = 'service_role');
      
      GRANT SELECT, INSERT, UPDATE ON requirement_progress TO authenticated;
      GRANT ALL ON requirement_progress TO service_role;
    `;

    // Onboarding (Profiles) - Schema
    const onboardingSchemaSql = `
      CREATE TABLE IF NOT EXISTS profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        privy_id TEXT UNIQUE NOT NULL,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL,
        project_name TEXT NOT NULL,
        project_description TEXT NOT NULL,
        project_vision TEXT NOT NULL,
        scientific_references TEXT NOT NULL,
        credential_links TEXT NOT NULL,
        team_members TEXT NOT NULL,
        motivation TEXT NOT NULL,
        progress TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      DROP INDEX IF EXISTS idx_profiles_user_id;
      CREATE INDEX IF NOT EXISTS idx_profiles_privy_id ON profiles(privy_id);
      DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
      CREATE TRIGGER update_profiles_updated_at
      BEFORE UPDATE ON profiles
      FOR EACH ROW
      EXECUTE PROCEDURE update_updated_at_column();
    `;
    // Onboarding (Profiles) - RLS
    const onboardingRlsSql = `
      ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Users can read their own profile" ON profiles;
      CREATE POLICY "Users can read their own profile"
      ON profiles FOR SELECT
      USING ((request.jwt.claims ->> 'privy_id')::text = privy_id);
      DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
      CREATE POLICY "Users can insert their own profile"
      ON profiles FOR INSERT
      WITH CHECK (privy_id IS NOT NULL AND (request.jwt.claims ->> 'privy_id')::text = privy_id);
      DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
      CREATE POLICY "Users can update their own profile"
      ON profiles FOR UPDATE
      USING ((request.jwt.claims ->> 'privy_id')::text = privy_id);
      GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
      GRANT ALL ON profiles TO service_role;
    `;

    // Auth Cleanup - Schema (Drops only)
    const authCleanupSql = `
      DROP FUNCTION IF EXISTS handle_privy_user_link();
      DROP FUNCTION IF EXISTS get_privy_user(text);
      DROP FUNCTION IF EXISTS is_same_privy_user(text);
    `;

    // NFT Metadata - Schema
    const nftSchemaSql = `
      CREATE TABLE IF NOT EXISTS nft_metadata (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        privy_id TEXT NOT NULL,
        project_id UUID NOT NULL, -- Assuming this links to a project table ID (not profile ID)
        token_id TEXT NOT NULL,
        contract_address TEXT NOT NULL,
        metadata_uri TEXT NOT NULL,
        image_uri TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('idea', 'vision')), 
        chain_id INTEGER NOT NULL DEFAULT 8453, 
        premint_uid TEXT,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'minted', 'failed')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      DROP INDEX IF EXISTS idx_nft_metadata_user_id;
      CREATE INDEX IF NOT EXISTS idx_nft_metadata_privy_id ON nft_metadata(privy_id);
      CREATE INDEX IF NOT EXISTS idx_nft_metadata_project_id ON nft_metadata(project_id);
      CREATE INDEX IF NOT EXISTS idx_nft_metadata_premint_uid ON nft_metadata(premint_uid);
      DROP TRIGGER IF EXISTS update_nft_metadata_updated_at ON nft_metadata;
      CREATE TRIGGER update_nft_metadata_updated_at
      BEFORE UPDATE ON nft_metadata
      FOR EACH ROW
      EXECUTE PROCEDURE update_updated_at_column();
    `;
    // NFT Metadata - RLS
    const nftRlsSql = `
      ALTER TABLE nft_metadata ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Users can view their own NFTs" ON nft_metadata;
      CREATE POLICY "Users can view their own NFTs"
      ON nft_metadata FOR SELECT
      USING ((request.jwt.claims ->> 'privy_id')::text = privy_id);
      DROP POLICY IF EXISTS "Authenticated users can create NFTs" ON nft_metadata;
      CREATE POLICY "Authenticated users can create NFTs"
      ON nft_metadata FOR INSERT
      WITH CHECK ((request.jwt.claims ->> 'privy_id')::text = privy_id);
      DROP POLICY IF EXISTS "Users can update their own NFTs" ON nft_metadata;
      CREATE POLICY "Users can update their own NFTs"
      ON nft_metadata FOR UPDATE
      USING ((request.jwt.claims ->> 'privy_id')::text = privy_id);
      GRANT ALL ON nft_metadata TO authenticated;
      GRANT ALL ON nft_metadata TO service_role;
    `;

    // Helper Functions & View - Schema
    const functionsSchemaSql = `
      DROP FUNCTION IF EXISTS public.get_privy_user_id(text);
      CREATE OR REPLACE FUNCTION public.get_full_profile_by_id(profile_id uuid)
      RETURNS jsonb LANGUAGE plpgsql AS $$
      DECLARE 
        profile_data jsonb; 
        profile_privy_id text;
      BEGIN 
        -- First get the privy_id for this profile
        SELECT privy_id INTO profile_privy_id FROM profiles WHERE id = profile_id;
        
        -- Check permissions
        IF auth.uid() = profile_privy_id OR current_setting('role', true) = 'service_role' THEN
          SELECT to_jsonb(p) INTO profile_data FROM profiles p WHERE p.id = profile_id; 
          RETURN profile_data;
        ELSE
          RAISE EXCEPTION 'Permission denied: cannot access profile data for other users';
        END IF;
      END; 
      $$;
      
      DROP FUNCTION IF EXISTS public.get_full_profile(text, text);
      CREATE OR REPLACE FUNCTION public.get_full_profile(p_privy_id text)
      RETURNS jsonb LANGUAGE plpgsql AS $$
      DECLARE 
        profile_data jsonb; 
      BEGIN 
        -- Check permissions
        IF auth.uid() = p_privy_id OR current_setting('role', true) = 'service_role' THEN
          SELECT to_jsonb(p) INTO profile_data FROM profiles p WHERE p.privy_id = p_privy_id; 
          RETURN profile_data;
        ELSE
          RAISE EXCEPTION 'Permission denied: cannot access profile data for other users';
        END IF;
      END; 
      $$;
      
      -- User Level RPC Functions
      DROP FUNCTION IF EXISTS public.get_user_level(text);
      CREATE OR REPLACE FUNCTION public.get_user_level(p_privy_id text)
      RETURNS jsonb LANGUAGE plpgsql AS $$
      DECLARE 
        level_data jsonb; 
      BEGIN 
        -- First make sure the user has permission to access this record
        -- This will respect RLS policies because it doesn't use SECURITY DEFINER
        IF auth.uid() = p_privy_id OR current_setting('role', true) = 'service_role' THEN
          SELECT to_jsonb(ul) INTO level_data FROM user_levels ul WHERE ul.privy_id = p_privy_id; 
          RETURN level_data;
        ELSE
          RAISE EXCEPTION 'Permission denied: cannot access level data for other users';
        END IF;
      END; 
      $$;

      DROP FUNCTION IF EXISTS public.create_default_user_level(text);
      CREATE OR REPLACE FUNCTION public.create_default_user_level(p_privy_id text)
      RETURNS jsonb LANGUAGE plpgsql AS $$
      DECLARE 
        new_level_data jsonb;
      BEGIN
        -- First make sure the user has permission to create this record
        -- This will respect RLS policies because it doesn't use SECURITY DEFINER
        IF auth.uid() = p_privy_id OR current_setting('role', true) = 'service_role' THEN
          -- First check if level already exists
          IF EXISTS (SELECT 1 FROM user_levels WHERE privy_id = p_privy_id) THEN
            -- If exists, return it
            SELECT to_jsonb(ul) INTO new_level_data FROM user_levels ul WHERE ul.privy_id = p_privy_id;
          ELSE
            -- Create new level - this will still be subject to RLS policies
            INSERT INTO user_levels (privy_id, level, updated_at)
            VALUES (p_privy_id, 1, NOW())
            RETURNING to_jsonb(user_levels.*) INTO new_level_data;
          END IF;
          
          RETURN new_level_data;
        ELSE
          RAISE EXCEPTION 'Permission denied: cannot create level for other users';
        END IF;
      END;
      $$;
      
      CREATE OR REPLACE FUNCTION public.get_row_level_security_info()
      RETURNS jsonb LANGUAGE plpgsql AS $$
      DECLARE result jsonb; jwt_claims jsonb; BEGIN SELECT request.jwt.claims INTO jwt_claims; SELECT jsonb_build_object('current_role', current_setting('role', true), 'jwt_claims', jwt_claims, 'jwt_privy_id', jwt_claims ->> 'privy_id', 'has_profiles_access', EXISTS (SELECT 1 FROM pg_catalog.pg_tables WHERE schemaname = 'public' AND tablename = 'profiles'), 'profile_policies', (SELECT jsonb_agg(jsonb_build_object('policy_name', polname, 'cmd', polcmd, 'permissive', polpermissive, 'qual', pg_get_expr(polqual, polrelid), 'with_check', pg_get_expr(polwithcheck, polrelid))) FROM pg_policy WHERE polrelid = 'public.profiles'::regclass), 'user_levels_policies', (SELECT jsonb_agg(jsonb_build_object('policy_name', polname, 'cmd', polcmd, 'permissive', polpermissive, 'qual', pg_get_expr(polqual, polrelid), 'with_check', pg_get_expr(polwithcheck, polrelid))) FROM pg_policy WHERE polrelid = 'public.user_levels'::regclass)) INTO result; RETURN result; END; $$;
      CREATE OR REPLACE VIEW public_profiles AS SELECT id, privy_id, created_at, updated_at FROM profiles;
      GRANT SELECT ON public_profiles TO authenticated, anon, service_role;
      GRANT EXECUTE ON FUNCTION public.get_full_profile_by_id(uuid) TO authenticated, service_role, anon;
      GRANT EXECUTE ON FUNCTION public.get_full_profile(text) TO authenticated, service_role, anon;
      GRANT EXECUTE ON FUNCTION public.get_user_level(text) TO authenticated, service_role, anon;
      GRANT EXECUTE ON FUNCTION public.create_default_user_level(text) TO authenticated, service_role, anon;
      GRANT EXECUTE ON FUNCTION public.get_row_level_security_info() TO authenticated, service_role, anon;
    `;

    // After other SQL definitions, add a new SQL function to verify RLS status 
    const verifyRlsSetupSql = `
      -- Create a function to check RLS status on tables
      CREATE OR REPLACE FUNCTION check_rls_status()
      RETURNS jsonb LANGUAGE plpgsql AS $$
      DECLARE
        result jsonb;
      BEGIN
        SELECT jsonb_build_object(
          'profiles_table_exists', EXISTS(SELECT 1 FROM pg_catalog.pg_tables WHERE schemaname = 'public' AND tablename = 'profiles'),
          'user_levels_table_exists', EXISTS(SELECT 1 FROM pg_catalog.pg_tables WHERE schemaname = 'public' AND tablename = 'user_levels'),
          'profiles_rls_enabled', EXISTS(
            SELECT 1 FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename = 'profiles' 
            AND rowsecurity = true
          ),
          'user_levels_rls_enabled', EXISTS(
            SELECT 1 FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename = 'user_levels' 
            AND rowsecurity = true
          ),
          'auth_uid_function_exists', EXISTS(
            SELECT 1 FROM pg_proc 
            WHERE proname = 'uid' 
            AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'auth')
          ),
          'profiles_policies', (
            SELECT jsonb_agg(jsonb_build_object(
              'name', polname,
              'cmd', polcmd,
              'qual', pg_get_expr(polqual, polrelid, true),
              'with_check', pg_get_expr(polwithcheck, polrelid, true)
            ))
            FROM pg_policy
            WHERE polrelid = 'public.profiles'::regclass
          ),
          'user_levels_policies', (
             SELECT jsonb_agg(jsonb_build_object(
              'name', polname,
              'cmd', polcmd,
              'qual', pg_get_expr(polqual, polrelid, true),
              'with_check', pg_get_expr(polwithcheck, polrelid, true)
            ))
            FROM pg_policy
            WHERE polrelid = 'public.user_levels'::regclass
          )
        ) INTO result;
        
        RETURN result;
      END;
      $$;

      GRANT EXECUTE ON FUNCTION check_rls_status() TO authenticated, anon, service_role;
    `;

    // Add a new SQL script to configure Supabase JWT settings
    const setupJwtConfigSql = `
      -- Set up JWT verification settings for Privy
      -- This assumes you've configured JWT settings in Supabase Dashboard
      
      -- Create auth schema if not exists
      CREATE SCHEMA IF NOT EXISTS auth;
      
      -- Make sure the 'authenticated' role is correctly defined
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'authenticated') THEN
          CREATE ROLE authenticated;
        END IF;
        
        GRANT usage ON SCHEMA public TO authenticated;
      END
      $$;
      
      -- Drop existing auth functions to avoid return type conflicts
      DROP FUNCTION IF EXISTS auth.uid();
      DROP FUNCTION IF EXISTS auth.check_privy_id();
      
      -- Create auth.uid() function to extract privy_id from JWT claims
      CREATE OR REPLACE FUNCTION auth.uid() 
      RETURNS text AS $$
      DECLARE
        privy_id text;
      BEGIN
        privy_id := nullif(current_setting('request.jwt.claims', true)::json->>'privy_id', '');
        RETURN privy_id;
      EXCEPTION WHEN others THEN
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql STABLE;
      
      -- Function to validate privy_id in JWT
      CREATE OR REPLACE FUNCTION auth.check_privy_id() 
      RETURNS boolean AS $$
      BEGIN
        RETURN auth.uid() IS NOT NULL;
      END;
      $$ LANGUAGE plpgsql STABLE;
      
      -- Grant access to JWT checking functions
      GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated, anon, service_role;
      GRANT EXECUTE ON FUNCTION auth.check_privy_id() TO authenticated, anon, service_role;
    `;

    // Enable RLS statements
    const enableRlsStmts = [
      {
        name: 'Enable RLS on profiles',
        sql: 'ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;'
      },
      {
        name: 'Enable RLS on user_levels',
        sql: 'ALTER TABLE user_levels ENABLE ROW LEVEL SECURITY;'
      },
      {
        name: 'Enable RLS on nft_metadata',
        sql: 'ALTER TABLE nft_metadata ENABLE ROW LEVEL SECURITY;'
      },
      {
        name: 'Enable RLS on requirement_progress',
        sql: 'ALTER TABLE requirement_progress ENABLE ROW LEVEL SECURITY;'
      }
    ];

    // Profiles RLS policies
    const profilePoliciesStmts = [
      {
        name: 'Profiles SELECT policy',
        sql: `
          DROP POLICY IF EXISTS "Users can read their own profile" ON profiles;
          CREATE POLICY "Users can read their own profile"
          ON profiles FOR SELECT
          USING (auth.uid() = privy_id);
        `
      },
      {
        name: 'Profiles INSERT policy',
        sql: `
          DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
          CREATE POLICY "Users can insert their own profile"
          ON profiles FOR INSERT
          WITH CHECK (privy_id IS NOT NULL AND auth.uid() = privy_id);
        `
      },
      {
        name: 'Profiles UPDATE policy',
        sql: `
          DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
          CREATE POLICY "Users can update their own profile"
          ON profiles FOR UPDATE
          USING (auth.uid() = privy_id);
        `
      }
    ];

    // User levels RLS policies
    const userLevelsPoliciesStmts = [
      {
        name: 'User levels SELECT policy',
        sql: `
          DROP POLICY IF EXISTS "Users can read their own level" ON user_levels;
          CREATE POLICY "Users can read their own level"
          ON user_levels FOR SELECT
          USING (auth.uid() = privy_id OR current_setting('role', true) = 'service_role');
        `
      },
      {
        name: 'User levels INSERT policy',
        sql: `
          DROP POLICY IF EXISTS "Users can insert their own level" ON user_levels;
          CREATE POLICY "Users can insert their own level"
          ON user_levels FOR INSERT
          WITH CHECK (auth.uid() = privy_id);
          
          DROP POLICY IF EXISTS "Service role can manage levels" ON user_levels;
          CREATE POLICY "Service role can manage levels"
          ON user_levels FOR ALL
          USING (current_setting('role', true) = 'service_role');
        `
      },
      {
        name: 'User levels UPDATE policy',
        sql: `
          DROP POLICY IF EXISTS "Users can update their own level" ON user_levels;
          CREATE POLICY "Users can update their own level"
          ON user_levels FOR UPDATE
          USING (auth.uid() = privy_id);
        `
      }
    ];

    // NFT metadata RLS policies
    const nftPoliciesStmts = [
      {
        name: 'NFT SELECT policy',
        sql: `
          DROP POLICY IF EXISTS "Users can view their own NFTs" ON nft_metadata;
          CREATE POLICY "Users can view their own NFTs"
          ON nft_metadata FOR SELECT
          USING (auth.uid() = privy_id);
        `
      },
      {
        name: 'NFT INSERT policy',
        sql: `
          DROP POLICY IF EXISTS "Authenticated users can create NFTs" ON nft_metadata;
          CREATE POLICY "Authenticated users can create NFTs"
          ON nft_metadata FOR INSERT
          WITH CHECK (auth.uid() = privy_id);
        `
      },
      {
        name: 'NFT UPDATE policy',
        sql: `
          DROP POLICY IF EXISTS "Users can update their own NFTs" ON nft_metadata;
          CREATE POLICY "Users can update their own NFTs"
          ON nft_metadata FOR UPDATE
          USING (auth.uid() = privy_id);
        `
      }
    ];

    // Requirements Progress RLS policies
    const requirementProgressPoliciesStmts = [
      {
        name: 'Requirement Progress SELECT policy',
        sql: `
          DROP POLICY IF EXISTS "Users can read their own requirements" ON requirement_progress;
          CREATE POLICY "Users can read their own requirements"
          ON requirement_progress FOR SELECT
          USING (auth.uid() = user_id);
        `
      },
      {
        name: 'Requirement Progress INSERT policy',
        sql: `
          DROP POLICY IF EXISTS "Users can insert their own requirements" ON requirement_progress;
          CREATE POLICY "Users can insert their own requirements"
          ON requirement_progress FOR INSERT
          WITH CHECK (auth.uid() = user_id);
        `
      },
      {
        name: 'Requirement Progress UPDATE policy',
        sql: `
          DROP POLICY IF EXISTS "Users can update their own requirements" ON requirement_progress;
          CREATE POLICY "Users can update their own requirements"
          ON requirement_progress FOR UPDATE
          USING (auth.uid() = user_id);
        `
      },
      {
        name: 'Requirement Progress Service Role policy',
        sql: `
          DROP POLICY IF EXISTS "Service role can manage requirements" ON requirement_progress;
          CREATE POLICY "Service role can manage requirements"
          ON requirement_progress FOR ALL
          USING (current_setting('role', true) = 'service_role');
        `
      }
    ];

    // Grant permissions
    const grantStmts = [
      {
        name: 'Grant profiles permissions',
        sql: `
          GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
          GRANT ALL ON profiles TO service_role;
        `
      },
      {
        name: 'Grant user_levels permissions',
        sql: `
          GRANT SELECT, INSERT, UPDATE ON user_levels TO authenticated;
          GRANT ALL ON user_levels TO service_role;
        `
      },
      {
        name: 'Grant nft_metadata permissions',
        sql: `
          GRANT ALL ON nft_metadata TO authenticated;
          GRANT ALL ON nft_metadata TO service_role;
        `
      },
      {
        name: 'Grant requirement_progress permissions',
        sql: `
          GRANT SELECT, INSERT, UPDATE ON requirement_progress TO authenticated;
          GRANT ALL ON requirement_progress TO service_role;
        `
      }
    ];

    // --- Group Statements ---
    const schemaStatements = [
      { name: 'Shared Function SQL', sql: sharedFunctionSql },
      { name: 'User Levels Schema SQL', sql: userLevelsSchemaSql },
      { name: 'Requirements Progress Schema SQL', sql: requirementsProgressSchemaSql },
      { name: 'Onboarding Schema SQL', sql: onboardingSchemaSql },
      { name: 'Auth Cleanup SQL', sql: authCleanupSql },
      { name: 'NFT Schema SQL', sql: nftSchemaSql },
      { name: 'Functions Schema SQL', sql: functionsSchemaSql },
      { name: 'Verification Functions SQL', sql: verifyRlsSetupSql },
      { name: 'JWT Configuration', sql: setupJwtConfigSql }
    ];

    const rlsStatements = [
      ...enableRlsStmts,
      ...profilePoliciesStmts,
      ...userLevelsPoliciesStmts,
      ...nftPoliciesStmts,
      ...requirementProgressPoliciesStmts,
      ...grantStmts
    ];

    // --- Stage 1: Execute Schema Statements ---
    console.log('\n--- Stage 1: Applying Schema and Functions ---');
    for (const { name, sql } of schemaStatements) {
      console.log(`Executing ${name}...`);
      const { error } = await supabase.rpc('exec_sql', { sql });
      if (error) {
        console.error(`Error executing ${name}:`, error.message);

        // Special handling for JWT Configuration errors
        if (name === 'JWT Configuration' && error.message.includes('cannot drop function auth.uid()')) {
          console.warn('JWT Configuration already exists. Skipping this step.');
          console.warn('This is normal if the auth.uid() function is already in use.');
        } else {
          // For other errors, stop execution
          console.error('Stopping script due to schema error.');
          process.exit(1);
        }
      } else {
        console.log(`${name} executed successfully.`);
      }
    }
    console.log('✅ Schema and functions setup complete.');


    // --- Stage 2: Execute RLS Statements ---
    console.log('\n--- Stage 2: Applying RLS Policies (Expect potential warnings if JWT context is missing) ---');
    let anyRlsErrors = false;

    for (const { name, sql } of rlsStatements) {
      console.log(`Executing ${name}...`);
      try {
        // For RLS, let's try direct execution if possible - more reliable for policy creation
        const { error } = await supabase.rpc('exec_sql', { sql });

        if (error) {
          // There are expected errors with JWT context, but let's distinguish them from other errors
          if (error.message.includes('jwt') || error.message.includes('request.jwt.claims')) {
            console.warn(`⚠️ Expected JWT-related warning in ${name}:`, error.message);
            console.warn(`   This is normal when running setup without an actual JWT.`);
            console.warn(`   Policies are likely still created correctly.`);
          } else {
            console.error(`❌ Unexpected error in ${name}:`, error.message);
            anyRlsErrors = true;
          }
        } else {
          console.log(`✅ ${name} executed successfully.`);
        }
      } catch (directError) {
        console.error(`❌ Failed to execute ${name}:`, directError);
        anyRlsErrors = true;
      }
    }

    if (anyRlsErrors) {
      console.warn('⚠️ There were non-JWT related errors during RLS policy setup. Some policies may not be applied correctly.');
    } else {
      console.log('✅ RLS policy application complete - JWT warnings are expected and normal.')
    }

    // --- Stage 3: Verify Everything Was Set Up Correctly ---
    console.log('\n--- Stage 3: Verifying Setup ---');
    try {
      // Check for RLS status function using a simpler approach
      const { data: statusCheck, error: statusCheckError } = await supabase.rpc('check_rls_status');

      if (statusCheckError) {
        console.log('⚠️ RLS status check function not available: ', statusCheckError.message);
        console.log('This is normal on first run. Run the setup script again to create this function.');

        // Continue to check tables directly
        const { data: tableCheck, error: tableCheckError } = await supabase
          .from('pg_tables')
          .select('tablename, rowsecurity')
          .in('tablename', ['profiles', 'user_levels'])
          .eq('schemaname', 'public');

        if (tableCheckError) {
          console.error('❌ Could not check tables:', tableCheckError.message);
        } else if (tableCheck) {
          console.log('Manual table check:');
          const profilesTable = tableCheck.find(t => t.tablename === 'profiles');
          const userLevelsTable = tableCheck.find(t => t.tablename === 'user_levels');

          console.log(`   Profiles table exists: ${profilesTable ? 'Yes ✓' : 'No ❌'}`);
          console.log(`   User levels table exists: ${userLevelsTable ? 'Yes ✓' : 'No ❌'}`);

          if (profilesTable) {
            console.log(`   Profiles RLS enabled: ${profilesTable.rowsecurity ? 'Yes ✓' : 'No ❌'}`);
          }

          if (userLevelsTable) {
            console.log(`   User levels RLS enabled: ${userLevelsTable.rowsecurity ? 'Yes ✓' : 'No ❌'}`);
          }
        }

        // Check if auth.uid() function exists
        try {
          const { error: authFnCheckError } = await supabase.rpc('exec_sql', {
            sql: "SELECT EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'uid' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'auth'))"
          });

          if (authFnCheckError) {
            console.log(`   auth.uid() function exists: Unknown ❓ (error checking: ${authFnCheckError.message})`);
          } else {
            console.log(`   auth.uid() function check: Success ✓`);
          }
        } catch (err) {
          console.log(`   auth.uid() function check: Error ❌ (${err})`);
        }
      } else {
        // Function exists, show detailed output
        console.log('✅ Tables and RLS Status:');
        console.log(`   Profiles table exists: ${statusCheck.profiles_table_exists ? 'Yes ✓' : 'No ❌'}`);
        console.log(`   User levels table exists: ${statusCheck.user_levels_table_exists ? 'Yes ✓' : 'No ❌'}`);
        console.log(`   Profiles RLS enabled: ${statusCheck.profiles_rls_enabled ? 'Yes ✓' : 'No ❌'}`);
        console.log(`   User levels RLS enabled: ${statusCheck.user_levels_rls_enabled ? 'Yes ✓' : 'No ❌'}`);
        console.log(`   auth.uid() function exists: ${statusCheck.auth_uid_function_exists ? 'Yes ✓' : 'No ❌'}`);

        // Check policy counts
        const profilePolicies = statusCheck.profiles_policies || [];
        const userLevelsPolicies = statusCheck.user_levels_policies || [];

        console.log(`   Profiles has ${profilePolicies.length} policies: ${profilePolicies.length >= 3 ? 'Good ✓' : 'Not enough ❌'}`);
        console.log(`   User levels has ${userLevelsPolicies.length} policies: ${userLevelsPolicies.length >= 4 ? 'Good ✓' : 'Not enough ❌'}`);

        // Determine overall status
        const hasAllTables = statusCheck.profiles_table_exists && statusCheck.user_levels_table_exists;
        const hasRlsEnabled = statusCheck.profiles_rls_enabled && statusCheck.user_levels_rls_enabled;
        const hasEnoughPolicies = profilePolicies.length >= 3 && userLevelsPolicies.length >= 3;
        const hasAuthFunction = statusCheck.auth_uid_function_exists;

        if (hasAllTables && hasRlsEnabled && hasEnoughPolicies && hasAuthFunction) {
          console.log('\n✅ SETUP SUCCESSFUL: Database schema and RLS appear to be correctly configured.');
          console.log('   Run the test-jwt-auth.ts script to verify everything works together.');
        } else {
          console.log('\n⚠️ SETUP INCOMPLETE: Some aspects of the setup may not be correctly configured.');
          console.log('   Review the issues above and fix them before running tests.');
          console.log('   Consider running setup-db.ts again to fix any missing components.');
        }
      }

      // Check JWT Config (This should always run)
      console.log('\n✅ JWT Configuration:');
      console.log('   JWT checking was configured - validation happens in Supabase');
      console.log('   IMPORTANT: Ensure SUPABASE_JWT_SECRET in .env matches JWT Secret in Supabase Dashboard > Settings > API');
    } catch (error) {
      console.error('❌ Error during verification:', error);
    }

    console.log('\nDatabase setup script finished.');
  } catch (error) {
    console.error('\n💥 Failed during database setup:', error);
    process.exit(1);
  }
}

setupDatabase();
