'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { useState } from 'react';
import { useAuth } from '../../lib/auth-provider';
import { useLevelRequirements } from '../../hooks/use-level-requirements';

export function ImplementationPlanForm() {
  const [implementationPlan, setImplementationPlan] = useState('');
  const { user } = useAuth();
  const { markRequirementComplete } = useLevelRequirements();

  const handleSubmit = async () => {
    if (!implementationPlan.trim() || !user?.id) return;

    try {
      // Here you would normally save the implementation plan to your database
      console.log('Saving implementation plan:', implementationPlan);

      // Mark the requirement as complete
      await markRequirementComplete('Complete implementation plan');

      // Reset form or show success message
      alert('Implementation plan saved successfully!');
    } catch (error) {
      console.error('Error saving implementation plan:', error);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto mb-8">
      <CardHeader>
        <CardTitle>Implementation Plan</CardTitle>
        <CardDescription>Create a detailed plan for implementing your project</CardDescription>
      </CardHeader>
      <CardContent>
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

export function ProjectTimelineForm() {
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
    if (timeline.some((t) => !t.milestone.trim() || !t.date.trim()) || !user?.id) return;

    try {
      // Here you would normally save the timeline to your database
      console.log('Saving project timeline:', timeline);

      // Mark the requirement as complete
      await markRequirementComplete('Set up project timeline');

      // Show success message
      alert('Project timeline saved successfully!');
    } catch (error) {
      console.error('Error saving project timeline:', error);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto mb-8">
      <CardHeader>
        <CardTitle>Project Timeline</CardTitle>
        <CardDescription>Set up a timeline for your project's key milestones</CardDescription>
      </CardHeader>
      <CardContent>
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

export function VisionNFTMinter() {
  const { user } = useAuth();
  const { markRequirementComplete } = useLevelRequirements();

  const handleMintNFT = async () => {
    if (!user?.id) return;

    try {
      // Here you would normally mint the NFT
      console.log('Minting Vision NFT for user:', user.id);

      // Simulate minting process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mark the requirement as complete
      await markRequirementComplete('Mint Vision NFT');

      // Show success message
      alert('Vision NFT minted successfully!');
    } catch (error) {
      console.error('Error minting Vision NFT:', error);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Mint Vision NFT</CardTitle>
        <CardDescription>
          Turn your project vision into an NFT to showcase your detailed plans
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={handleMintNFT}
          className="w-full bg-bio-accent hover:bg-bio-accent/90 text-bio-accent-foreground"
        >
          Mint Vision NFT
        </Button>
      </CardContent>
    </Card>
  );
}
