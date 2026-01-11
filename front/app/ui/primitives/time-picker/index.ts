// ============================================================================
// Time Picker Module
// ============================================================================
// A Material Design 3 compliant time picker with clock dial interface.
//
// This module provides:
// - TimePicker: Main input component with dialog
// - TimePickerDialog: Standalone dialog component
// - ClockDial: Clock face for time selection
// - TimeDisplay: Time display header
// - Hooks for custom implementations
// - Utility functions for time manipulation

// ============================================================================
// Components
// ============================================================================

export { TimePicker } from './TimePicker';
export { TimePickerDialog } from './TimePickerDialog';
export { ClockDial } from './ClockDial';
export { TimeDisplay } from './TimeDisplay';

// ============================================================================
// Types
// ============================================================================

export type {
  // Core value types
  Time24String,
  Period,
  TimeMode,
  InputMode,
  ParsedTime,
  Time24,
  // Component props
  TimePickerProps,
  TimePickerDialogProps,
  ClockDialProps,
  TimeDisplayProps,
  TimePickerBaseProps,
  // Labels
  TimePickerLabels,
  // Hook types
  UseTimePickerStateReturn,
  UseTimePickerStateOptions,
  UseClockDialReturn,
  UseBodyScrollLockReturn,
} from './types';

// ============================================================================
// Hooks
// ============================================================================
// Note: useBodyScrollLock, useDialogState, and usePrevious are also exported
// from date-picker with the same interface. They are not re-exported here to
// avoid conflicts - import from date-picker or use the time-picker specific
// hooks directly.

export {
  useTimePickerState,
  useClockDial,
  useAutoModeSwitch,
  useKeyboardNavigation,
  // These are not re-exported to avoid conflicts with date-picker:
  // useBodyScrollLock, useDialogState, usePrevious
} from './hooks';

// For direct access when needed (prefixed to avoid conflicts)
export {
  useBodyScrollLock as useTimePickerBodyScrollLock,
  useDialogState as useTimePickerDialogState,
  usePrevious as useTimePickerPrevious,
} from './hooks';

// ============================================================================
// Utilities
// ============================================================================

export {
  // Parsing
  parseTime,
  parseTime24,
  // Formatting
  formatTime24,
  formatTime24Direct,
  formatDisplayTime,
  formatTimeForA11y,
  // Validation
  clampHour,
  clampMinute,
  isValidTimeString,
  // Conversion
  to24Hour,
  to12Hour,
  // Helpers
  padZero,
  getHourNumbers,
  getMinuteNumbers,
  getClockAngle,
  getClockPosition,
} from './utils';

// ============================================================================
// Constants
// ============================================================================

export {
  // Clock configuration
  HOURS_12,
  HOURS_24,
  MINUTES_IN_HOUR,
  DEGREES_IN_CIRCLE,
  ANGLE_OFFSET,
  DEGREES_PER_HOUR_12,
  DEGREES_PER_HOUR_24,
  DEGREES_PER_MINUTE,
  DEGREES_PER_5_MINUTES,
  // Clock dial dimensions
  DEFAULT_DIAL_SIZE,
  NUMBER_RADIUS_OUTER,
  NUMBER_RADIUS_INNER,
  HAND_LENGTH_OUTER,
  HAND_LENGTH_INNER,
  SELECTION_CIRCLE_SIZE,
  CENTER_DOT_SIZE,
  // Animation & timing
  MODE_SWITCH_DELAY,
  HAND_TRANSITION_DURATION,
  DIALOG_ANIMATION_DURATION,
  // Validation bounds
  MIN_HOUR_12,
  MAX_HOUR_12,
  MIN_HOUR_24,
  MAX_HOUR_24,
  MIN_MINUTE,
  MAX_MINUTE,
  // Default labels
  DEFAULT_TIME_PICKER_LABELS,
  // Keyboard codes
  ARROW_KEYS,
  ACTION_KEYS,
  // CSS classes
  CSS_CLASSES,
} from './constants';
