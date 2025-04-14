# Database Setup Scripts

This directory contains SQL scripts and utilities for setting up and managing the BioDAO database.

## SQL Scripts

- `setup-auth.sql`: Sets up authentication-related tables and functions
- `setup-onboarding.sql`: Creates the profiles table with RLS policies
- `setup-user-levels.sql`: Creates the user_levels table for tracking user progression

## Database Schema

### profiles

The `profiles` table stores user profile information:

```sql
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  privy_id TEXT UNIQUE,
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
```

### Row-Level Security (RLS)

The scripts apply appropriate RLS policies for all tables:

- Read policies: Users can read their own data
- Insert policies: Users can insert their own data
- Update policies: Users can update their own data

## Utility Scripts

- `setup-db.ts`: Executes all SQL scripts in the correct order to set up the database

## Usage

Run the database setup with:

```bash
npm run setup-db
```

This will create all necessary tables, indexes, and security policies in your Supabase instance.
