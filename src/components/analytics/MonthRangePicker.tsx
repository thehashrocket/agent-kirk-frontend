import React from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/*
 * MonthRangePicker Component
 * File: src/components/analytics/MonthRangePicker.tsx
 *
 * Description:
 *   A UI component for selecting a month (and year) range. Useful for analytics dashboards or reports where users need to filter data by month. 
 *   Displays a popover with a year selector and month buttons. Calls onChange with the selected month range (from/to as Date objects).
 *
 * Usage Example:
 *   import { MonthRangePicker } from '@/components/analytics/MonthRangePicker';
 *
 *   <MonthRangePicker
 *     onChange={({ from, to }) => {
 *       // handle new month range
 *     }}
 *     defaultValue={{ from: new Date(2024, 0, 1), to: new Date(2024, 0, 31) }}
 *   />
 */

/**
 * Props for MonthRangePicker.
 * @property onChange - Callback fired when a new month is selected. Receives an object with 'from' and 'to' Date values for the selected month.
 * @property defaultValue - Optional initial value for the picker (from/to as Date objects).
 * @property value - Optional controlled value for the picker (from/to as Date objects).
 */
interface MonthRangePickerProps {
  onChange: (range: { from: Date; to: Date }) => void;
  defaultValue?: { from: Date; to: Date };
  value?: { from: Date; to: Date };
}

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const getYearRange = (centerYear: number, range: number = 5) => {
  const years = [];
  for (let y = centerYear - range; y <= centerYear + range; y++) {
    years.push(y);
  }
  return years;
};

/**
 * MonthRangePicker
 *
 * A popover-based month/year picker for analytics and reporting UIs.
 *
 * @param {MonthRangePickerProps} props - Component props
 * @returns {JSX.Element}
 */
export function MonthRangePicker({ onChange, defaultValue, value }: MonthRangePickerProps) {
  const currentYear = new Date().getFullYear();
  const yearRange = getYearRange(currentYear, 5);

  const getMonthRange = (year: number, month: number) => {
    const from = new Date(year, month, 1);
    const to = new Date(year, month + 1, 0);
    return { from, to };
  };

  const getDefaultValue = () => {
    if (defaultValue) return defaultValue;
    const now = new Date();
    return getMonthRange(now.getFullYear(), now.getMonth());
  };

  // Internal state for uncontrolled usage
  const [internalSelected, setInternalSelected] = React.useState<{ from: Date; to: Date }>(() => getDefaultValue());
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedYear, setSelectedYear] = React.useState(() => (value || getDefaultValue()).from.getFullYear());

  // Use controlled value if provided, otherwise internal state
  const selected = value || internalSelected;

  const handleSelect = (monthIdx: number) => {
    const range = getMonthRange(selectedYear, monthIdx);
    if (!value) setInternalSelected(range); // Only update internal state if uncontrolled
    onChange(range);
    setIsOpen(false);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(Number(e.target.value));
  };

  const selectedMonth = selected.from.getMonth();

  const selectedYearDisplay = selected.from.getFullYear();

  React.useEffect(() => {
    // If value changes (controlled), update selectedYear
    if (value) {
      setSelectedYear(value.from.getFullYear());
    }
  }, [value]);


  return (
    <div className="flex items-center">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-[200px] justify-start text-left font-normal',
              !selected && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selected ? (
              <>{monthNames[selectedMonth]} {selectedYearDisplay}</>
            ) : (
              <span>Pick a month</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3">
            <h4 className="font-medium text-sm mb-2">Select Month</h4>
            <div className="mb-3">
              <select
                className="border rounded px-2 py-1 text-sm"
                value={selectedYear}
                onChange={handleYearChange}
                aria-label="Select year"
              >
                {yearRange.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {monthNames.map((name, idx) => (
                <Button
                  key={name}
                  size="sm"
                  variant={selectedMonth === idx && selectedYearDisplay === selectedYear ? 'default' : 'outline'}
                  onClick={() => handleSelect(idx)}
                  className="text-xs"
                >
                  {name}
                </Button>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
} 