import { toast as sonnerToast } from 'sonner';

interface ToastProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

function toast({ title, description, variant = 'default' }: ToastProps) {
  if (variant === 'destructive') {
    sonnerToast.error(title, {
      description,
    });
  } else {
    sonnerToast(title, {
      description,
    });
  }
}

export function useToast() {
  return {
    toast,
  };
} 