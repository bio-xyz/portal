import { supabase } from '../src/lib/supabase-client';

async function resetDatabase() {
  // List of tables to reset
  const tables = ['profiles', 'projects', 'agent_interactions', 'user_progress', 'nft_metadata', 'user_levels'];

  console.log('Starting database reset...');

  try {
    // Truncate each table
    for (const table of tables) {
      console.log(`Truncating ${table}...`);
      const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) {
        if (error.code === '42P01') {
          // Table doesn't exist
          console.log(`Table ${table} doesn't exist, skipping.`);
        } else {
          console.error(`Error truncating ${table}:`, error.message);
        }
      } else {
        console.log(`${table} successfully truncated.`);
      }
    }

    console.log('Database reset complete!');
  } catch (error) {
    console.error('Reset failed:', error);
  }
}

// Confirm before resetting
console.log('WARNING: This will delete ALL data in the database.');
console.log('To proceed, press Enter. To cancel, press Ctrl+C');

process.stdin.once('data', () => {
  resetDatabase();
});
