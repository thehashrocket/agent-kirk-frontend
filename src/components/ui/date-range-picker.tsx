'use client';

import * as React from 'react';
import { format, addDays } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DatePickerWithRangeProps {
  date: DateRange | undefined | null | { from: Date; to: Date };
  onDateChange: (date: DateRange | undefined) => void;
  className?: string;
}

export function DatePickerWithRange({
  date,
  onDateChange,
  className,
}: DatePickerWithRangeProps) {

  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(date as DateRange);

  React.useEffect(() => {
    if (date && 'from' in date && 'to' in date) {
      setDateRange({
        from: date.from,
        to: date.to,
      });
    } else {
      setDateRange(undefined);
    }
  }, [date]);

  // Convert the date prop to the expected DateRange format
  const normalizedDate: DateRange | undefined = React.useMemo(() => {
    if (!date) return undefined;

    // If it's already in the correct format, return as is
    if ('from' in date && 'to' in date) {
      return {
        from: date.from,
        to: date.to,
      };
    }

    return date as DateRange;
  }, [date]);

  const [isOpen, setIsOpen] = React.useState(false);
  const [tempRange, setTempRange] = React.useState<DateRange | undefined>(normalizedDate);

  // Update temp range when the external date prop changes
  React.useEffect(() => {
    setTempRange(normalizedDate);
  }, [normalizedDate]);

  // Handle calendar date selection
  const handleDateSelect = (range: DateRange | undefined) => {
    setTempRange(range);

    // Only submit if user just completed a range selection (second click)
    if (
      range?.from &&
      range?.to &&
      (!tempRange?.to || tempRange?.to.getTime() !== range.to.getTime())
    ) {
      // If it's a single-day range (from === to), only submit on double-click
      if (range.from.getTime() === range.to.getTime()) {
        if (tempRange?.from && tempRange.from.getTime() === range.from.getTime()) {
          onDateChange(range);
          setIsOpen(false);
        }
      } else {
        onDateChange(range);
        setIsOpen(false);
      }
    }
  };

  // Handle popover close - reset temp range if incomplete selection
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset temp range to the current normalized date if popover is closed
      setTempRange(normalizedDate);
    }
  };

  const presets = [
    {
      label: 'Today',
      value: 'today',
      dateRange: {
        from: new Date(),
        to: new Date(),
      },
    },
    {
      label: 'Last 7 days',
      value: '7days',
      dateRange: {
        from: addDays(new Date(), -7),
        to: new Date(),
      },
    },
    {
      label: 'Last 14 days',
      value: '14days',
      dateRange: {
        from: addDays(new Date(), -14),
        to: new Date(),
      },
    },
    {
      label: 'Last 30 days',
      value: '30days',
      dateRange: {
        from: addDays(new Date(), -30),
        to: new Date(),
      },
    },
    {
      label: 'Last 90 days',
      value: '90days',
      dateRange: {
        from: addDays(new Date(), -90),
        to: new Date(),
      },
    },
  ];

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover open={isOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={'outline'}
            className={cn(
              'w-[300px] justify-start text-left font-normal',
              !date && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {normalizedDate?.from ? (
              normalizedDate.to ? (
                <>
                  {format(normalizedDate.from, 'LLL dd, y')} -{' '}
                  {format(normalizedDate.to, 'LLL dd, y')}
                </>
              ) : (
                format(normalizedDate.from, 'LLL dd, y')
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <div className="flex items-center gap-2 border-b p-3">
            <Select
              onValueChange={(value) => {
                const preset = presets.find((p) => p.value === value);
                if (preset) {
                  onDateChange(preset.dateRange);
                  setIsOpen(false);
                }
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                {presets.map((preset) => (
                  <SelectItem key={preset.value} value={preset.value}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {normalizedDate && (
              <Button
                variant="ghost"
                className="ml-auto h-8 px-2"
                onClick={() => {
                  // Reset date selection
                  setTempRange(undefined);
                  // Call onDateChange with undefined to clear the selection
                  console.log('Resetting date range');
                  setDateRange(undefined);
                  onDateChange(undefined);
                }}
              >
                Reset
              </Button>
            )}
          </div>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={tempRange?.from || normalizedDate?.from}
            selected={tempRange}
            onSelect={handleDateSelect}
            numberOfMonths={2}
            className="p-3"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
