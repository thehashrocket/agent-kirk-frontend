"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Building2, Loader2, Plus, RotateCcw } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import type { Company } from "@/types/company";

interface CompanySearchSelectProps {
  value?: string;
  onChange: (companyId?: string, company?: Company | null) => void;
  className?: string;
  allowCreate?: boolean;
  disabled?: boolean;
}

/**
 * CompanySearchSelect provides a lightweight search and select experience for assigning companies.
 * Intended for admin/account rep user creation flows where we only need to pick an existing company
 * (with optional ability to create a new one on the fly).
 */
export function CompanySearchSelect({
  value,
  onChange,
  className,
  allowCreate = true,
  disabled = false,
}: CompanySearchSelectProps) {
  const [query, setQuery] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (!value) {
      setSelectedCompany(null);
    }
  }, [value]);

  const fetchCompanies = useCallback(async (search: string) => {
    if (!search.trim()) {
      setCompanies([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/companies?q=${encodeURIComponent(search)}`);
      if (!response.ok) {
        throw new Error("Failed to search companies");
      }
      const data: Company[] = await response.json();
      setCompanies(data);
    } catch (error) {
      console.error(error);
      setCompanies([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies(debouncedQuery);
  }, [debouncedQuery, fetchCompanies]);

  const handleSelectCompany = useCallback(
    (company: Company) => {
      setSelectedCompany(company);
      onChange(company.id, company);
      setQuery("");
      setCompanies([]);
    },
    [onChange]
  );

  const handleClearSelection = useCallback(() => {
    setSelectedCompany(null);
    setQuery("");
    setCompanies([]);
    onChange(undefined, null);
  }, [onChange]);

  const handleCreateCompany = useCallback(async () => {
    if (!allowCreate || !query.trim()) {
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch("/api/companies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: query.trim() }),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to create company");
      }

      const company: Company = await response.json();
      handleSelectCompany(company);
    } catch (error) {
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  }, [allowCreate, query, handleSelectCompany]);

  const canCreate = useMemo(() => {
    if (!allowCreate || !debouncedQuery.trim()) {
      return false;
    }
    const lowerQuery = debouncedQuery.trim().toLowerCase();
    return !companies.some((company) => company.name.toLowerCase() === lowerQuery);
  }, [allowCreate, debouncedQuery, companies]);

  return (
    <div className={className}>
      {selectedCompany ? (
        <div className="flex items-center justify-between rounded-md border border-muted bg-muted/40 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium leading-none">{selectedCompany.name}</p>
              <p className="text-xs text-muted-foreground">
                {selectedCompany._count.users} {selectedCompany._count.users === 1 ? "user" : "users"} connected
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClearSelection} disabled={disabled}>
            <RotateCcw className="mr-2 h-4 w-4" /> Change
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search companies..."
              className="pr-10"
              disabled={disabled || isCreating}
            />
            {(isSearching || isCreating) && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
          </div>

          <ScrollArea className="max-h-40 rounded-md border border-dashed">
            <div className="p-2 space-y-1">
              {companies.length === 0 && !isSearching ? (
                <p className="text-sm text-muted-foreground text-center py-2">
                  {debouncedQuery ? "No companies found." : "Start typing to search companies."}
                </p>
              ) : (
                companies.map((company) => (
                  <button
                    type="button"
                    key={company.id}
                    onClick={() => handleSelectCompany(company)}
                    className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2"
                    disabled={disabled}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium leading-none">{company.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {company._count.users} {company._count.users === 1 ? "user" : "users"}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>

          {canCreate && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleCreateCompany}
              disabled={disabled || isCreating}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create {debouncedQuery.trim()}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
