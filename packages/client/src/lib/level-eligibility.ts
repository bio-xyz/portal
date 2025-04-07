import { checkAllRequirementsCompleted } from './api/level-requirements';
import { getUserLevel, incrementUserLevel } from './api/user-levels';
import { agentLevels } from '../config/agent-levels';

/**
 * Check if a user is eligible to level up based on completed requirements
 */
export async function checkLevelupEligibility(userId: string): Promise<boolean> {
  // Get current user level
  const { level: currentLevel } = await getUserLevel(userId);

  // If there are no level-up requirements (e.g., at max level), user is not eligible
  if (!agentLevels[currentLevel]?.levelupRequirements?.length) {
    return false;
  }

  // Check if all requirements are completed
  const eligible = await checkAllRequirementsCompleted(userId, currentLevel);

  return eligible;
}

/**
 * Check eligibility and level up the user if they meet the requirements
 */
export async function checkAndProcessLevelUp(userId: string): Promise<{
  leveledUp: boolean;
  newLevel?: number;
}> {
  try {
    const eligible = await checkLevelupEligibility(userId);

    if (eligible) {
      // Get current level before updating
      const { level: currentLevel } = await getUserLevel(userId);

      // Increment user level
      await incrementUserLevel(userId);

      return {
        leveledUp: true,
        newLevel: currentLevel + 1,
      };
    }

    return { leveledUp: false };
  } catch (error) {
    console.error('Error checking level eligibility:', error);
    return { leveledUp: false };
  }
}
