'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { useState } from 'react';
import { useAuth } from '../../lib/auth-provider';
import { useLevelRequirements } from '../../hooks/use-level-requirements';

export function ProjectDescriptionForm() {
  const [description, setDescription] = useState('');
  const { user } = useAuth();
  const { markRequirementComplete } = useLevelRequirements();

  const handleSubmit = async () => {
    if (!description.trim() || !user?.id) return;

    try {
      // Here you would normally save the project description to your database
      console.log('Saving project description:', description);

      // Mark the requirement as complete
      await markRequirementComplete('Complete project description');

      // Reset form or show success message
      setDescription('');
      alert('Project description saved successfully!');
    } catch (error) {
      console.error('Error saving project description:', error);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto mb-8">
      <CardHeader>
        <CardTitle>Project Description</CardTitle>
        <CardDescription>
          Describe your bio project in detail to unlock the next level
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Textarea
          placeholder="Describe your project..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-[150px] mb-4"
        />
        <Button onClick={handleSubmit}>Save Project Description</Button>
      </CardContent>
    </Card>
  );
}

export function ScientificReferencesForm() {
  const [references, setReferences] = useState(['', '', '']);
  const { user } = useAuth();
  const { markRequirementComplete } = useLevelRequirements();

  const handleReferenceChange = (index: number, value: string) => {
    const newReferences = [...references];
    newReferences[index] = value;
    setReferences(newReferences);
  };

  const handleSubmit = async () => {
    if (references.some((ref) => !ref.trim()) || !user?.id) return;

    try {
      // Here you would normally save the references to your database
      console.log('Saving scientific references:', references);

      // Mark the requirement as complete
      await markRequirementComplete('Provide 3 scientific references');

      // Reset form or show success message
      alert('Scientific references saved successfully!');
    } catch (error) {
      console.error('Error saving scientific references:', error);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Scientific References</CardTitle>
        <CardDescription>
          Provide three scientific references relevant to your project
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {references.map((reference, index) => (
            <Textarea
              key={index}
              placeholder={`Reference ${index + 1}`}
              value={reference}
              onChange={(e) => handleReferenceChange(index, e.target.value)}
              className="min-h-[80px]"
            />
          ))}
          <Button onClick={handleSubmit}>Save References</Button>
        </div>
      </CardContent>
    </Card>
  );
}
