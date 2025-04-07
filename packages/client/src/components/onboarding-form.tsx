import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useAgents } from '@/hooks/use-query-hooks';
import { LogIn, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/lib/use-auth';
import { createOnboardingProfile } from '@/lib/api/onboarding';
import { formSchema, formPages, type WelcomeFormValues } from '@/lib/onboarding-content';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { useWelcomeForm } from '@/lib/welcome-form-context';

export function WelcomeForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const { isAuthenticated, login, user } = useAuth();
  const { submitForm } = useWelcomeForm();
  const navigate = useNavigate();
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
      // Save form data to Supabase
      if (user?.id) {
        await createOnboardingProfile({
          user_id: user.id,
          full_name: values.fullName,
          email: values.email,
          project_name: values.projectName,
          project_description: values.projectDescription,
          project_vision: values.projectVision,
          scientific_references: values.scientificReferences,
          credential_links: values.credentialLinks,
          team_members: values.teamMembers,
          motivation: values.motivation,
          progress: values.progress,
        });
      }

      // Save to local context
      submitForm(values);

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
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
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
                <CardDescription>{formPages[currentPage].description}</CardDescription>
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
        </Card>
      )}
    </div>
  );
}
