// ============================================================================
// CalendarGrid Component
// ============================================================================
// Renders the calendar date grid with support for single and range selection.
// Follows Material Design 3 principles with proper accessibility.

import { useMemo, useCallback, memo } from 'react';
import { cn } from '@/app/ui';
import { DEFAULT_DATE_PICKER_LABELS } from '../types';
import type { CalendarGridProps, DateRangeInfo } from './types';
import { getMonthDays, safeSameDay, isDateInRange, isSameDay, isDateDisabled } from './utils';
import { DAYS_IN_WEEK } from './constants';

// ============================================================================
// Sub-Components
// ============================================================================

interface DayHeaderProps {
  daysShort: string[];
}

const DayHeader = memo(function DayHeader({ daysShort }: DayHeaderProps) {
  return (
    <div className="flex w-full mb-1" role="row">
      {daysShort.map((dayName, index) => (
        <div
          key={index}
          className="flex-1 h-12 flex items-center justify-center text-sm font-medium text-on-surface-variant"
          role="columnheader"
          aria-label={dayName}
        >
          {dayName}
        </div>
      ))}
    </div>
  );
});

interface DayCellProps {
  date: Date | null;
  index: number;
  isSelected: boolean;
  isToday: boolean;
  isDisabled: boolean;
  isRangeStart: boolean;
  isRangeEnd: boolean;
  isInRange: boolean;
  bandClass: string;
  isRangeMode: boolean;
  onSelect: (date: Date) => void;
  onHover?: (date: Date | null) => void;
}

const DayCell = memo(function DayCell({
  date,
  index,
  isSelected,
  isToday,
  isDisabled,
  isRangeStart,
  isRangeEnd,
  isInRange,
  bandClass,
  isRangeMode,
  onSelect,
  onHover,
}: DayCellProps) {
  if (!date) {
    return <div className="relative h-12 flex-1" />;
  }

  const handleClick = () => onSelect(date);
  const handleMouseEnter = () => isRangeMode && onHover?.(date);
  const handleMouseLeave = () => isRangeMode && onHover?.(null);

  const buttonClasses = cn(
    'relative z-10 h-10 w-10 flex items-center justify-center rounded-full text-sm transition-colors',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
    // Disabled state
    isDisabled && 'text-on-surface/38 cursor-not-allowed',
    !isDisabled && 'cursor-pointer',
    // Today indicator
    isToday && !isSelected && !isRangeStart && !isRangeEnd && 'ring-1 ring-primary text-primary',
    // Single selection mode
    isSelected && !isRangeMode && 'bg-primary text-on-primary font-medium',
    // Range selection endpoints
    (isRangeStart || isRangeEnd) && 'bg-primary text-on-primary font-medium',
    // In range (middle dates)
    isInRange && 'text-on-surface',
    // Default hover state
    !isDisabled && !isSelected && !isRangeStart && !isRangeEnd && !isInRange && !isToday && 'hover:bg-on-surface/8 text-on-surface'
  );

  return (
    <div className="relative h-12 flex-1 flex items-center justify-center" role="gridcell">
      {/* Range connector band */}
      {bandClass && <div className={bandClass} />}

      <button
        type="button"
        disabled={isDisabled}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={buttonClasses}
        aria-label={date.toLocaleDateString()}
        aria-selected={isSelected || isRangeStart || isRangeEnd}
        aria-disabled={isDisabled}
      >
        {date.getDate()}
      </button>
    </div>
  );
});

// ============================================================================
// Main Component
// ============================================================================

/**
 * CalendarGrid renders a month's dates in a 7-column grid layout.
 * Supports both single date and date range selection modes.
 *
 * @example
 * ```tsx
 * // Single selection mode
 * <CalendarGrid
 *   currentMonth={0}
 *   currentYear={2026}
 *   selectedDate={new Date(2026, 0, 15)}
 *   onDateSelect={(date) => console.log(date)}
 * />
 *
 * // Range selection mode
 * <CalendarGrid
 *   currentMonth={0}
 *   currentYear={2026}
 *   rangeStart={new Date(2026, 0, 10)}
 *   rangeEnd={new Date(2026, 0, 20)}
 *   isRangeMode
 *   onDateSelect={(date) => handleRangeSelect(date)}
 *   onDateHover={(date) => setHoverDate(date)}
 * />
 * ```
 */
export const CalendarGrid = memo(function CalendarGrid({
  currentMonth,
  currentYear,
  selectedDate,
  rangeStart,
  rangeEnd,
  hoverDate,
  minDate,
  maxDate,
  onDateSelect,
  onDateHover,
  isRangeMode = false,
  labels = {},
}: CalendarGridProps) {
  const mergedLabels = { ...DEFAULT_DATE_PICKER_LABELS, ...labels };

  // Generate days for the current month
  const days = useMemo(() => getMonthDays(currentYear, currentMonth), [currentYear, currentMonth]);

  // Today's date for highlighting
  const today = useMemo(() => new Date(), []);

  // Calculate the effective end date (either rangeEnd or hoverDate)
  const effectiveEnd = rangeEnd || hoverDate;

  /**
   * Get range information for a date cell (used for styling the connector band)
   */
  const getRangeInfo = useCallback(
    (date: Date | null, index: number): DateRangeInfo => {
      if (!date || !isRangeMode) {
        return {
          inRange: false,
          isStart: false,
          isEnd: false,
          isFirstOfRow: false,
          isLastOfRow: false,
        };
      }

      const isStart = safeSameDay(date, rangeStart);
      const isEnd = safeSameDay(date, effectiveEnd);
      const inRange = rangeStart && effectiveEnd && isDateInRange(date, rangeStart, effectiveEnd);

      const colIndex = index % DAYS_IN_WEEK;

      return {
        inRange: inRange ?? false,
        isStart,
        isEnd,
        isFirstOfRow: colIndex === 0,
        isLastOfRow: colIndex === DAYS_IN_WEEK - 1,
      };
    },
    [isRangeMode, rangeStart, effectiveEnd]
  );

  /**
   * Get the CSS class for the range background band
   */
  const getRangeBandClass = useCallback(
    (date: Date | null, index: number): string => {
      if (!date) return '';

      const { inRange, isStart, isEnd, isFirstOfRow, isLastOfRow } = getRangeInfo(date, index);

      if (!inRange && !isStart && !isEnd) return '';

      const hasRangeBefore = rangeStart && effectiveEnd && date > rangeStart;
      const hasRangeAfter = rangeStart && effectiveEnd && date < effectiveEnd;

      const baseClasses = 'absolute inset-y-0 bg-primary/12';

      // Middle cells: full width background
      if (inRange && !isStart && !isEnd) {
        return cn(baseClasses, 'left-0 right-0');
      }

      // Start cell: from center to right
      if (isStart && hasRangeAfter) {
        return cn(baseClasses, 'left-1/2 right-0', isLastOfRow && 'rounded-r-full');
      }

      // End cell: from left to center
      if (isEnd && hasRangeBefore) {
        return cn(baseClasses, 'left-0 right-1/2', isFirstOfRow && 'rounded-l-full');
      }

      return '';
    },
    [getRangeInfo, rangeStart, effectiveEnd]
  );

  // Group days into weeks for row-based rendering
  const weeks = useMemo(() => {
    const result: (Date | null)[][] = [];
    for (let i = 0; i < days.length; i += DAYS_IN_WEEK) {
      const week = days.slice(i, i + DAYS_IN_WEEK);
      // Pad the last row to always have 7 cells
      while (week.length < DAYS_IN_WEEK) {
        week.push(null);
      }
      result.push(week);
    }
    return result;
  }, [days]);

  return (
    <div className="px-4 pb-3" role="grid" aria-label="Calendar">
      {/* Day headers */}
      <DayHeader daysShort={mergedLabels.daysShort!} />

      {/* Date grid */}
      <div className="flex flex-col w-full" role="rowgroup">
        {weeks.map((week, rowIndex) => (
          <div key={rowIndex} className="flex w-full" role="row">
            {week.map((date, colIndex) => {
              const index = rowIndex * DAYS_IN_WEEK + colIndex;
              const rangeInfo = getRangeInfo(date, index);

              return (
                <DayCell
                  key={colIndex}
                  date={date}
                  index={index}
                  isSelected={safeSameDay(date, selectedDate)}
                  isToday={isSameDay(date, today)}
                  isDisabled={date ? isDateDisabled(date, minDate, maxDate) : true}
                  isRangeStart={rangeInfo.isStart}
                  isRangeEnd={rangeInfo.isEnd}
                  isInRange={rangeInfo.inRange && !rangeInfo.isStart && !rangeInfo.isEnd}
                  bandClass={isRangeMode ? getRangeBandClass(date, index) : ''}
                  isRangeMode={isRangeMode}
                  onSelect={onDateSelect}
                  onHover={onDateHover}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
});
