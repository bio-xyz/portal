'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { UserLevelDisplay } from './user-level-display';
import { LevelSpecificChat } from './agent/level-specific-chat';
import { useUserLevel } from '../hooks/use-user-level';
import { useLevelRequirements } from '../hooks/use-level-requirements';

// Level 1 Components
import { ProjectDescriptionForm, ScientificReferencesForm } from './level-gated/1';

// Level 2 Components
import { ProjectMilestonesForm, ProjectVisionForm, IdeaNFTMinter } from './level-gated/2';

// Level 3 Components
import { ImplementationPlanForm, ProjectTimelineForm, VisionNFTMinter } from './level-gated/3';

// Level 4 Components
import { CommunityDashboard, ExpertDirectory, AdvancedResources } from './level-gated/4';

export function DashboardLayout() {
  const { level, isLoading } = useUserLevel();
  const { requirements, allRequirementsCompleted } = useLevelRequirements();
  const [activeTab, setActiveTab] = useState('overview');

  // Show loading state while level is being fetched
  if (isLoading) {
    return <div>Loading dashboard...</div>;
  }

  const userLevel = level || 1;

  return (
    <div className="container py-6">
      <div className="flex flex-col lg:flex-row gap-6 mb-8">
        <div className="lg:w-1/3">
          <UserLevelDisplay />

          {/* Requirements Progress */}
          {requirements?.length > 0 && (
            <div className="mt-6 bg-card p-6 rounded-lg border">
              <h3 className="text-lg font-medium mb-3">Level Up Requirements</h3>
              <ul className="space-y-2">
                {requirements.map((req, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center ${req.completed ? 'bg-green-500' : 'bg-gray-300'}`}
                    >
                      {req.completed && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-white"
                        >
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      )}
                    </div>
                    <span className={req.completed ? 'line-through text-gray-500' : ''}>
                      {req.requirement}
                    </span>
                  </li>
                ))}
              </ul>

              {allRequirementsCompleted && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                  Congratulations! You've completed all requirements. You'll level up soon!
                </div>
              )}
            </div>
          )}
        </div>

        <div className="lg:w-2/3">
          <LevelSpecificChat />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tools">Tools & Resources</TabsTrigger>
          {userLevel >= 4 && <TabsTrigger value="community">Community</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="space-y-8">
          {/* Level 1 Components */}
          {userLevel >= 1 && (
            <>
              <ProjectDescriptionForm />
              <ScientificReferencesForm />
            </>
          )}

          {/* Level 2 Components */}
          {userLevel >= 2 && (
            <>
              <ProjectMilestonesForm />
              <ProjectVisionForm />
            </>
          )}
        </TabsContent>

        <TabsContent value="tools" className="space-y-8">
          {/* Level-specific tools */}
          {userLevel >= 2 && <IdeaNFTMinter />}
          {userLevel >= 3 && (
            <>
              <ImplementationPlanForm />
              <ProjectTimelineForm />
              <VisionNFTMinter />
            </>
          )}
          {userLevel >= 4 && <AdvancedResources />}
        </TabsContent>

        <TabsContent value="community" className="space-y-8">
          {/* Only available at level 4 */}
          {userLevel >= 4 && (
            <>
              <CommunityDashboard />
              <ExpertDirectory />
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
