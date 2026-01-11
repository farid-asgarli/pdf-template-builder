// ============================================================================
// Date Picker Module
// ============================================================================
// Comprehensive date picker components following Material Design 3 principles.
// Supports single date and date range selection with full i18n and accessibility.

// ============================================================================
// Public Components
// ============================================================================

export { DatePicker } from './DatePicker';
export type { DatePickerProps } from './DatePicker';

export { DatePickerDialog } from './DatePickerDialog';

export { DateRangePicker } from './DateRangePicker';
export type { DateRangePickerProps } from './DateRangePicker';

export { DateRangePickerDialog } from './DateRangePickerDialog';

// ============================================================================
// Internal Components (for composition)
// ============================================================================

export { CalendarGrid } from './CalendarGrid';
export { CalendarHeader } from './CalendarHeader';
export { MonthYearPicker } from './MonthYearPicker';

// ============================================================================
// Types
// ============================================================================

export type {
  // Core types
  ISODateString,
  DateRange,
  DatePreset,
  // Component props
  DatePickerBaseProps,
  SingleDateProps,
  DateRangeProps,
  CalendarViewMode,
  CalendarGridProps,
  CalendarHeaderProps,
  MonthYearPickerProps,
  DatePickerDialogProps,
  DateRangePickerDialogProps,
  // Utility types
  DateRangeInfo,
} from './types';

// ============================================================================
// Hooks
// ============================================================================

export {
  useCalendarNavigation,
  useDateSelection,
  useDateRangeSelection,
  useDateInput,
  useDialogState,
  useBodyScrollLock,
  useViewMode,
  usePrevious,
} from './hooks';

export type {
  UseCalendarNavigationOptions,
  UseCalendarNavigationReturn,
  UseDateSelectionOptions,
  UseDateSelectionReturn,
  UseDateRangeSelectionOptions,
  UseDateRangeSelectionReturn,
  UseDateInputOptions,
  UseDateInputReturn,
  UseDialogStateOptions,
  UseDialogStateReturn,
  UseViewModeOptions,
  UseViewModeReturn,
} from './hooks';

// ============================================================================
// Utilities
// ============================================================================

export {
  // Date generation
  getMonthDays,
  // Formatting
  formatDateISO,
  parseISO,
  formatDisplayDate,
  formatM3HeaderDate,
  formatDateInput,
  // Comparison
  isSameDay,
  safeSameDay,
  isDateInRange,
  // Validation
  isDateDisabled,
  // Range utilities
  getDateRangeInfo,
  // Navigation
  getPrevMonth,
  getNextMonth,
} from './utils';

// ============================================================================
// Constants
// ============================================================================

export {
  // Localization keys
  MONTH_KEYS,
  MONTH_SHORT_KEYS,
  WEEKDAY_KEYS,
  PRESET_LABEL_KEYS,
  // Default presets
  DEFAULT_PRESETS,
  // Configuration
  DAYS_IN_WEEK,
  FIRST_DAY_OF_WEEK,
  YEAR_RANGE_OFFSET,
} from './constants';

export type { MonthKey, MonthShortKey, WeekdayKey } from './constants';
