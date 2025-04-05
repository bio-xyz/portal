import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAgents } from '@/hooks/use-query-hooks';
import { LogIn } from 'lucide-react';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { useWelcomeForm, WelcomeFormValues } from '@/lib/welcome-form-context';

// Define the form schema with Zod
const formSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  projectName: z.string().min(2, 'Project name must be at least 2 characters'),
  projectDescription: z.string().min(10, 'Please provide a more detailed project description'),
  projectVision: z.string().min(10, 'Please provide a more detailed project vision'),
  scientificReferences: z.string().min(5, 'Please provide at least one scientific reference'),
  credentialLinks: z.string().min(5, 'Please provide at least one credential link'),
});

export function WelcomeForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLoginButton, setShowLoginButton] = useState(true);
  const { submitForm } = useWelcomeForm();
  const navigate = useNavigate();
  const { data: { data: agentsData } = {} } = useAgents();

  const form = useForm<WelcomeFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      email: '',
      projectName: '',
      projectDescription: '',
      projectVision: '',
      scientificReferences: '',
      credentialLinks: '',
    },
  });

  const handleSubmit = async (values: WelcomeFormValues) => {
    setIsSubmitting(true);
    try {
      submitForm(values);

      // Find the CoreAgent to navigate to its chat view
      const agents = agentsData?.agents || [];
      const coreAgent = agents.find(
        (agent) =>
          agent.name.toLowerCase().includes('eliza') || agent.name.toLowerCase().includes('core')
      );

      if (coreAgent?.id) {
        // Navigate to the CoreAgent chat view
        navigate(`/chat/${coreAgent.id}`);
      } else if (agents && agents.length > 0) {
        // Fallback to the first available agent if CoreAgent isn't found
        navigate(`/chat/${agents[0].id}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = () => {
    // Mock login - just toggle the state for now
    // Later we can add actual authentication logic here
    setShowLoginButton(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {showLoginButton ? (
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
              onClick={handleLogin}
            >
              Login to Continue
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card className="w-full max-w-4xl border-bio-accent/20 border-t-4">
          <CardHeader className="relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-bio-accent/70 to-bio-accent/10"></div>
            <CardTitle className="text-2xl">Welcome to the BioDAO Portal</CardTitle>
            <CardDescription>Please complete this form to access the application</CardDescription>
          </CardHeader>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Column 1 */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      placeholder="Your full name"
                      {...form.register('fullName')}
                      className="focus-visible:ring-bio-accent/50"
                    />
                    {form.formState.errors.fullName && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.fullName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      {...form.register('email')}
                      className="focus-visible:ring-bio-accent/50"
                    />
                    {form.formState.errors.email && (
                      <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="projectName">Project Name</Label>
                    <Input
                      id="projectName"
                      placeholder="Your project name"
                      {...form.register('projectName')}
                      className="focus-visible:ring-bio-accent/50"
                    />
                    {form.formState.errors.projectName && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.projectName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="projectDescription">Project Description</Label>
                    <Textarea
                      id="projectDescription"
                      placeholder="Describe what you are building in plain language..."
                      className="min-h-24 focus-visible:ring-bio-accent/50"
                      {...form.register('projectDescription')}
                    />
                    {form.formState.errors.projectDescription && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.projectDescription.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Column 2 */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="projectVision">Project Vision</Label>
                    <Textarea
                      id="projectVision"
                      placeholder="What could the world look like if your project is successful?"
                      className="min-h-24 focus-visible:ring-bio-accent/50"
                      {...form.register('projectVision')}
                    />
                    {form.formState.errors.projectVision && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.projectVision.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="scientificReferences">Scientific References</Label>
                    <Textarea
                      id="scientificReferences"
                      placeholder="Link to 3 papers or blogs that support your scientific idea (one per line)"
                      className="min-h-24 focus-visible:ring-bio-accent/50"
                      {...form.register('scientificReferences')}
                    />
                    {form.formState.errors.scientificReferences && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.scientificReferences.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="credentialLinks">Credential Links</Label>
                    <Textarea
                      id="credentialLinks"
                      placeholder="Share links to validate your credentials like CV, Google Scholar, Twitter, etc. (one per line)"
                      className="min-h-24 focus-visible:ring-bio-accent/50"
                      {...form.register('credentialLinks')}
                    />
                    {form.formState.errors.credentialLinks && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.credentialLinks.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter>
              <Button
                type="submit"
                className="w-full bg-bio-accent hover:bg-bio-accent/90 text-bio-accent-foreground"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit and Continue'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}
    </div>
  );
}
