import { createContext, useContext, useEffect, useState } from 'react';
import { z } from 'zod';

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

// Local storage key
const WELCOME_FORM_SUBMITTED_KEY = 'welcome-form-submitted';
const WELCOME_FORM_DATA_KEY = 'welcome-form-data';

interface WelcomeFormContextType {
  isFormSubmitted: boolean;
  formData: WelcomeFormValues | null;
  submitForm: (data: WelcomeFormValues) => void;
  resetForm: () => void;
}

const WelcomeFormContext = createContext<WelcomeFormContextType | undefined>(undefined);

export function WelcomeFormProvider({ children }: { children: React.ReactNode }) {
  const [isFormSubmitted, setIsFormSubmitted] = useState<boolean>(false);
  const [formData, setFormData] = useState<WelcomeFormValues | null>(null);

  // Load from localStorage on initial render
  useEffect(() => {
    const savedSubmissionState = localStorage.getItem(WELCOME_FORM_SUBMITTED_KEY);
    const savedFormData = localStorage.getItem(WELCOME_FORM_DATA_KEY);

    if (savedSubmissionState === 'true') {
      setIsFormSubmitted(true);
    }

    if (savedFormData) {
      try {
        const parsedData = JSON.parse(savedFormData);
        setFormData(parsedData);
      } catch (error) {
        console.error('Failed to parse saved form data:', error);
      }
    }
  }, []);

  const submitForm = (data: WelcomeFormValues) => {
    setIsFormSubmitted(true);
    setFormData(data);

    // Save to localStorage
    localStorage.setItem(WELCOME_FORM_SUBMITTED_KEY, 'true');
    localStorage.setItem(WELCOME_FORM_DATA_KEY, JSON.stringify(data));
  };

  const resetForm = () => {
    setIsFormSubmitted(false);
    setFormData(null);

    // Clear from localStorage
    localStorage.removeItem(WELCOME_FORM_SUBMITTED_KEY);
    localStorage.removeItem(WELCOME_FORM_DATA_KEY);
  };

  return (
    <WelcomeFormContext.Provider
      value={{
        isFormSubmitted,
        formData,
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
