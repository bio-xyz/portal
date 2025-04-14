import React, { createContext, useContext, useEffect, useState } from 'react';
import { z } from 'zod';
import { useAuth } from './use-auth'; // Import useAuth
import { getOnboardingProfile, createOnboardingProfile } from './onboarding'; // Import API functions directly from the re-export
import { Profile } from '../types/database.types'; // Import Profile type

// Form schema from onboarding-form.tsx
const formSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  projectName: z.string().min(2, 'Project name must be at least 2 characters'),
  projectDescription: z.string().min(10, 'Please provide a more detailed project description'),
  projectVision: z.string().min(10, 'Please provide a more detailed project vision'),
  scientificReferences: z.string().min(5, 'Please provide at least one scientific reference'),
  credentialLinks: z.string().min(5, 'Please provide at least one credential link'),
  teamMembers: z.string().min(5, 'Please provide information about your team members'),
  motivation: z.string().min(10, 'Please provide more details about your motivation'),
  progress: z.string().min(10, 'Please provide more details about your progress'),
});

export type WelcomeFormValues = z.infer<typeof formSchema>;

// Remove localStorage keys
// const WELCOME_FORM_SUBMITTED_KEY = 'welcome-form-submitted';
// const WELCOME_FORM_DATA_KEY = 'welcome-form-data';

interface WelcomeFormContextType {
  isFormSubmitted: boolean; // True if profile exists in Supabase
  formData: WelcomeFormValues | null;
  isLoading: boolean; // Added loading state
  submitForm: (data: WelcomeFormValues) => Promise<void>; // Make async
  resetForm: () => void; // Keep sync for now (clears local state)
}

const WelcomeFormContext = createContext<WelcomeFormContextType | undefined>(undefined);

export function WelcomeFormProvider({ children }: { children: React.ReactNode }) {
  const { user: privyUser } = useAuth(); // We only need the Privy user
  const [isFormSubmitted, setIsFormSubmitted] = useState<boolean>(false);
  const [formData, setFormData] = useState<WelcomeFormValues | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start loading true
  const [profileChecked, setProfileChecked] = useState<boolean>(false);

  // Effect to handle fetching profile
  useEffect(() => {
    // Only run this effect if we have a Privy ID and haven't checked the profile yet
    if (privyUser?.id && !profileChecked) {
      const fetchProfileWithPrivyId = async () => {
        console.log('WelcomeFormProvider: Fetching profile with Privy ID:', privyUser.id);
        setIsLoading(true);
        
        try {
          // Use the privyId directly
          const profile = await getOnboardingProfile(privyUser.id);
          console.log('WelcomeFormProvider: Profile fetched:', profile);
          
          if (profile && profile.project_name) {
            // Map Supabase profile fields to form values
            const formValues: WelcomeFormValues = {
              fullName: profile.full_name || '',
              email: profile.email || '',
              projectName: profile.project_name || '',
              projectDescription: profile.project_description || '',
              projectVision: profile.project_vision || '',
              scientificReferences: profile.scientific_references || '',
              credentialLinks: profile.credential_links || '',
              teamMembers: profile.team_members || '',
              motivation: profile.motivation || '',
              progress: profile.progress || '',
            };
            setFormData(formValues);
            setIsFormSubmitted(true);
          } else {
            console.log('WelcomeFormProvider: No existing profile found with Privy ID.');
            setFormData(null);
            setIsFormSubmitted(false);
          }
        } catch (error) {
          console.error('WelcomeFormProvider: Failed to fetch profile with Privy ID:', error);
          setIsFormSubmitted(false);
          setFormData(null);
        } finally {
          setIsLoading(false);
          setProfileChecked(true);
        }
      };

      fetchProfileWithPrivyId();
    } else if (!privyUser?.id) {
      // If no Privy user, mark as not loading and reset
      setIsLoading(false);
      setIsFormSubmitted(false);
      setFormData(null);
      setProfileChecked(false); // Reset so we'll check again when user logs in
    }
  }, [privyUser?.id, profileChecked]);

  const submitForm = async (data: WelcomeFormValues) => {
    if (!privyUser?.id) {
      console.error("Cannot submit form: No Privy ID available");
      throw new Error("User not authenticated");
    }
    
    // Show loading during submission
    setIsLoading(true);
    try {
      // Prepare profile data for Supabase with Privy ID
      const profilePayload = {
        privy_id: privyUser.id,
        full_name: data.fullName,
        email: data.email,
        project_name: data.projectName,
        project_description: data.projectDescription,
        project_vision: data.projectVision,
        scientific_references: data.scientificReferences,
        credential_links: data.credentialLinks,
        team_members: data.teamMembers,
        motivation: data.motivation,
        progress: data.progress,
      };
      
      console.log('WelcomeFormProvider: Submitting profile with Privy ID:', privyUser.id);
      
      // Use the createOnboardingProfile function
      const savedProfile = await createOnboardingProfile(profilePayload);
      
      console.log('WelcomeFormProvider: Profile saved:', savedProfile);
      setFormData(data); // Update local state with submitted data
      setIsFormSubmitted(true);
    } catch (error) {
      console.error('WelcomeFormProvider: Failed to save profile:', error);
      
      // Provide more detailed error message
      let errorMessage = 'Failed to save profile.';
      if (error instanceof Error) {
        errorMessage = `Failed to save profile: ${error.message}`;
      }
      
      // Re-throw with better error message
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset only clears local state, doesn't delete from DB
  const resetForm = () => {
    setIsFormSubmitted(false);
    setFormData(null);
    console.log('WelcomeFormProvider: Local state reset.');
  };

  return (
    <WelcomeFormContext.Provider
      value={{
        isFormSubmitted,
        formData,
        isLoading,
        submitForm,
        resetForm,
      }}
    >
      {children}
    </WelcomeFormContext.Provider>
  );
}

export function useWelcomeForm() {
  const context = useContext(WelcomeFormContext);

  if (context === undefined) {
    throw new Error('useWelcomeForm must be used within a WelcomeFormProvider');
  }

  return context;
}
