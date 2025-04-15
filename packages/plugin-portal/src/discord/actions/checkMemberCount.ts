import {
  type Action,
  type Content,
  type HandlerCallback,
  type IAgentRuntime,
  type Memory,
  type State,
  logger,
} from '@elizaos/core';
import { DiscordService } from '../service';
import { ServiceType } from '../types';
import { DISCORD_SERVICE_NAME, type ServiceTypeName } from '../types';

// Define interfaces for the data structures
interface DiscordServerData {
  serverId?: string;
  serverName?: string;
  memberCount?: number;
}

/**
 * Action to check the member count of a Discord server
 */
export const checkMemberCountAction: Action = {
  name: 'CHECK_DISCORD_MEMBER_COUNT',
  similes: ['GET_DISCORD_MEMBERS', 'CHECK_SERVER_SIZE', 'VERIFY_DISCORD_SERVER'],
  description: 'Checks the member count of a Discord server',

  validate: async (runtime: IAgentRuntime, message: Memory, _state: State): Promise<boolean> => {
    const discordService = runtime.getService(ServiceType.DISCORD) as DiscordService;
    if (!discordService) {
      logger.warn('Discord service not available');
      return false;
    }
    return true;
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state: State,
    _options: any,
    callback: HandlerCallback,
    _responses: Memory[]
  ) => {
    try {
      logger.info('Handling CHECK_DISCORD_MEMBER_COUNT action');

      const discordService = runtime.services.get(
        DISCORD_SERVICE_NAME as ServiceTypeName
      ) as DiscordService;
      if (!discordService) {
        throw new Error('Discord service not available');
      }

      // Extract server ID from the message or state
      const messageData = message.content.data as DiscordServerData | undefined;
      const stateData = _state.data as DiscordServerData | undefined;

      const serverId =
        messageData?.serverId ||
        stateData?.serverId ||
        (await discordService.extractServerIdFromMessage(message.content.text));

      if (!serverId) {
        const errorContent: Content = {
          text: "I couldn't find a Discord server ID. Please provide the server ID or make sure the bot has been added to your server.",
          source: message.content.source,
        };
        await callback(errorContent);
        return errorContent;
      }

      // Get the guild from Discord service
      const guild = await discordService.getGuild(serverId);
      if (!guild) {
        const errorContent: Content = {
          text: "I couldn't find your Discord server. Make sure the bot has been added to your server and try again.",
          source: message.content.source,
        };
        await callback(errorContent);
        return errorContent;
      }

      // Get member count and server info
      const memberCount = guild.memberCount;
      const serverName = guild.name;

      // Create the response content
      const responseContent: Content = {
        text: `Your Discord server "${serverName}" currently has ${memberCount} members.`,
        actions: ['CHECK_DISCORD_MEMBER_COUNT'],
        source: message.content.source,
        data: {
          serverId,
          serverName,
          memberCount,
        },
      };

      // Call back with the response
      await callback(responseContent);

      return responseContent;
    } catch (error) {
      logger.error('Error in CHECK_DISCORD_MEMBER_COUNT action:', error);
      throw error;
    }
  },
};
