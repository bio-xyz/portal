# BioDAO Portal Plugin for ElizaOS

This ElizaOS plugin implements the BioDAO onboarding flow using an AI-first design via CoreAgent. The plugin manages user progression through levels, Discord community integration, and NFT minting.

## Features

- **Level-Based Progression System**

  - Level 1: Science NFTs Minted (Idea NFT, Hypothesis NFT)
  - Level 2: Community Initiated (Discord created, 4 Discord members)
  - Level 3: Community Growth + Proof (10 Discord members, 25 papers shared, 100 messages sent)
  - Level 4: Sandbox Guide

- **Discord Integration**

  - Bot invitation system
  - Member count tracking
  - Message quality assessment
  - Scientific paper sharing detection

- **User Level Management**
  - Level requirement checking
  - Level progression tracking
  - Level-based content visibility

## Development

```bash
# Start development with hot-reloading
npm run dev

# Build the plugin
npm run build

# Test the plugin
npm run test
```

## Configuration

The plugin requires the following environment variables:

```json
{
  "SUPABASE_URL": "Your Supabase URL",
  "SUPABASE_ANON_KEY": "Your Supabase anonymous key",
  "DISCORD_BOT_CLIENT_ID": "Your Discord bot client ID",
  "API_BASE_URL": "Your API base URL"
}
```

## Actions

The plugin provides the following actions:

- `CHECK_LEVEL_REQUIREMENTS`: Verifies if a user has met requirements for the next level
- `GET_USER_LEVEL`: Retrieves a user's current level
- `FETCH_USER_LEVEL`: Fetches a user's level from the database
- `UPDATE_USER_LEVEL`: Updates a user's level in the database
- `INCREMENT_USER_LEVEL`: Increments a user's level
- `INVITE_DISCORD_BOT`: Generates an invitation link for the BioDAO Discord bot
- `CHECK_DISCORD_MEMBER_COUNT`: Checks the member count of a Discord server

## Services

- `UserLevelService`: Manages user level data and progression

## Publishing

Before publishing your plugin to the ElizaOS registry, ensure you meet these requirements:

1. **GitHub Repository**

   - Create a public GitHub repository for this plugin
   - Add the 'elizaos-plugins' topic to the repository
   - Use 'main' as the default branch

2. **Required Assets**

   - Add images to the `images/` directory:
     - `logo.jpg` (400x400px square, <500KB)
     - `banner.jpg` (1280x640px, <1MB)

3. **Publishing Process**

   ```bash
   # Check if your plugin meets all registry requirements
   npx elizaos plugin publish --test

   # Publish to the registry
   npx elizaos plugin publish
   ```

## Documentation

This plugin implements the BioDAO onboarding flow with the following key components:

- **Agent-First Interaction**: All major user actions are mediated through the chat UI
- **Dashboard Rules**: Read-only display of current level and progress metrics
- **Level Visibility Rules**: Users can only see their current level and next level requirements
- **Discord Integration**: Custom Discord bot for tracking member count, paper shares, and message quality
- **Email System**: Automated emails for level completion and sandbox step notifications
