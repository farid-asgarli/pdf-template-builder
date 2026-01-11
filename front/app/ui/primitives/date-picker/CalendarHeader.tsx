// ============================================================================
// CalendarHeader Component
// ============================================================================
// Navigation header for calendar showing current month/year with navigation controls.
// Follows Material Design 3 patterns with accessibility support.

import { memo } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { IconButton } from '../buttons';
import { DEFAULT_DATE_PICKER_LABELS } from '../types';
import type { CalendarHeaderProps } from './types';

// ============================================================================
// Component
// ============================================================================

/**
 * CalendarHeader provides navigation controls for the calendar.
 * Shows current month/year and allows navigation between months.
 *
 * @example
 * ```tsx
 * <CalendarHeader
 *   currentMonth={0}
 *   currentYear={2026}
 *   onPrevMonth={() => goToPrevMonth()}
 *   onNextMonth={() => goToNextMonth()}
 *   onMonthYearClick={() => openMonthYearPicker()}
 * />
 * ```
 */
export const CalendarHeader = memo(function CalendarHeader({
  currentMonth,
  currentYear,
  onPrevMonth,
  onNextMonth,
  onMonthYearClick,
  labels = {},
}: CalendarHeaderProps) {
  const mergedLabels = { ...DEFAULT_DATE_PICKER_LABELS, ...labels };
  const monthName = mergedLabels.months?.[currentMonth] ?? '';

  return (
    <div className="flex items-center justify-between px-4 py-3">
      {/* Month/Year selector with dropdown indicator */}
      <button
        type="button"
        onClick={onMonthYearClick}
        className="flex items-center gap-1 text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors px-2 py-1.5 -ml-2 rounded-lg hover:bg-on-surface/8"
        aria-label={`${monthName} ${currentYear}. Click to select month and year`}
        aria-haspopup="dialog"
      >
        {monthName} {currentYear}
        <ChevronDown className="h-4 w-4" aria-hidden="true" />
      </button>

      {/* Navigation arrows */}
      <div className="flex items-center" role="group" aria-label="Month navigation">
        <IconButton variant="standard" size="sm" onClick={onPrevMonth} aria-label="Previous month">
          <ChevronLeft className="h-5 w-5" />
        </IconButton>
        <IconButton variant="standard" size="sm" onClick={onNextMonth} aria-label="Next month">
          <ChevronRight className="h-5 w-5" />
        </IconButton>
      </div>
    </div>
  );
});
