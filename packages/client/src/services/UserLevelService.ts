import {
  SupabaseService,
  UserLevel,
  LevelRequirement,
  RequirementProgress,
} from './SupabaseService';

export class UserLevelService {
  private static instance: UserLevelService;
  private supabaseService: SupabaseService;

  private constructor() {
    this.supabaseService = SupabaseService.getInstance();
  }

  public static getInstance(): UserLevelService {
    if (!UserLevelService.instance) {
      UserLevelService.instance = new UserLevelService();
    }
    return UserLevelService.instance;
  }

  async getUserLevel(privyId: string): Promise<UserLevel | null> {
    try {
      return await this.supabaseService.getUserLevel(privyId);
    } catch (error) {
      console.error('Error getting user level:', error);
      return null;
    }
  }

  async createUserLevel(privyId: string, level: number = 1): Promise<UserLevel> {
    try {
      return await this.supabaseService.createUserLevel(privyId, level);
    } catch (error) {
      console.error('Error creating user level:', error);
      throw error;
    }
  }

  async updateUserLevel(privyId: string, level: number): Promise<UserLevel> {
    try {
      return await this.supabaseService.updateUserLevel(privyId, level);
    } catch (error) {
      console.error('Error updating user level:', error);
      throw error;
    }
  }

  async getLevelRequirements(level: number): Promise<LevelRequirement | null> {
    try {
      return await this.supabaseService.getLevelRequirements(level);
    } catch (error) {
      console.error('Error getting level requirements:', error);
      return null;
    }
  }

  async getRequirementProgress(userId: string, level: number): Promise<RequirementProgress[]> {
    try {
      return await this.supabaseService.getRequirementProgress(userId, level);
    } catch (error) {
      console.error('Error getting requirement progress:', error);
      return [];
    }
  }

  async updateRequirementProgress(
    userId: string,
    level: number,
    requirement: string,
    completed: boolean
  ): Promise<RequirementProgress> {
    try {
      return await this.supabaseService.updateRequirementProgress(
        userId,
        level,
        requirement,
        completed
      );
    } catch (error) {
      console.error('Error updating requirement progress:', error);
      throw error;
    }
  }

  async checkRequirementsCompletion(userId: string, level: number): Promise<boolean> {
    try {
      return await this.supabaseService.checkRequirementsCompletion(userId, level);
    } catch (error) {
      console.error('Error checking requirements completion:', error);
      return false;
    }
  }

  async incrementUserLevel(privyId: string): Promise<UserLevel | null> {
    try {
      const currentLevel = await this.getUserLevel(privyId);
      if (!currentLevel) {
        return await this.createUserLevel(privyId);
      }

      const hasCompletedRequirements = await this.checkRequirementsCompletion(
        privyId,
        currentLevel.level
      );
      if (!hasCompletedRequirements) {
        throw new Error('Cannot increment level: requirements not completed');
      }

      return await this.updateUserLevel(privyId, currentLevel.level + 1);
    } catch (error) {
      console.error('Error incrementing user level:', error);
      return null;
    }
  }
}
