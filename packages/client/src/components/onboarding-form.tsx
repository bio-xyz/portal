import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useAgents } from '@/hooks/use-query-hooks';
import { LogIn, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/lib/use-auth';
import { createOnboardingProfile, getOnboardingProfile } from '@/lib/onboarding';
import { createOrUpdateUserLevel } from '@/lib/user-level';
import { formSchema, formPages, type WelcomeFormValues } from '@/lib/onboarding-content';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import type { Profile } from '@/types/database.types';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { useWelcomeForm } from '@/lib/welcome-form-context';
import { useToast } from '@/hooks/use-toast';

export function WelcomeForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [submittedProfile, setSubmittedProfile] = useState<Profile | null>(null);
  const [activeTab, setActiveTab] = useState<string>("form"); // "form" or "nft"
  const { isAuthenticated, login, user } = useAuth();
  const { submitForm } = useWelcomeForm();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const getProfile = async () => {
      if (user?.id) {
        try {
          const profile = await getOnboardingProfile(user?.id);
          if (profile) {
            navigate("/dashboard");
          }
        } catch (error) {
          console.log("No existing profile found or error fetching profile:", error);
          // Continue with onboarding flow if profile doesn't exist
        }
      }
    }
    getProfile();
  }, [user?.id, navigate]);

  const { data: { data: agentsData } = {} } = useAgents();

  const form = useForm<WelcomeFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: Object.fromEntries(
      formPages.flatMap((page) => page.fields).map((field) => [field.id, ''])
    ) as WelcomeFormValues,
  });

  const handleSubmit = async (values: WelcomeFormValues) => {
    setIsSubmitting(true);
    try {
      // Save form data to Supabase using the standard API
      if (user?.id) {
        console.log('Submitting form with Privy user:', user);

        // 1. Prepare profile data with Privy ID
        const profileData = {
          privy_id: user.id, // Use Privy ID
          full_name: values.fullName,
          email: values.email || (user.email?.address || ''), // Prioritize form email, fallback to Privy
          project_name: values.projectName,
          project_description: values.projectDescription,
          project_vision: values.projectVision,
          scientific_references: values.scientificReferences,
          credential_links: values.credentialLinks,
          team_members: values.teamMembers,
          motivation: values.motivation,
          progress: values.progress,
        };

        try {
          // 2. Create/Update the profile using the standard function
          const profile = await createOnboardingProfile(profileData);
          console.log('Profile created/updated via API:', profile);
          setSubmittedProfile(profile);

          // 3. Create or update user level (set to level 1)
          try {
            const userLevel = await createOrUpdateUserLevel(user.id);
            console.log('User level created/updated:', userLevel);

            // Success toast for complete process
            toast({
              title: "Profile created successfully",
              description: "Your profile has been saved and you're now at level 1!",
              duration: 3000,
            });

            navigate(`/chat/${agentsData?.agents[0].id}`);
          } catch (levelError: any) {
            console.error('Error creating user level:', levelError);
            // Still show success for profile even if level creation fails
            toast({
              title: "Profile created successfully",
              description: "Your profile was saved, but there was an issue setting up your level.",
              duration: 3000,
            });
          }

          // 4. Save to local context
          submitForm(values);

          // 5. Show the NFT minting option
          setActiveTab("nft");
        } catch (error: any) {
          console.error('Error saving profile:', error);
          // Check if it's an RLS policy error
          if (error.message?.includes('RLS')) {
            toast({
              title: "Authentication Error",
              description: "There was an issue with your authentication. Please try logging in again.",
              variant: "destructive",
              duration: 5000,
            });
          } else {
            toast({
              title: "Error saving profile",
              description: error.message || "An unknown error occurred",
              variant: "destructive",
              duration: 5000,
            });
          }
        }
      } else {
        toast({
          title: "Authentication required",
          description: "You need to be logged in to submit the form",
          variant: "destructive",
          duration: 3000,
        });
      }
    } catch (error: any) {
      console.error('Error submitting form:', error);
      toast({
        title: "Error",
        description: error.message || "An unknown error occurred",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNFTSuccess = (nftData: any) => {
    // Find the CoreAgent to navigate to its chat view
    const agents = agentsData?.agents || [];
    const coreAgent = agents.find(
      (agent) =>
        agent.name.toLowerCase().includes('eliza') || agent.name.toLowerCase().includes('core')
    );

    if (coreAgent?.id) {
      navigate(`/chat/${coreAgent.id}`);
    } else if (agents && agents.length > 0) {
      navigate(`/chat/${agents[0].id}`);
    }
  };

  const skipNFT = () => {
    // Find the CoreAgent to navigate to its chat view
    const agents = agentsData?.agents || [];
    const coreAgent = agents.find(
      (agent) =>
        agent.name.toLowerCase().includes('eliza') || agent.name.toLowerCase().includes('core')
    );

    if (coreAgent?.id) {
      navigate(`/chat/${coreAgent.id}`);
    } else if (agents && agents.length > 0) {
      navigate(`/chat/${agents[0].id}`);
    }
  };

  const nextPage = () => {
    const currentFields = formPages[currentPage].fields;
    const isValid = currentFields.every((field) => !form.formState.errors[field.id]);

    if (isValid && currentPage < formPages.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const renderFormFields = () => {
    const currentFields = formPages[currentPage].fields;

    return (
      <div className="space-y-6">
        {currentFields.map((field) => (
          <div key={field.id} className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor={field.id}>{field.label}</Label>
              {field.description && (
                <p className="text-sm text-muted-foreground">{field.description}</p>
              )}
            </div>
            {field.type === 'textarea' ? (
              <Textarea
                id={field.id}
                placeholder={field.placeholder}
                className="min-h-24 focus-visible:ring-bio-accent/50"
                {...form.register(field.id)}
              />
            ) : (
              <Input
                id={field.id}
                type={field.type}
                placeholder={field.placeholder}
                className="focus-visible:ring-bio-accent/50"
                {...form.register(field.id)}
              />
            )}
            {form.formState.errors[field.id] && (
              <p className="text-sm text-red-500">{form.formState.errors[field.id]?.message}</p>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {!isAuthenticated ? (
        <Card className="w-full max-w-md border-bio-accent/20 border-t-4">
          <CardHeader className="relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-bio-accent/70 to-bio-accent/10"></div>
            <CardTitle className="text-2xl">Welcome to the BioDAO Portal</CardTitle>
            <CardDescription>Please log in to access the application</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <div className="size-24 rounded-full bg-bio-accent/10 flex items-center justify-center mb-6">
              <LogIn className="size-12 text-bio-accent" />
            </div>
            <p className="text-center text-muted-foreground mb-6">
              Sign in with your credentials to continue to the application. You'll need to provide
              information about your project to get started.
            </p>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full bg-bio-accent hover:bg-bio-accent/90 text-bio-accent-foreground"
              onClick={login}
            >
              Login to Continue
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card className="w-full max-w-4xl border-bio-accent/20 border-t-4">
          <CardHeader className="relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-bio-accent/70 to-bio-accent/10"></div>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Welcome to the BioDAO Portal</CardTitle>
                {activeTab === "form" ? (
                  <CardDescription>{formPages[currentPage].description}</CardDescription>
                ) : (
                  <CardDescription>Create an NFT for your project</CardDescription>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="size-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span>Authenticated</span>
                </div>
                {user?.email && (
                  <div className="text-sm text-muted-foreground">{user.email.address}</div>
                )}
              </div>
            </div>
          </CardHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mx-6 mb-2">
              <TabsTrigger value="form" disabled={activeTab === "nft"}>Project Info</TabsTrigger>
            </TabsList>

            <TabsContent value="form">
              <form onSubmit={form.handleSubmit(handleSubmit)}>
                <CardContent>{renderFormFields()}</CardContent>

                <CardFooter className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevPage}
                    disabled={currentPage === 0}
                    className="flex items-center gap-2"
                  >
                    <ChevronLeft className="size-4" />
                    Previous
                  </Button>
                  {currentPage === formPages.length - 1 ? (
                    <Button
                      type="submit"
                      className="bg-bio-accent hover:bg-bio-accent/90 text-bio-accent-foreground"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit and Continue'}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={nextPage}
                      className="bg-bio-accent hover:bg-bio-accent/90 text-bio-accent-foreground flex items-center gap-2"
                    >
                      Next
                      <ChevronRight className="size-4" />
                    </Button>
                  )}
                </CardFooter>
              </form>
            </TabsContent>

          </Tabs>
        </Card>
      )}
    </div>
  );
}
