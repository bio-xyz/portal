import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import path from 'path';

// Load environment variables from root .env file
const rootEnvPath = path.resolve(process.cwd(), '../../.env');
config({ path: rootEnvPath });

// Get environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
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

async function resetJwtAuth() {
    console.log('Resetting JWT authentication functions...');

    try {
        // Define JWT auth functions SQL
        const resetJwtAuthSql = `
      -- Create auth schema if not exists
      CREATE SCHEMA IF NOT EXISTS auth;
      
      -- Drop existing functions
      DROP FUNCTION IF EXISTS auth.uid();
      DROP FUNCTION IF EXISTS auth.check_privy_id();
      
      -- Create auth.uid() function to extract privy_id from JWT claims
      CREATE FUNCTION auth.uid() 
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
      CREATE FUNCTION auth.check_privy_id() 
      RETURNS boolean AS $$
      BEGIN
        RETURN auth.uid() IS NOT NULL;
      END;
      $$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
      
      -- Grant access to JWT checking functions
      GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated, anon, service_role;
      GRANT EXECUTE ON FUNCTION auth.check_privy_id() TO authenticated, anon, service_role;
    `;

        // Execute SQL directly
        const { error } = await supabase.rpc('exec_sql', { sql: resetJwtAuthSql });

        if (error) {
            console.error('Error resetting JWT auth functions:', error.message);
            process.exit(1);
        }

        console.log('✅ JWT authentication functions have been reset successfully!');

        // Verify functions
        console.log('\nVerifying functions...');
        const verifyFunctionsSql = `
      SELECT 
        EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'uid' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'auth')) as uid_exists,
        EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'check_privy_id' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'auth')) as check_privy_id_exists;
    `;

        const { data: verifyResult, error: verifyError } = await supabase.rpc('exec_sql', { sql: verifyFunctionsSql });

        if (verifyError) {
            console.error('Error verifying functions:', verifyError.message);
        } else {
            console.log(`auth.uid() function exists: ${verifyResult?.uid_exists ? 'Yes ✓' : 'No ❌'}`);
            console.log(`auth.check_privy_id() function exists: ${verifyResult?.check_privy_id_exists ? 'Yes ✓' : 'No ❌'}`);
        }

        console.log('\nRun test-jwt-auth.ts to verify everything is working correctly.');

    } catch (error) {
        console.error('Failed during reset:', error);
        process.exit(1);
    }
}

resetJwtAuth(); 