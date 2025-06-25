/**
 * @fileoverview Onboarding Layout
 * 
 * Layout component for the onboarding flow that provides a consistent
 * structure and styling for all onboarding steps.
 * 
 * @layout /onboarding/*
 * @access Authenticated users only
 */

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Onboarding - Kirk',
  description: 'Complete your account setup to get started with Kirk',
};

interface OnboardingLayoutProps {
  children: React.ReactNode;
}

/**
 * Onboarding Layout Component
 * 
 * Provides a clean, focused layout for the onboarding flow.
 * Removes distractions and focuses user attention on the onboarding steps.
 */
export default function OnboardingLayout({ children }: OnboardingLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
} 