'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useState } from 'react';
import { useAuth } from '../../lib/use-auth';
import { X } from 'lucide-react';

// Add interface for component props
interface ModuleProps {
  closeForm?: () => void;
}

export function CommunityDashboard({ closeForm }: ModuleProps) {
  const { user } = useAuth();

  return (
    <Card className="w-full mx-auto border-0">
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b">
        <div>
          <CardTitle>Community Dashboard</CardTitle>
          <CardDescription>Connect with the broader ecosystem of bio projects</CardDescription>
        </div>
        {closeForm && (
          <Button variant="ghost" size="icon" onClick={closeForm} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-4">
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
        <Button className="w-full" onClick={closeForm}>Explore Community</Button>
      </CardContent>
    </Card>
  );
}

export function ExpertDirectory({ closeForm }: ModuleProps) {
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
    <Card className="w-full mx-auto border-0">
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b">
        <div>
          <CardTitle>Expert Directory</CardTitle>
          <CardDescription>Connect with experts in your field</CardDescription>
        </div>
        {closeForm && (
          <Button variant="ghost" size="icon" onClick={closeForm} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-4">
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

export function AdvancedResources({ closeForm }: ModuleProps) {
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
    <Card className="w-full mx-auto border-0">
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b">
        <div>
          <CardTitle>Advanced Resources</CardTitle>
          <CardDescription>Access premium tools and resources for your project</CardDescription>
        </div>
        {closeForm && (
          <Button variant="ghost" size="icon" onClick={closeForm} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-4">
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

export function Level4CompletionScreen() {
  return (
    <div className="space-y-6">
      <div className="bg-card border rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Congratulations!</h2>
        <div className="space-y-4">
          <p className="text-lg">Your DAO is now Level 4!</p>
          
          <p>The BIO team is now available to you, they'll reach out shortly.</p>
          
          <p>Continue sharing papers, inviting community members, and discussing science.</p>
          
          <p className="mt-6">
            You can learn about the next phase of building your DAO in our{" "}
            <a href="#" className="text-primary hover:underline font-medium">
              Sandbox Guide
            </a>
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3">Community Status</h3>
          <div className="flex items-center gap-2 text-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <span>DAO Member Size: <strong>10</strong></span>
          </div>
        </div>
        
        <div className="bg-card border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3">Science Bank</h3>
          <div className="flex items-center gap-2 text-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path>
            </svg>
            <span>NFTs Minted: <strong>3</strong></span>
          </div>
        </div>
      </div>
      
    </div>
  );
}
