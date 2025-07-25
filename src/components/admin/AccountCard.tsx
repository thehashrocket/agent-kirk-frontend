/**
 * @file src/components/admin/AccountCard.tsx
 * Reusable component for displaying account information with actions
 */

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface AccountCardProps {
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function AccountCard({ children, actions, className = '' }: AccountCardProps) {
  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          {children}
        </div>
        {actions && (
          <div className="flex flex-row items-center gap-2 ml-4">
            {actions}
          </div>
        )}
      </div>
    </Card>
  );
}

interface DisassociateButtonProps {
  onDisassociate: () => void;
  label?: string;
}

export function DisassociateButton({ onDisassociate, label = 'Disassociate' }: DisassociateButtonProps) {
  return (
    <Button variant="destructive" onClick={onDisassociate}>
      {label}
    </Button>
  );
} 