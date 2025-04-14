import type { Plugin } from '@elizaos/core';
import {
  type Action,
  type Content,
  type GenerateTextParams,
  type HandlerCallback,
  type IAgentRuntime,
  type Memory,
  ModelType,
  type Provider,
  type ProviderResult,
  Service,
  type State,
  logger,
} from '@elizaos/core';
import { z } from 'zod';

// Import actions
import { checkLevelRequirementsAction } from './actions/check-level-requirements';
import { fetchUserLevelAction } from './actions/fetch-user-level';
import { getUserLevelAction } from './actions/get-user-level';
import { incrementUserLevelAction } from './actions/increment-user-level';
import { updateUserLevelAction } from './actions/update-user-level';
import { inviteDiscordBotAction } from './actions/invite-discord-bot';
import { checkDiscordMemberCountAction } from './actions/check-discord-member-count';
import { sendEmailAction } from './actions/send-email';
import { sendLevelUpEmailAction } from './actions/send-level-up-email';

// Import services
import { UserLevelService } from './services/user-level-service';

/**
 * Defines the configuration schema for a plugin, including the validation rules for the plugin name.
 *
 * @type {import('zod').ZodObject<{ EXAMPLE_PLUGIN_VARIABLE: import('zod').ZodString }>}
 */
const configSchema = z.object({
  SUPABASE_URL: z
    .string()
    .min(1, 'Supabase URL is not provided')
    .optional()
    .transform((val) => {
      if (!val) {
        logger.warn('Supabase URL is not provided (this is expected)');
      }
      return val;
    }),
  SUPABASE_ANON_KEY: z
    .string()
    .min(1, 'Supabase anonymous key is not provided')
    .optional()
    .transform((val) => {
      if (!val) {
        logger.warn('Supabase anonymous key is not provided (this is expected)');
      }
      return val;
    }),
});

/**
 * Example HelloWorld action
 * This demonstrates the simplest possible action structure
 */
/**
 * Action representing a hello world message.
 * @typedef {Object} Action
 * @property {string} name - The name of the action.
 * @property {string[]} similes - An array of related actions.
 * @property {string} description - A brief description of the action.
 * @property {Function} validate - Asynchronous function to validate the action.
 * @property {Function} handler - Asynchronous function to handle the action and generate a response.
 * @property {Object[]} examples - An array of example inputs and expected outputs for the action.
 */


export class StarterService extends Service {
  static serviceType = 'starter';
  capabilityDescription =
    'This is a starter service which is attached to the agent through the starter plugin.';
  constructor(protected runtime: IAgentRuntime) {
    super(runtime);
  }

  static async start(runtime: IAgentRuntime) {
    logger.info(`*** Starting starter service - MODIFIED: ${new Date().toISOString()} ***`);
    const service = new StarterService(runtime);
    return service;
  }

  static async stop(runtime: IAgentRuntime) {
    logger.info('*** TESTING DEV MODE - STOP MESSAGE CHANGED! ***');
    // get the service from the runtime
    const service = runtime.getService(StarterService.serviceType);
    if (!service) {
      throw new Error('Starter service not found');
    }
    service.stop();
  }

  async stop() {
    logger.info('*** THIRD CHANGE - TESTING FILE WATCHING! ***');
  }
}

export const portalPlugin: Plugin = {
  name: 'plugin-portal',
  description: 'Portal plugin for elizaOS',
  config: {
    SUPABASE_URL: process.env.VITE_SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
    DISCORD_BOT_CLIENT_ID: process.env.VITE_DISCORD_BOT_CLIENT_ID,
    API_BASE_URL: process.env.VITE_API_BASE_URL,
  },
  async init(config: Record<string, string>) {
    logger.info('Initializing portal plugin');
    try {
      const validatedConfig = await configSchema.parseAsync(config);

      // Set all environment variables at once
      for (const [key, value] of Object.entries(validatedConfig)) {
        if (value) process.env[key] = value;
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(
          `Invalid plugin configuration: ${error.errors.map((e) => e.message).join(', ')}`
        );
      }
      throw error;
    }
  },
  models: {
    [ModelType.TEXT_SMALL]: async (
      _runtime,
      { prompt, stopSequences = [] }: GenerateTextParams
    ) => {
      return 'This is a placeholder for the TEXT_SMALL model in the portal plugin.';
    },
    [ModelType.TEXT_LARGE]: async (
      _runtime,
      {
        prompt,
        stopSequences = [],
        maxTokens = 8192,
        temperature = 0.7,
        frequencyPenalty = 0.7,
        presencePenalty = 0.7,
      }: GenerateTextParams
    ) => {
      return 'This is a placeholder for the TEXT_LARGE model in the portal plugin.';
    },
  },
  tests: [
    {
      name: 'portal_plugin_test_suite',
      tests: [
        {
          name: 'verify_user_level_service',
          fn: async (runtime) => {
            logger.debug('verify_user_level_service run by ', runtime.character.name);
            // Verify the plugin is loaded properly
            const service = runtime.getService('user-level');
            if (!service) {
              throw new Error('User level service not found');
            }
          },
        },
      ],
    },
  ],
  routes: [
    {
      path: '/user-level/:userId',
      type: 'GET',
      handler: async (req: any, res: any) => {
        // This is a placeholder route for user level information
        res.json({
          message: 'User level endpoint',
          userId: req.params.userId,
        });
      },
    },
  ],
  events: {
    MESSAGE_RECEIVED: [
      async (params) => {
        logger.debug('MESSAGE_RECEIVED event received');
        // print the keys
        logger.debug(Object.keys(params));
      },
    ],
    VOICE_MESSAGE_RECEIVED: [
      async (params) => {
        logger.debug('VOICE_MESSAGE_RECEIVED event received');
        // print the keys
        logger.debug(Object.keys(params));
      },
    ],
    WORLD_CONNECTED: [
      async (params) => {
        logger.debug('WORLD_CONNECTED event received');
        // print the keys
        logger.debug(Object.keys(params));
      },
    ],
    WORLD_JOINED: [
      async (params) => {
        logger.debug('WORLD_JOINED event received');
        // print the keys
        logger.debug(Object.keys(params));
      },
    ],
  },
  services: [UserLevelService],
  actions: [
    checkLevelRequirementsAction,
    fetchUserLevelAction,
    getUserLevelAction,
    incrementUserLevelAction,
    updateUserLevelAction,
    inviteDiscordBotAction,
    checkDiscordMemberCountAction,
    sendEmailAction,
    sendLevelUpEmailAction,
  ],
  providers: [],
};

export default portalPlugin;
