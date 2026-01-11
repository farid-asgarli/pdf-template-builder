// ============================================================================
// Date Picker Types
// ============================================================================
// Comprehensive type definitions for all date picker components.
// Follows best practices: JSDoc documentation, strict typing, extensibility.

import type { DatePickerLabels } from '../types';

// ============================================================================
// Core Value Types
// ============================================================================

/**
 * ISO 8601 date string format (YYYY-MM-DD)
 * @example "2026-01-03"
 */
export type ISODateString = string;

/**
 * Date range with start and end dates
 */
export interface DateRange {
  /** Start date in ISO format */
  from: ISODateString;
  /** End date in ISO format */
  to: ISODateString;
}

// ============================================================================
// Preset Types
// ============================================================================

/**
 * Predefined date range preset for quick selection
 * @example
 * ```ts
 * const preset: DatePreset = {
 *   id: 'last7d',
 *   label: 'Last 7 days',
 *   getRange: () => ({ fromDate: '2026-01-01', toDate: '2026-01-07' })
 * };
 * ```
 */
export interface DatePreset {
  /** Unique identifier for the preset */
  id: string;
  /** Display label (should be pre-translated if using i18n) */
  label: string;
  /** Function to calculate the date range */
  getRange: () => { fromDate: ISODateString; toDate: ISODateString };
}

// ============================================================================
// Component Props Types
// ============================================================================

/**
 * Common props shared across date picker components
 */
export interface DatePickerBaseProps {
  /** Minimum selectable date (ISO format: YYYY-MM-DD) */
  minDate?: ISODateString;
  /** Maximum selectable date (ISO format: YYYY-MM-DD) */
  maxDate?: ISODateString;
  /** Disable the component */
  disabled?: boolean;
  /** Labels for internationalization - pass pre-translated strings */
  labels?: DatePickerLabels;
  /** Additional CSS class names */
  className?: string;
}

/**
 * Props for single date selection components
 */
export interface SingleDateProps extends DatePickerBaseProps {
  /** Currently selected date (ISO format: YYYY-MM-DD) */
  value?: ISODateString;
  /** Callback fired when date changes */
  onChange: (date: ISODateString | undefined) => void;
}

/**
 * Props for date range selection components
 */
export interface DateRangeProps extends DatePickerBaseProps {
  /** Start date of the range (ISO format: YYYY-MM-DD) */
  fromDate?: ISODateString;
  /** End date of the range (ISO format: YYYY-MM-DD) */
  toDate?: ISODateString;
  /** Callback fired when range changes */
  onChange: (from: ISODateString | undefined, to: ISODateString | undefined) => void;
}

// ============================================================================
// Internal Component Props
// ============================================================================

/**
 * View mode for calendar dialogs
 */
export type CalendarViewMode = 'calendar' | 'monthYear' | 'input';

/**
 * Props for CalendarGrid component
 */
export interface CalendarGridProps {
  /** Currently displayed month (0-11) */
  currentMonth: number;
  /** Currently displayed year */
  currentYear: number;
  /** Selected date (single selection mode) */
  selectedDate?: Date | null;
  /** Range start date (range selection mode) */
  rangeStart?: Date | null;
  /** Range end date (range selection mode) */
  rangeEnd?: Date | null;
  /** Currently hovered date (for range preview) */
  hoverDate?: Date | null;
  /** Minimum selectable date (ISO format) */
  minDate?: ISODateString;
  /** Maximum selectable date (ISO format) */
  maxDate?: ISODateString;
  /** Callback when a date is selected */
  onDateSelect: (date: Date) => void;
  /** Callback when a date is hovered (range mode) */
  onDateHover?: (date: Date | null) => void;
  /** Enable range selection mode */
  isRangeMode?: boolean;
  /** Labels for internationalization */
  labels?: DatePickerLabels;
}

/**
 * Props for CalendarHeader component
 */
export interface CalendarHeaderProps {
  /** Currently displayed month (0-11) */
  currentMonth: number;
  /** Currently displayed year */
  currentYear: number;
  /** Callback for previous month navigation */
  onPrevMonth: () => void;
  /** Callback for next month navigation */
  onNextMonth: () => void;
  /** Callback when month/year selector is clicked */
  onMonthYearClick?: () => void;
  /** Labels for internationalization */
  labels?: DatePickerLabels;
}

/**
 * Props for MonthYearPicker component
 */
export interface MonthYearPickerProps {
  /** Currently selected month (0-11) */
  currentMonth: number;
  /** Currently selected year */
  currentYear: number;
  /** Callback when month/year is selected */
  onSelect: (month: number, year: number) => void;
  /** Callback to navigate back to calendar view */
  onBack: () => void;
  /** Labels for internationalization */
  labels?: DatePickerLabels;
}

/**
 * Props for DatePickerDialog component
 */
export interface DatePickerDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog should close */
  onClose: () => void;
  /** Currently selected date (ISO format) */
  value?: ISODateString;
  /** Callback when date is confirmed */
  onChange: (date: ISODateString) => void;
  /** Minimum selectable date (ISO format) */
  minDate?: ISODateString;
  /** Maximum selectable date (ISO format) */
  maxDate?: ISODateString;
  /** Dialog title */
  title?: string;
  /** Labels for internationalization */
  labels?: DatePickerLabels;
}

/**
 * Props for DateRangePickerDialog component
 */
export interface DateRangePickerDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog should close */
  onClose: () => void;
  /** Start date of the range (ISO format) */
  fromDate?: ISODateString;
  /** End date of the range (ISO format) */
  toDate?: ISODateString;
  /** Callback when range is confirmed */
  onChange: (from: ISODateString | undefined, to: ISODateString | undefined) => void;
  /** Minimum selectable date (ISO format) */
  minDate?: ISODateString;
  /** Maximum selectable date (ISO format) */
  maxDate?: ISODateString;
  /** Available presets for quick selection */
  presets?: DatePreset[];
  /** Whether to show the presets tab */
  showPresets?: boolean;
  /** Labels for internationalization */
  labels?: DatePickerLabels;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Range information for a specific date cell
 */
export interface DateRangeInfo {
  /** Whether the date is within the selected range */
  inRange: boolean;
  /** Whether this is the start of the range */
  isStart: boolean;
  /** Whether this is the end of the range */
  isEnd: boolean;
  /** Whether this is the first cell of the row */
  isFirstOfRow: boolean;
  /** Whether this is the last cell of the row */
  isLastOfRow: boolean;
}
