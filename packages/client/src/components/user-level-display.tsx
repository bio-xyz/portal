'use client';

import { useUserLevel } from '../hooks/use-user-level';
import { Button } from './ui/button';
import { Card } from './ui/card';

export function UserLevelDisplay() {
  const { level, isLoading, error, incrementLevel } = useUserLevel();

  if (isLoading) {
    return <div>Loading user level...</div>;
  }

  if (error) {
    return <div>Error loading user level: {error.message}</div>;
  }

  return (
    <Card className="p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">User Level</h2>
      <div className="flex items-center mb-4">
        <div className="text-5xl font-bold mr-4">{level ?? 0}</div>
        <div className="flex flex-col">
          <span className="text-sm text-gray-500">Current Level</span>
          {level !== null && level > 1 && (
            <span className="text-xs text-green-500">Leveled up!</span>
          )}
        </div>
      </div>

      <Button
        onClick={incrementLevel}
        className="w-full bg-bio-accent hover:bg-bio-accent/90 text-bio-accent-foreground"
      >
        Level Up
      </Button>

      <p className="mt-4 text-sm text-gray-500">{getExplanationForLevel(level ?? 0)}</p>
    </Card>
  );
}

function getExplanationForLevel(level: number): string {
  switch (level) {
    case 0:
      return "You haven't started your journey yet. Sign in to begin.";
    case 1:
      return "Welcome to BioDAO! You're at the beginning of your scientific journey.";
    case 2:
      return "You've reached level 2! You now have access to more advanced features.";
    case 3:
      return 'Level 3 unlocks strategic planning and connections to experts.';
    case 4:
      return 'At level 4, you can create and mint your own NFTs.';
    case 5:
      return 'Level 5 grants you access to exclusive resources and community features.';
    default:
      return `You're at level ${level}! Keep up the great work.`;
  }
}
