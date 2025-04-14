import { Button } from '../ui/button';

interface MessageButtonProps {
  text: string;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
}

/**
 * A simple button styled as a link, intended for use within chat messages.
 */
export function MessageButton({ text, onClick, className = '' ,disabled}: MessageButtonProps) {
  return (
    <Button
      variant="link"
      className={`p-0 h-auto text-primary underline text-left whitespace-normal ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {text}
    </Button>
  );
} 