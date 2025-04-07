'use client';

import { useAuth } from '../../lib/auth-provider';
import { useUserLevel } from '../../hooks/use-user-level';
import { useWelcomeForm } from '../../lib/welcome-form-context';
import { CoreAgentChat } from './core-agent-chat';
import { useEffect, useState } from 'react';

export function LevelSpecificChat() {
  const { user } = useAuth();
  const { level, isLoading } = useUserLevel();
  const { isFormSubmitted, formData } = useWelcomeForm();
  const [initialMessage, setInitialMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isFormSubmitted && formData) {
      // Custom welcome message for users who just submitted the welcome form
      const projectName = formData.projectName || 'Default project';
      setInitialMessage(`We've just begun the process of bringing ${projectName} to life.

Your journey will be guided by the Portal & your project will level up as you progress along the BioDAO building path

Every BioDAO has 3 key components
1) Science
2) Crypto Assets
3) Community Spirit`);
    }
  }, [isFormSubmitted, formData]);

  if (isLoading) {
    return <div>Loading agent...</div>;
  }

  if (!user) {
    return <div>Please sign in to chat with your agent.</div>;
  }

  return <CoreAgentChat userId={user.id} userLevel={level || 1} initialMessage={initialMessage} />;
}
