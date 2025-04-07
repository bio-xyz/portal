'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useState } from 'react';
import { useAuth } from '../../lib/auth-provider';

export function CommunityDashboard() {
  const { user } = useAuth();

  return (
    <Card className="w-full max-w-2xl mx-auto mb-8">
      <CardHeader>
        <CardTitle>Community Dashboard</CardTitle>
        <CardDescription>Connect with the broader ecosystem of bio projects</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-medium mb-2">Active Projects</h3>
            <div className="text-3xl font-bold">127</div>
          </div>
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-medium mb-2">Potential Collaborators</h3>
            <div className="text-3xl font-bold">43</div>
          </div>
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-medium mb-2">Recent NFTs</h3>
            <div className="text-3xl font-bold">56</div>
          </div>
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-medium mb-2">Your Reputation</h3>
            <div className="text-3xl font-bold">★★★★☆</div>
          </div>
        </div>
        <Button className="w-full">Explore Community</Button>
      </CardContent>
    </Card>
  );
}

export function ExpertDirectory() {
  const [searchTerm, setSearchTerm] = useState('');

  const experts = [
    { id: 1, name: 'Dr. Sarah Chen', field: 'Molecular Biology', rating: 4.9 },
    { id: 2, name: 'Prof. Michael Rodriguez', field: 'Genomics', rating: 4.8 },
    { id: 3, name: 'Dr. Emily Johnson', field: 'Biotechnology', rating: 4.7 },
    { id: 4, name: 'Prof. David Kim', field: 'Bioinformatics', rating: 4.9 },
    { id: 5, name: 'Dr. Jessica Taylor', field: 'Synthetic Biology', rating: 4.6 },
  ];

  const filteredExperts = searchTerm
    ? experts.filter(
        (expert) =>
          expert.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          expert.field.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : experts;

  return (
    <Card className="w-full max-w-2xl mx-auto mb-8">
      <CardHeader>
        <CardTitle>Expert Directory</CardTitle>
        <CardDescription>Connect with experts in your field</CardDescription>
      </CardHeader>
      <CardContent>
        <Input
          placeholder="Search by name or field..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-4"
        />
        <div className="space-y-3">
          {filteredExperts.map((expert) => (
            <div
              key={expert.id}
              className="flex justify-between items-center p-3 bg-muted rounded-lg"
            >
              <div>
                <div className="font-medium">{expert.name}</div>
                <div className="text-sm text-gray-500">{expert.field}</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-sm">{expert.rating} ★</div>
                <Button size="sm">Contact</Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function AdvancedResources() {
  const resources = [
    {
      id: 1,
      title: 'Grant Opportunities',
      description: 'Access to exclusive grant databases and application support',
      icon: '💰',
    },
    {
      id: 2,
      title: 'Computing Resources',
      description: 'High-performance computing and specialized software tools',
      icon: '💻',
    },
    {
      id: 3,
      title: 'Publication Support',
      description: 'Editorial assistance and journal connections',
      icon: '📚',
    },
    {
      id: 4,
      title: 'Legal Resources',
      description: 'IP protection and regulatory compliance guidance',
      icon: '⚖️',
    },
  ];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Advanced Resources</CardTitle>
        <CardDescription>Access premium tools and resources for your project</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {resources.map((resource) => (
            <div key={resource.id} className="p-4 border rounded-lg flex gap-4">
              <div className="text-3xl">{resource.icon}</div>
              <div>
                <h3 className="font-medium">{resource.title}</h3>
                <p className="text-sm text-gray-500">{resource.description}</p>
                <Button variant="link" className="p-0 h-auto mt-1">
                  Access Resource
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
