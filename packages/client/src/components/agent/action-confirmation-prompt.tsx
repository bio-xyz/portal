import React from 'react';
import { Button } from '@/components/ui/button'; // Assuming shadcn/ui Button is used

interface ActionConfirmationPromptProps {
  promptText: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Renders a prompt within the chat asking the user to confirm or cancel an action.
 */
export const ActionConfirmationPrompt: React.FC<ActionConfirmationPromptProps> = ({
  promptText,
  onConfirm,
  onCancel,
}) => {
  return (
    <div className="my-2 p-3 bg-secondary/20 rounded-md border border-border">
      <p className="mb-3 text-sm">{promptText}</p>
      <div className="flex gap-2">
        <Button size="sm" onClick={onConfirm} aria-label="Confirm Action">
          Yes
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel} aria-label="Cancel Action">
          No
        </Button>
      </div>
    </div>
  );
};