import { Service, logger, type IAgentRuntime } from '@elizaos/core';
import { fetchUserLevel, updateUserLevel, type UserLevel } from '../lib/supabase';

export interface LevelRequirement {
    id: string;
    description: string;
}

export interface UserLevelService extends Service {
    getUserLevel(userId: string): Promise<number | null>;
    getLevelRequirements(level: number): Promise<LevelRequirement[]>;
    checkRequirements(userId: string, level: number): Promise<string[]>;
}

export class UserLevelService extends Service {
    static serviceType = 'user-level';
    capabilityDescription = 'Service for managing user levels in the BioDAO system.';

    constructor(protected runtime: IAgentRuntime) {
        super(runtime);
    }

    static async start(runtime: IAgentRuntime) {
        logger.info(`Starting user level service`);
        const service = new UserLevelService(runtime);
        return service;
    }

    static async stop(runtime: IAgentRuntime) {
        logger.info('Stopping user level service');
        // get the service from the runtime
        const service = runtime.getService(UserLevelService.serviceType);
        if (!service) {
            throw new Error('User level service not found');
        }
        service.stop();
    }

    async stop() {
        logger.info('User level service stopped');
    }

    /**
     * Get the current level of a user
     * @param userId The ID of the user
     * @returns The user's level or null if not found
     */
    async getUserLevel(userId: string): Promise<number | null> {
        try {
            const userLevel = await fetchUserLevel(userId);
            return userLevel?.level || null;
        } catch (error) {
            logger.error('Error getting user level:', error);
            return null;
        }
    }

    /**
     * Update the level of a user
     * @param userId The ID of the user
     * @param level The new level
     * @returns Whether the update was successful
     */
    async setUserLevel(userId: string, level: number): Promise<boolean> {
        try {
            return await updateUserLevel(userId, level);
        } catch (error) {
            logger.error('Error setting user level:', error);
            return false;
        }
    }

    /**
     * Increment the level of a user
     * @param userId The ID of the user
     * @returns Whether the increment was successful
     */
    async incrementUserLevel(userId: string): Promise<boolean> {
        try {
            const currentLevel = await this.getUserLevel(userId);
            if (currentLevel === null) {
                // If user doesn't have a level yet, set it to 1
                return await this.setUserLevel(userId, 1);
            }

            // Increment the level
            return await this.setUserLevel(userId, currentLevel + 1);
        } catch (error) {
            logger.error('Error incrementing user level:', error);
            return false;
        }
    }
} 