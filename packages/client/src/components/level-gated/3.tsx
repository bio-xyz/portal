'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/use-auth';
import { useLevelRequirements } from '../../hooks/use-level-requirements';
import { X, BadgeCheck } from 'lucide-react';

// Add props interfaces for each component
interface ImplementationPlanFormProps {
  closeForm?: () => void;
  onSubmit?: (data: { plan: string }) => void;
}

export function ImplementationPlanForm({ closeForm, onSubmit }: ImplementationPlanFormProps) {
  const [implementationPlan, setImplementationPlan] = useState('');
  const { user } = useAuth();
  const { markRequirementComplete } = useLevelRequirements();

  const handleSubmit = async () => {
    if (!implementationPlan.trim()) return;

    try {
      console.log('Saving implementation plan:', implementationPlan);

      // If onSubmit prop is provided, call it with the data
      if (onSubmit) {
        onSubmit({ plan: implementationPlan });
      } else {
        // Otherwise use the default behavior
        if (user?.id) {
          await markRequirementComplete('Complete implementation plan');
        }
        
        // Reset form or show success message
        alert('Implementation plan saved successfully!');
      }
      
      // Close form if closeForm prop is provided
      if (closeForm) {
        closeForm();
      }
    } catch (error) {
      console.error('Error saving implementation plan:', error);
    }
  };

  return (
    <Card className="w-full mx-auto border-0">
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b">
        <div>
          <CardTitle>Implementation Plan</CardTitle>
          <CardDescription>Create a detailed plan for implementing your project</CardDescription>
        </div>
        {closeForm && (
          <Button variant="ghost" size="icon" onClick={closeForm} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-4">
        <Textarea
          placeholder="Describe your implementation plan..."
          value={implementationPlan}
          onChange={(e) => setImplementationPlan(e.target.value)}
          className="min-h-[250px] mb-4"
        />
        <Button onClick={handleSubmit}>Save Implementation Plan</Button>
      </CardContent>
    </Card>
  );
}

interface ProjectTimelineFormProps {
  closeForm?: () => void;
  onSubmit?: (data: { timelineItems: { milestone: string; date: string }[] }) => void; 
}

export function ProjectTimelineForm({ closeForm, onSubmit }: ProjectTimelineFormProps) {
  const [timeline, setTimeline] = useState([
    { milestone: '', date: '' },
    { milestone: '', date: '' },
    { milestone: '', date: '' },
  ]);
  const { user } = useAuth();
  const { markRequirementComplete } = useLevelRequirements();

  const handleTimelineChange = (index: number, field: 'milestone' | 'date', value: string) => {
    const newTimeline = [...timeline];
    newTimeline[index][field] = value;
    setTimeline(newTimeline);
  };

  const addTimelineItem = () => {
    setTimeline([...timeline, { milestone: '', date: '' }]);
  };

  const handleSubmit = async () => {
    if (timeline.some((t) => !t.milestone.trim() || !t.date.trim())) return;

    try {
      console.log('Saving project timeline:', timeline);

      // If onSubmit prop is provided, call it with the data
      if (onSubmit) {
        onSubmit({ timelineItems: timeline });
      } else {
        // Otherwise use the default behavior
        if (user?.id) {
          await markRequirementComplete('Set up project timeline');
        }
        
        // Reset form or show success message
        alert('Project timeline saved successfully!');
      }
      
      // Close form if closeForm prop is provided
      if (closeForm) {
        closeForm();
      }
    } catch (error) {
      console.error('Error saving project timeline:', error);
    }
  };

  return (
    <Card className="w-full mx-auto border-0">
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b">
        <div>
          <CardTitle>Project Timeline</CardTitle>
          <CardDescription>Set up a timeline for your project's key milestones</CardDescription>
        </div>
        {closeForm && (
          <Button variant="ghost" size="icon" onClick={closeForm} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-4">
          {timeline.map((item, index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder="Milestone description"
                value={item.milestone}
                onChange={(e) => handleTimelineChange(index, 'milestone', e.target.value)}
                className="flex-grow"
              />
              <Input
                type="date"
                value={item.date}
                onChange={(e) => handleTimelineChange(index, 'date', e.target.value)}
                className="w-40"
              />
            </div>
          ))}
          <div className="flex gap-4">
            <Button variant="outline" onClick={addTimelineItem}>
              Add Timeline Item
            </Button>
            <Button onClick={handleSubmit}>Save Timeline</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface VisionNFTMinterProps {
  closeForm?: () => void;
  onSubmit?: (data: { nftData: any }) => void;
}

export function VisionNFTMinter({ closeForm, onSubmit }: VisionNFTMinterProps) {
  const { user } = useAuth();
  const { markRequirementComplete } = useLevelRequirements();
  const [isLoading, setIsLoading] = useState(false);

  const handleMintNFT = async () => {
    if (!user?.id) return;
    setIsLoading(true);

    try {
      // Simulate minting process
      console.log('Minting Vision NFT for user:', user.id);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      const mockNFTData = {
        id: `vision-nft-${Date.now()}`,
        name: 'Project Vision NFT',
        description: 'This NFT represents the long-term vision for your project',
        image: 'https://placehold.co/600x400/png',
        owner: user.id,
        createdAt: new Date().toISOString()
      };

      // If onSubmit prop is provided, call it with the data
      if (onSubmit) {
        onSubmit({ nftData: mockNFTData });
      } else {
        // Otherwise use the default behavior
        await markRequirementComplete('Mint Vision NFT');
        
        // Show success message
        alert('Vision NFT minted successfully!');
      }
      
      // Close form if closeForm prop is provided
      if (closeForm) {
        closeForm();
      }
    } catch (error) {
      console.error('Error minting Vision NFT:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full mx-auto border-0">
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b">
        <div>
          <CardTitle>Mint Vision NFT</CardTitle>
          <CardDescription>
            Turn your project vision into an NFT to showcase your detailed plans
          </CardDescription>
        </div>
        {closeForm && (
          <Button variant="ghost" size="icon" onClick={closeForm} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-4">
        <div className="aspect-video bg-muted rounded-md mb-4 flex items-center justify-center">
          <div className="text-center p-4">
            <h3 className="text-lg font-bold mb-2">Project Vision NFT</h3>
            <p className="text-sm text-muted-foreground mb-4">
              This NFT will represent your project's vision and long-term goals
            </p>
            <div className="p-8 border border-dashed border-primary/50 rounded-md bg-primary/5">
              <p className="text-xs text-muted-foreground">Vision NFT Preview</p>
            </div>
          </div>
        </div>
        <Button
          onClick={handleMintNFT}
          className="w-full bg-bio-accent hover:bg-bio-accent/90 text-bio-accent-foreground"
          disabled={isLoading}
        >
          {isLoading ? 'Minting...' : 'Mint Vision NFT'}
        </Button>
      </CardContent>
    </Card>
  );
}

// Progress card component for metrics display
function ProgressCard({ title, current, target, icon }: { title: string, current: number, target: number, icon: React.ReactNode }) {
  const progress = Math.min(100, Math.round((current / target) * 100));
  
  return (
    <div className="bg-card border rounded-lg p-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium">{title}</h3>
        <div className="bg-primary/10 p-1.5 rounded-full">{icon}</div>
      </div>
      <div className="flex items-end gap-1 mb-1">
        <span className="text-2xl font-bold">{current}</span>
        <span className="text-muted-foreground text-sm">/ {target}</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div 
          className={`h-2 rounded-full ${progress === 100 ? 'bg-green-500' : 'bg-primary'}`} 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <div className="mt-1 text-xs text-right text-muted-foreground">{progress}% complete</div>
    </div>
  );
}

export function DiscordMetricsTracker({ isDemoMode }: { isDemoMode: boolean }) {
  // Demo data for display purposes
  const [metricsData, setMetricsData] = useState({
    members: 6,
    papers: 12,
    messages: 45
  });
  
  // This would normally come from a backend/Discord bot
  const requirements = {
    members: 10,
    papers: 25,
    messages: 100
  };
  
  // For demo: increment counters
  useEffect(() => {
    if (!isDemoMode) return;
    
    const timer = setInterval(() => {
      setMetricsData(prev => ({
        members: Math.min(prev.members + 1, requirements.members),
        papers: Math.min(prev.papers + 2, requirements.papers),
        messages: Math.min(prev.messages + 5, requirements.messages)
      }));
    }, 10000); // Update every 10 seconds for demo
    
    return () => clearInterval(timer);
  }, [isDemoMode]);
  
  const allCompleted = 
    metricsData.members >= requirements.members &&
    metricsData.papers >= requirements.papers &&
    metricsData.messages >= requirements.messages;
    
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ProgressCard 
          title="Discord Members" 
          current={metricsData.members} 
          target={requirements.members}
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-6-6 6 6 0 0 0-6 6 7 7 0 0 0 12 5" /><path d="M10 9a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1z" /><path d="M14 16v3a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1h-5a1 1 0 0 0-1 1v1" /></svg>}
        />
        <ProgressCard 
          title="Scientific Papers" 
          current={metricsData.papers} 
          target={requirements.papers}
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>}
        />
        <ProgressCard 
          title="Discord Messages" 
          current={metricsData.messages} 
          target={requirements.messages}
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>}
        />
      </div>
      
      {allCompleted && (
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center gap-2">
            <BadgeCheck className="h-5 w-5 text-green-500" />
            <h3 className="font-medium text-green-700">All requirements completed!</h3>
          </div>
          <p className="text-green-600 text-sm mt-1">
            You've met all the Discord metrics requirements. You're ready to level up!
          </p>
        </div>
      )}
      
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h3 className="font-medium text-blue-700 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
          How It Works
        </h3>
        <p className="text-blue-600 text-sm mt-1">
          Our Discord bot automatically tracks your server growth, scientific paper sharing, and message activity. 
          You'll be notified when you've met all requirements for level 4!
        </p>
      </div>
    </div>
  );
}
