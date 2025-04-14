import { supabase } from '../src/lib/supabase-client';

async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Connection error:', error.message);
      return;
    }

    console.log('Connection successful!', data);
    console.log('Supabase is live and connected.');
  } catch (error) {
    console.error('Connection failed:', error);
  }
}

testConnection();
