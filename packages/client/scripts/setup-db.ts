import { supabase } from '../src/lib/supabase-client';
import fs from 'fs';
import path from 'path';

async function setupDatabase() {
  console.log('Setting up database schema...');

  try {
    // Read the SQL file
    const sqlPath = path.join(process.cwd(), 'scripts', 'setup-user-levels.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      if (error.message.includes('function "exec_sql" does not exist')) {
        console.error('Error: The exec_sql function does not exist on your Supabase instance.');
        console.log(
          'Please create this function or run the SQL manually in the Supabase SQL editor.'
        );

        // Show the SQL as fallback
        console.log('\nSQL to run manually:');
        console.log('-'.repeat(50));
        console.log(sql);
        console.log('-'.repeat(50));
      } else {
        console.error('Error setting up database:', error.message);
      }
      return;
    }

    console.log('Database schema setup successfully!');
  } catch (error) {
    console.error('Failed to set up database schema:', error);
  }
}

setupDatabase();
