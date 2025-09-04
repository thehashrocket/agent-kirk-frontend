/**
 * @fileoverview Onboarding Step 1: Company Selection
 *
 * First step of the onboarding process where users select or create their company.
 * This step is essential for connecting the user profile to their organization.
 *
 * @route /onboarding/step1
 * @access Authenticated users only
 */

import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CompanySelector } from '@/components/onboarding/company-selector';
import { Building2 } from 'lucide-react';

/**
 * Onboarding Step 1 Page Component
 *
 * Allows users to search for and select their company during onboarding.
 * Users can either select from existing companies or create a new one.
 */
export default function OnboardingStep1Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8">

        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Welcome to Kirk</h1>
            <p className="text-muted-foreground text-lg">
              Let&rsquo;s get you set up by connecting you to your company
            </p>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center space-x-2">
          <div className="flex h-2 w-2 items-center justify-center rounded-full bg-primary">
            <span className="sr-only">Step 1</span>
          </div>
          <div className="h-px w-8 bg-muted-foreground/30" />
          <div className="flex h-2 w-2 items-center justify-center rounded-full bg-muted-foreground/30">
            <span className="sr-only">Step 2</span>
          </div>
          <div className="h-px w-8 bg-muted-foreground/30" />
          <div className="flex h-2 w-2 items-center justify-center rounded-full bg-muted-foreground/30">
            <span className="sr-only">Step 3</span>
          </div>
        </div>

        {/* Company Selection Card */}
        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-xl">Find Your Company</CardTitle>
            <CardDescription className="text-base">
              Search for your company or create a new one if it doesn&rsquo;t exist yet.
              This helps us organize your data and connect you with the right team.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Suspense
              fallback={
                <div className="space-y-4">
                  <div className="h-10 bg-muted animate-pulse rounded-md" />
                  <div className="h-32 bg-muted animate-pulse rounded-md" />
                </div>
              }
            >
              <CompanySelector />
            </Suspense>
          </CardContent>
        </Card>

        {/* Help Text */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            Can&rsquo;t find your company? Don&rsquo;t worry! You can create it and we&rsquo;ll
            help you get everything set up.
          </p>
        </div>
      </div>
    </div>
  );
}

