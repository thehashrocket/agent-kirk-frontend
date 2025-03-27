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
  date: DateRange | undefined;
  onDateChange: (date: DateRange | undefined) => void;
  className?: string;
}

export function DatePickerWithRange({
  date,
  onDateChange,
  className,
}: DatePickerWithRangeProps) {
  const [isOpen, setIsOpen] = React.useState(false);

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
      <Popover open={isOpen} onOpenChange={setIsOpen}>
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
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, 'LLL dd, y')} -{' '}
                  {format(date.to, 'LLL dd, y')}
                </>
              ) : (
                format(date.from, 'LLL dd, y')
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
            {date && (
              <Button
                variant="ghost"
                className="ml-auto h-8 px-2"
                onClick={() => {
                  onDateChange(undefined);
                  setIsOpen(false);
                }}
              >
                Reset
              </Button>
            )}
          </div>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={onDateChange}
            numberOfMonths={2}
            className="p-3"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
} 