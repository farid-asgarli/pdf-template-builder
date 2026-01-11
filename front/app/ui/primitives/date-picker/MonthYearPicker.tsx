// ============================================================================
// MonthYearPicker Component
// ============================================================================
// Allows quick selection of month and year for calendar navigation.
// Follows Material Design 3 patterns with accessibility support.

import { useState, useMemo, memo, useCallback } from 'react';
import { Button } from '../buttons';
import { cn } from '@/app/ui';
import { DEFAULT_DATE_PICKER_LABELS } from '../types';
import type { MonthYearPickerProps } from './types';
import { YEAR_RANGE_OFFSET } from './constants';

// ============================================================================
// Sub-Components
// ============================================================================

interface YearSelectorProps {
  years: number[];
  selectedYear: number;
  onSelect: (year: number) => void;
}

const YearSelector = memo(function YearSelector({ years, selectedYear, onSelect }: YearSelectorProps) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-medium text-on-surface-variant mb-2 px-1" id="year-selector-label">
        Year
      </label>
      <div
        className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto px-1"
        role="listbox"
        aria-labelledby="year-selector-label"
        aria-activedescendant={`year-${selectedYear}`}
      >
        {years.map((year) => (
          <button
            key={year}
            id={`year-${year}`}
            type="button"
            role="option"
            aria-selected={year === selectedYear}
            onClick={() => onSelect(year)}
            className={cn(
              'px-3 py-1.5 text-sm rounded-full transition-colors',
              year === selectedYear ? 'bg-primary text-on-primary font-medium' : 'text-on-surface hover:bg-on-surface/8'
            )}
          >
            {year}
          </button>
        ))}
      </div>
    </div>
  );
});

interface MonthGridProps {
  months: string[];
  currentMonth: number;
  currentYear: number;
  selectedYear: number;
  onSelect: (month: number) => void;
}

const MonthGrid = memo(function MonthGrid({ months, currentMonth, currentYear, selectedYear, onSelect }: MonthGridProps) {
  return (
    <div className="grid grid-cols-3 gap-1" role="listbox" aria-label="Select month">
      {months.map((monthName, index) => {
        const isCurrentMonthYear = index === currentMonth && selectedYear === currentYear;

        return (
          <button
            key={index}
            type="button"
            role="option"
            aria-selected={isCurrentMonthYear}
            onClick={() => onSelect(index)}
            className={cn(
              'px-3 py-2.5 text-sm rounded-full transition-colors',
              isCurrentMonthYear ? 'bg-primary text-on-primary font-medium' : 'text-on-surface hover:bg-on-surface/8'
            )}
          >
            {monthName}
          </button>
        );
      })}
    </div>
  );
});

// ============================================================================
// Main Component
// ============================================================================

/**
 * MonthYearPicker provides quick navigation to any month/year.
 * Shows a year selector and month grid for fast calendar navigation.
 *
 * @example
 * ```tsx
 * <MonthYearPicker
 *   currentMonth={0}
 *   currentYear={2026}
 *   onSelect={(month, year) => {
 *     setCurrentMonth(month);
 *     setCurrentYear(year);
 *   }}
 *   onBack={() => setViewMode('calendar')}
 * />
 * ```
 */
export const MonthYearPicker = memo(function MonthYearPicker({ currentMonth, currentYear, onSelect, onBack, labels = {} }: MonthYearPickerProps) {
  const mergedLabels = { ...DEFAULT_DATE_PICKER_LABELS, ...labels };
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Generate year range centered around current year
  const years = useMemo(() => {
    const currentYearNow = new Date().getFullYear();
    const yearsArray: number[] = [];
    for (let y = currentYearNow - YEAR_RANGE_OFFSET; y <= currentYearNow + YEAR_RANGE_OFFSET; y++) {
      yearsArray.push(y);
    }
    return yearsArray;
  }, []);

  const handleMonthSelect = useCallback(
    (month: number) => {
      onSelect(month, selectedYear);
    },
    [selectedYear, onSelect]
  );

  return (
    <div className="p-4" role="dialog" aria-label="Select month and year">
      {/* Year selector */}
      <YearSelector years={years} selectedYear={selectedYear} onSelect={setSelectedYear} />

      {/* Month grid */}
      <MonthGrid
        months={mergedLabels.monthsShort!}
        currentMonth={currentMonth}
        currentYear={currentYear}
        selectedYear={selectedYear}
        onSelect={handleMonthSelect}
      />

      {/* Back button */}
      <div className="mt-4 pt-3 border-t border-outline-variant/30">
        <Button variant="text" size="sm" onClick={onBack} className="w-full">
          {mergedLabels.backToCalendar}
        </Button>
      </div>
    </div>
  );
});
