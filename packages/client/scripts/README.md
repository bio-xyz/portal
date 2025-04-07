# Supabase Database Scripts

This directory contains scripts for managing and testing your Supabase database connection.

## Available Scripts

### Test Connection

Tests if the Supabase connection is working properly.

```bash
bun run db:test
```

This will check if your Supabase instance is accessible and the connection is properly configured.

### Setup Database

Sets up the necessary database schema for the application.

```bash
bun run db:setup
```

This script creates the following:

- `user_levels` table to store user progression
- Triggers for automatic timestamp updates
- Row-level security policies

Note: If your Supabase instance doesn't have the `exec_sql` RPC function, the script will output the SQL to run manually in the Supabase SQL editor.

### Reset Database

Resets all data in the database by truncating all tables.

```bash
bun run db:reset
```

⚠️ **WARNING**: This will delete ALL data in the database. Use with caution, especially in production environments.

## Prerequisites

1. Make sure your environment variables are set correctly:

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

2. Ensure Supabase SDK is installed:
   ```bash
   bun install @supabase/supabase-js
   ```

## Troubleshooting

If you encounter connection issues:

1. Check that your environment variables are set correctly
2. Verify your Supabase project is up and running
3. Ensure your database tables exist
4. Check your network connection
5. Verify IP restrictions in Supabase dashboard
