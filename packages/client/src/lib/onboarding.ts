// Re-export onboarding functionality from api module
export {
    getOnboardingProfile,
    createOnboardingProfile,
    updateOnboardingProfile,
    deleteOnboardingProfile
} from './api/onboarding';

// Re-export the OnboardingProfile type from database types
export type { Profile as OnboardingProfile } from '../types/database.types'; 