'use client';

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TicketFilters as ITicketFilters } from "@/types/tickets";

interface TicketFiltersProps {
  onFilterChange?: (filters: ITicketFilters) => void;
  showClientFilter?: boolean;
  accountRepId?: string;
}

const initialFilters: ITicketFilters = {
  search: "",
  priority: "all",
  assignee: "all",
  dateRange: "all",
  clientId: "all",
};

export default function TicketFilters({ 
  onFilterChange, 
  showClientFilter = false,
  accountRepId 
}: TicketFiltersProps) {
  const [filters, setFilters] = useState<ITicketFilters>(initialFilters);

  const handleFilterChange = (key: keyof ITicketFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const handleReset = () => {
    setFilters(initialFilters);
    onFilterChange?.(initialFilters);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold mb-4">Filters</h2>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            placeholder="Search tickets..."
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
          />
        </div>

        {showClientFilter && (
          <div className="space-y-2">
            <Label htmlFor="client">Client</Label>
            <Select
              value={filters.clientId}
              onValueChange={(value) => handleFilterChange("clientId", value)}
            >
              <SelectTrigger id="client">
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                {/* We'll populate this dynamically with the account rep's clients */}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select
            value={filters.priority}
            onValueChange={(value) => handleFilterChange("priority", value)}
          >
            <SelectTrigger id="priority">
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="assignee">Assignee</Label>
          <Select
            value={filters.assignee}
            onValueChange={(value) => handleFilterChange("assignee", value)}
          >
            <SelectTrigger id="assignee">
              <SelectValue placeholder="Select assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {/* We'll populate this dynamically later */}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dateRange">Date Range</Label>
          <Select
            value={filters.dateRange}
            onValueChange={(value) => handleFilterChange("dateRange", value)}
          >
            <SelectTrigger id="dateRange">
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This week</SelectItem>
              <SelectItem value="month">This month</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={handleReset}
        >
          Reset Filters
        </Button>
      </div>
    </div>
  );
} 