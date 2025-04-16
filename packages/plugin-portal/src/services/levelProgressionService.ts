import { IAgentRuntime, Service, logger } from '@elizaos/core';
import { supabase } from '../lib/supabase';
import { Level, LEVELS, LevelRequirement, UserProgress } from '../types/levels';
// Placeholder for EmailService - replace with actual import when created
// import { EmailService } from './emailService';

export class LevelProgressionService extends Service {
    public capabilityDescription: string = 'Manages user level progression, requirements, and status within the DAO onboarding.';
    private emailService: any; // Placeholder type

    constructor(runtime: IAgentRuntime) {
        super(runtime);
        // TODO: Initialize EmailService properly
        // this.emailService = runtime.getService<EmailService>('EmailService');
    }

    async getUserProgress(privyId: string): Promise<UserProgress | null> {
        logger.info(`[LPS] Getting user progress for privyId: ${privyId}`);
        try {
            // Fetch user level
            const { data: levelData, error: levelError } = await supabase
                .from('user_levels')
                .select('level, updated_at')
                .eq('privy_id', privyId)
                .single();

            if (levelError && levelError.code !== 'PGRST116') {
                logger.error(`[LPS] Error fetching user level for ${privyId}:`, levelError);
                return null;
            }
            if (!levelData) {
                // User level record doesn't exist, so progress doesn't exist
                // logger.warn(`[LPS] No user level found for ${privyId}`); // Removed redundant log, getOrCreate handles this
                return null;
            }

            // Fetch requirement progress for the current level
            const { data: requirementsData, error: reqError } = await supabase
                .from('requirement_progress')
                .select('requirement, completed') // No need to select level again
                .eq('privy_id', privyId) // *** FIXED: Use privy_id ***
                .eq('level', levelData.level);

            if (reqError) {
                logger.error(`[LPS] Error fetching requirement progress for ${privyId}, level ${levelData.level}:`, reqError);
                // Return partial data? Or null? Returning null for now.
                return null;
            }

            const completedRequirements = requirementsData
                ?.filter(r => r.completed)
                .map(r => r.requirement) || [];

            // Calculate progress for current level requirements
            const currentLevelDef = LEVELS[levelData.level];
            const progressMap: Record<string, number> = {};
            if (currentLevelDef) {
                for (const reqDef of currentLevelDef.requirements) {
                    if (reqDef.progress) {
                        try {
                            // Pass runtime correctly
                            const prog = await reqDef.progress(privyId, this.runtime);
                            progressMap[reqDef.id] = Math.max(0, Math.min(100, Math.round(prog))); // Ensure progress is 0-100
                        } catch (progError) {
                            logger.error(`[LPS] Error calculating progress for ${reqDef.id} for ${privyId}:`, progError);
                            progressMap[reqDef.id] = 0;
                        }
                    } else {
                        // If no progress function, use completion status from DB
                        const reqProgress = requirementsData?.find(r => r.requirement === reqDef.id);
                        progressMap[reqDef.id] = reqProgress?.completed ? 100 : 0;
                    }
                }
            }

            return {
                userId: privyId,
                currentLevel: levelData.level,
                completedRequirements: completedRequirements,
                progress: progressMap,
                lastUpdated: new Date(levelData.updated_at),
            };
        } catch (error) {
            logger.error(`[LPS] Exception getting user progress for ${privyId}:`, error);
            return null;
        }
    }

    async getOrCreateUserProgress(privyId: string): Promise<UserProgress | null> {
        logger.info(`[LPS] Getting or creating user progress for privyId: ${privyId}`);
        let progress = await this.getUserProgress(privyId);
        if (progress) {
            return progress;
        }

        logger.info(`[LPS] User progress not found for ${privyId}, attempting creation via RPC...`);
        try {
            const { data: rpcData, error: rpcError } = await supabase.rpc('create_default_user_level', {
                p_privy_id: privyId,
            });

            if (rpcError) {
                logger.error(`[LPS] Error calling create_default_user_level RPC for ${privyId}:`, rpcError);
                return null;
            }

            // Check if the RPC actually returned the created level data
            if (!rpcData || typeof rpcData.level !== 'number' || typeof rpcData.updated_at !== 'string') {
                logger.error(`[LPS] create_default_user_level RPC returned unexpected data for ${privyId}:`, rpcData);
                // Attempt to fetch anyway, maybe RPC just didn't return RETURNING data
                return await this.getUserProgress(privyId);
            }

            logger.info(`[LPS] Default level created via RPC for ${privyId}. Constructing default progress object.`);

            // *** OPTIMIZATION: Construct default UserProgress instead of re-fetching ***
            const defaultLevelDef = LEVELS[rpcData.level];
            const defaultProgressMap: Record<string, number> = {};
            if (defaultLevelDef) {
                for (const reqDef of defaultLevelDef.requirements) {
                    // Initial progress is likely 0, unless progress function says otherwise
                    if (reqDef.progress) {
                        try {
                            defaultProgressMap[reqDef.id] = await reqDef.progress(privyId, this.runtime);
                        } catch { defaultProgressMap[reqDef.id] = 0; }
                    } else {
                        defaultProgressMap[reqDef.id] = 0;
                    }
                }
            }

            return {
                userId: privyId,
                currentLevel: rpcData.level, // Use level from RPC response
                completedRequirements: [], // No requirements completed initially
                progress: defaultProgressMap, // Calculated default progress
                lastUpdated: new Date(rpcData.updated_at) // Use timestamp from RPC response
            };

        } catch (error) {
            logger.error(`[LPS] Exception in getOrCreateUserProgress for ${privyId}:`, error);
            return null;
        }
    }

    async checkRequirementStatus(privyId: string, requirementId: string): Promise<{ completed: boolean; progress: number }> {
        logger.info(`[LPS] Checking requirement status for ${privyId}, requirement: ${requirementId}`);
        let requirement: LevelRequirement | null = null;
        let levelId = 0;

        // Find the requirement definition in LEVELS
        for (const lvlId in LEVELS) {
            const level = LEVELS[lvlId as unknown as keyof typeof LEVELS];
            const foundReq = level.requirements.find(req => req.id === requirementId);
            if (foundReq) {
                requirement = foundReq;
                levelId = level.id;
                break;
            }
        }

        if (!requirement) {
            logger.error(`[LPS] Requirement definition not found for ID: ${requirementId}`);
            return { completed: false, progress: 0 };
        }

        try {
            const completed = await requirement.validator(privyId, this.runtime);
            let progress = 0;
            if (requirement.progress) {
                progress = await requirement.progress(privyId, this.runtime);
            } else {
                progress = completed ? 100 : 0;
            }

            // Ensure progress is between 0 and 100
            progress = Math.max(0, Math.min(100, Math.round(progress)));

            // Optionally update the requirement_progress table here if status changed
            // This ensures the DB reflects the latest check, although `mark_requirement_completed` RPC is preferred for explicit updates.
            // await this.updateRequirementProgress(privyId, levelId, requirementId, completed);

            logger.info(`[LPS] Status for ${requirementId} (User: ${privyId}): Completed=${completed}, Progress=${progress}%`);
            return { completed, progress };
        } catch (error) {
            logger.error(`[LPS] Error validating requirement ${requirementId} for ${privyId}:`, error);
            return { completed: false, progress: 0 };
        }
    }

    async updateRequirementProgress(privyId: string, level: number, requirement: string, completed: boolean, completedAt?: Date): Promise<boolean> {
        logger.info(`[LPS] Updating requirement progress for ${privyId}, Level: ${level}, Req: ${requirement}, Completed: ${completed}`);
        try {
            // Use the dedicated RPC function which also handles potential level up check
            const { data, error } = await supabase.rpc('mark_requirement_completed', {
                p_privy_id: privyId,
                p_level: level,
                p_requirement: requirement,
                p_completed: completed
            });

            if (error) {
                logger.error(`[LPS] Error calling mark_requirement_completed for ${privyId}, Req: ${requirement}:`, error);
                return false;
            }

            logger.info(`[LPS] mark_requirement_completed response for ${privyId}, Req: ${requirement}: ${JSON.stringify(data)}`);

            // Check if level up occurred based on RPC response (if needed here)
            if (data?.level_up === true && this.emailService) {
                // TODO: Fetch recipient details and level info before sending email
                // const recipient = await this.getRecipientDetails(privyId);
                // const levelInfo = LEVELS[data.new_level];
                // await this.emailService.sendLevelCompleteEmail(recipient, levelInfo);
                logger.info(`[LPS] Triggered level up email for ${privyId} to level ${data.new_level}`);
            }

            return data?.success ?? false;
        } catch (error) {
            logger.error(`[LPS] Exception updating requirement progress for ${privyId}, Req: ${requirement}:`, error);
            return false;
        }
    }

    async checkAndAdvanceLevel(privyId: string): Promise<{ leveledUp: boolean; newLevel?: number; triggeredSandbox?: boolean }> {
        logger.info(`[LPS] Checking and advancing level for ${privyId}`);
        try {
            const { data: rpcData, error: rpcError } = await supabase.rpc('update_user_level_if_eligible', {
                p_privy_id: privyId,
            });

            if (rpcError) {
                logger.error(`[LPS] Error calling update_user_level_if_eligible for ${privyId}:`, rpcError);
                return { leveledUp: false };
            }

            logger.info(`[LPS] update_user_level_if_eligible response for ${privyId}: ${JSON.stringify(rpcData)}`);

            if (!rpcData?.success) {
                logger.warn(`[LPS] update_user_level_if_eligible indicates failure or no action for ${privyId}. Message: ${rpcData?.message}`);
                return { leveledUp: false };
            }

            const leveledUp = rpcData.level_up === true;
            const newLevel = rpcData.new_level;
            let triggeredSandbox = false;

            if (leveledUp && this.emailService) {
                // TODO: Fetch recipient details and level info
                // const recipient = await this.getRecipientDetails(privyId);
                // const levelInfo = LEVELS[newLevel];
                // await this.emailService.sendLevelCompleteEmail(recipient, levelInfo);
                logger.info(`[LPS] Triggered level up email for ${privyId} to level ${newLevel}`);

                // Check if the new level completed triggers the sandbox step
                // Assuming sandbox is triggered *after* completing level 4 requirements
                const finalLevelId = Math.max(...Object.keys(LEVELS).map(Number));
                if (rpcData.old_level === finalLevelId && newLevel === null) { // Or check if newLevel indicates completion
                    logger.info(`[LPS] Final level completed by ${privyId}, triggering sandbox...`);
                    triggeredSandbox = true;
                    // TODO: Fetch profile data
                    // const profile = await this.fetchProfile(privyId);
                    // const recipient = await this.getRecipientDetails(privyId);
                    // await this.emailService.sendSandboxReachedEmail(recipient, profile);
                    logger.info(`[LPS] Triggered sandbox email for ${privyId}`);
                }
            }

            return { leveledUp, newLevel, triggeredSandbox };
        } catch (error) {
            logger.error(`[LPS] Exception checking/advancing level for ${privyId}:`, error);
            return { leveledUp: false };
        }
    }

    async getCurrentLevelInfo(privyId: string): Promise<Level | null> {
        const progress = await this.getOrCreateUserProgress(privyId);
        if (!progress) return null;
        return LEVELS[progress.currentLevel as keyof typeof LEVELS] || null;
    }

    async getNextLevelInfo(privyId: string): Promise<Level | null> {
        const progress = await this.getOrCreateUserProgress(privyId);
        if (!progress) return null;

        const currentLevel = LEVELS[progress.currentLevel as keyof typeof LEVELS];
        if (!currentLevel || !currentLevel.nextLevelId) {
            // Find next level sequentially if nextLevelId is not defined
            const nextLevelKey = progress.currentLevel + 1;
            if (LEVELS[nextLevelKey as keyof typeof LEVELS]) {
                return LEVELS[nextLevelKey as keyof typeof LEVELS];
            }
            return null; // At max level or next not defined
        }

        return LEVELS[currentLevel.nextLevelId as keyof typeof LEVELS] || null;
    }

    // --- Helper methods (TODO: Implement fully) ---
    // private async getRecipientDetails(privyId: string): Promise<any> {
    //   // Fetch email, name etc. from profiles table
    //   const { data, error } = await supabase.from('profiles').select('email, full_name').eq('privy_id', privyId).single();
    //   if (error || !data) {
    //       logger.error(`[LPS] Failed to get recipient details for ${privyId}`, error);
    //       return { email: '', name: 'User' }; // Default fallback
    //   }
    //   return { email: data.email, name: data.full_name, userId: privyId };
    // }

    // private async fetchProfile(privyId: string): Promise<any> {
    //     // Fetch full profile data
    //     const { data, error } = await supabase.rpc('get_full_profile', { p_privy_id: privyId });
    //     if (error || !data) {
    //         logger.error(`[LPS] Failed to fetch profile for ${privyId}`, error);
    //         return null;
    //     }
    //     return data;
    // }

    // Required by Service base class
    async start(): Promise<void> {
        logger.info('[LPS] LevelProgressionService started');
    }
    async stop(): Promise<void> {
        logger.info('[LPS] LevelProgressionService stopped');
    }
} 