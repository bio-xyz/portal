'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { useState } from 'react';
import { useAuth } from '../../lib/auth-provider';
import { useLevelRequirements } from '../../hooks/use-level-requirements';

export function ProjectMilestonesForm() {
  const [milestones, setMilestones] = useState(['', '', '']);
  const { user } = useAuth();
  const { markRequirementComplete } = useLevelRequirements();

  const handleMilestoneChange = (index: number, value: string) => {
    const newMilestones = [...milestones];
    newMilestones[index] = value;
    setMilestones(newMilestones);
  };

  const addMilestone = () => {
    setMilestones([...milestones, '']);
  };

  const handleSubmit = async () => {
    if (milestones.some((m) => !m.trim()) || !user?.id) return;

    try {
      // Here you would normally save the milestones to your database
      console.log('Saving project milestones:', milestones);

      // Mark the requirement as complete
      await markRequirementComplete('Define project milestones');

      // Show success message
      alert('Project milestones saved successfully!');
    } catch (error) {
      console.error('Error saving project milestones:', error);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto mb-8">
      <CardHeader>
        <CardTitle>Project Milestones</CardTitle>
        <CardDescription>Define key milestones for your project to track progress</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {milestones.map((milestone, index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder={`Milestone ${index + 1}`}
                value={milestone}
                onChange={(e) => handleMilestoneChange(index, e.target.value)}
              />
            </div>
          ))}
          <div className="flex gap-4">
            <Button variant="outline" onClick={addMilestone}>
              Add Milestone
            </Button>
            <Button onClick={handleSubmit}>Save Milestones</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProjectVisionForm() {
  const [vision, setVision] = useState('');
  const { user } = useAuth();
  const { markRequirementComplete } = useLevelRequirements();

  const handleSubmit = async () => {
    if (!vision.trim() || !user?.id) return;

    try {
      // Here you would normally save the vision to your database
      console.log('Saving project vision:', vision);

      // Mark the requirement as complete
      await markRequirementComplete('Create project vision document');

      // Reset form or show success message
      alert('Project vision saved successfully!');
    } catch (error) {
      console.error('Error saving project vision:', error);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Project Vision</CardTitle>
        <CardDescription>Articulate the long-term vision for your project</CardDescription>
      </CardHeader>
      <CardContent>
        <Textarea
          placeholder="Describe your project vision..."
          value={vision}
          onChange={(e) => setVision(e.target.value)}
          className="min-h-[200px] mb-4"
        />
        <Button onClick={handleSubmit}>Save Project Vision</Button>
      </CardContent>
    </Card>
  );
}

export function IdeaNFTMinter() {
  const { user } = useAuth();
  const { markRequirementComplete } = useLevelRequirements();

  const handleMintNFT = async () => {
    if (!user?.id) return;

    try {
      // Here you would normally mint the NFT
      console.log('Minting Idea NFT for user:', user.id);

      // Simulate minting process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mark the requirement as complete
      await markRequirementComplete('Mint Idea NFT');

      // Show success message
      alert('Idea NFT minted successfully!');
    } catch (error) {
      console.error('Error minting Idea NFT:', error);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Mint Idea NFT</CardTitle>
        <CardDescription>Turn your project idea into an NFT to showcase your work</CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={handleMintNFT}
          className="w-full bg-bio-accent hover:bg-bio-accent/90 text-bio-accent-foreground"
        >
          Mint Idea NFT
        </Button>
      </CardContent>
    </Card>
  );
}
