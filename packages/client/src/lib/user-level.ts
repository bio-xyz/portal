// Re-export user level functionality from api module
export {
    createOrUpdateUserLevel,
    getUserLevel,
    levelUpUser
} from './api/user-level';

// Re-export the UserProgress type from database types
export type { UserProgress } from '../types/database.types'; 