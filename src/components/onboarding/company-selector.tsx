'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useDebounce } from '@/hooks/use-debounce';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Plus, Users, Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Company, CompanySelectorProps } from '@/types/company';

export function CompanySelector({ onCompanySelected, className }: CompanySelectorProps) {
  const router = useRouter();
  const { data: session, update } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showCreateOption, setShowCreateOption] = useState(false);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const searchCompanies = useCallback(async (query: string) => {
    if (!query.trim()) {
      setCompanies([]);
      setShowCreateOption(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/companies?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setCompanies(data);
        
        // Show create option if no exact match found
        const exactMatch = data.some((company: Company) => 
          company.name.toLowerCase() === query.toLowerCase()
        );
        setShowCreateOption(!exactMatch);
      }
    } catch (error) {
      console.error('Error searching companies:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    searchCompanies(debouncedSearchQuery);
  }, [debouncedSearchQuery, searchCompanies]);

  const createCompany = async (name: string): Promise<Company | null> => {
    setIsCreating(true);
    try {
      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });

      if (response.ok) {
        const company = await response.json();
        return company;
      } else {
        const errorText = await response.text();
        console.error('Error creating company:', errorText);
        return null;
      }
    } catch (error) {
      console.error('Error creating company:', error);
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  const updateUserCompany = async (companyId: string) => {
    setIsUpdatingUser(true);
    try {
      const response = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ companyId }),
      });

      if (response.ok) {
        return true;
      } else {
        const errorText = await response.text();
        console.error('Error updating user company:', errorText);
        return false;
      }
    } catch (error) {
      console.error('Error updating user company:', error);
      return false;
    } finally {
      setIsUpdatingUser(false);
    }
  };

  const handleCompanySelect = async (company: Company) => {
    setSelectedCompany(company);
    
    const success = await updateUserCompany(company.id);
    if (success) {
      // Force session update to refresh user data
      await update();
      
      onCompanySelected?.(company);
      
      // Navigate to role-specific dashboard based on user role
      const role = session?.user?.role;
      let dashboardPath = '/client/dashboard'; // Default for CLIENT
      
      if (role === 'ADMIN') {
        dashboardPath = '/admin/dashboard';
      } else if (role === 'ACCOUNT_REP') {
        dashboardPath = '/account-rep/dashboard';
      }
      
      // Use window.location to ensure full page refresh and session reload
      // This will trigger a fresh session fetch from the server
      window.location.href = dashboardPath;
    }
  };

  const handleCreateAndSelect = async () => {
    if (!searchQuery.trim()) return;

    const company = await createCompany(searchQuery.trim());
    if (company) {
      await handleCompanySelect(company);
    }
  };

  const isLoading = isSearching || isCreating || isUpdatingUser;

  return (
    <div className={cn('space-y-4', className)}>
      <div className="space-y-2">
        <Label htmlFor="company-search">
          Search for your company
        </Label>
        <div className="relative">
          <Input
            id="company-search"
            type="text"
            placeholder="Enter company name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            disabled={isLoading}
          />
          <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>
      </div>

      {searchQuery && (
        <div className="space-y-2">
          {companies.map((company) => (
            <Card
              key={company.id}
              className={cn(
                'cursor-pointer transition-colors hover:bg-muted/50',
                selectedCompany?.id === company.id && 'ring-2 ring-primary'
              )}
              onClick={() => handleCompanySelect(company)}
              tabIndex={-1}
            >
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{company.name}</p>
                    <p className="text-sm text-muted-foreground flex items-center">
                      <Users className="h-3 w-3 mr-1" />
                      {company._count.users} {company._count.users === 1 ? 'user' : 'users'}
                    </p>
                  </div>
                </div>
                {selectedCompany?.id === company.id && isUpdatingUser && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {selectedCompany?.id === company.id && !isUpdatingUser && (
                  <Check className="h-4 w-4 text-green-600" />
                )}
              </CardContent>
            </Card>
          ))}

          {showCreateOption && (
            <Card
              className="cursor-pointer border-dashed transition-colors hover:bg-muted/50"
              onClick={handleCreateAndSelect}
              tabIndex={-1}
            >
              <CardContent className="flex items-center space-x-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">Create &ldquo;{searchQuery}&rdquo;</p>
                  <p className="text-sm text-muted-foreground">
                    Add this as a new company
                  </p>
                </div>
                {isCreating && (
                  <Loader2 className="ml-auto h-4 w-4 animate-spin" />
                )}
              </CardContent>
            </Card>
          )}

          {companies.length === 0 && !showCreateOption && !isSearching && searchQuery && (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No companies found</p>
            </div>
          )}
        </div>
      )}

      {!searchQuery && (
        <div className="text-center py-8 text-muted-foreground">
          <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Start typing to search for companies</p>
        </div>
      )}
    </div>
  );
} 