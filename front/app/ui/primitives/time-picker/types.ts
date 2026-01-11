// ============================================================================
// Time Picker Types
// ============================================================================
// Comprehensive type definitions for the TimePicker module.
// All types are exported for external use and composition.

// ============================================================================
// Core Value Types
// ============================================================================

/**
 * Time string in 24-hour format (HH:mm).
 * Examples: "09:30", "14:00", "00:00", "23:59"
 */
export type Time24String = `${string}:${string}`;

/**
 * Time period (meridiem) for 12-hour format.
 */
export type Period = 'AM' | 'PM';

/**
 * Current selection mode in the time picker.
 * - 'hour': User is selecting the hour
 * - 'minute': User is selecting the minute
 */
export type TimeMode = 'hour' | 'minute';

/**
 * Input mode for time selection.
 * - 'dial': Clock dial interface (touch-friendly)
 * - 'keyboard': Direct numeric input
 */
export type InputMode = 'dial' | 'keyboard';

// ============================================================================
// Parsed Time Structure
// ============================================================================

/**
 * Represents parsed time components.
 */
export interface ParsedTime {
  /** Hour in 12-hour format (1-12) */
  hour: number;
  /** Minute (0-59) */
  minute: number;
  /** Period (AM/PM) */
  period: Period;
}

/**
 * Represents time in 24-hour format components.
 */
export interface Time24 {
  /** Hour in 24-hour format (0-23) */
  hour: number;
  /** Minute (0-59) */
  minute: number;
}

// ============================================================================
// Component Props Types
// ============================================================================

/**
 * Base props shared across time picker components.
 */
export interface TimePickerBaseProps {
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Additional CSS class names */
  className?: string;
}

/**
 * Props for the main TimePicker component.
 */
export interface TimePickerProps extends TimePickerBaseProps {
  /** Selected time value (HH:mm format in 24h) */
  value?: string;
  /** Callback when time changes */
  onChange: (time: string | undefined) => void;
  /** Placeholder text when no value is selected */
  placeholder?: string;
  /** Use 24-hour format display (default: false, uses 12-hour with AM/PM) */
  use24Hour?: boolean;
  /** Label for the input */
  label?: string;
  /** Error message to display */
  error?: string;
  /** Helper text displayed below the input */
  helperText?: string;
  /** Labels for internationalization - pass pre-translated strings */
  labels?: TimePickerLabels;
  /** ID for the input element */
  id?: string;
  /** Name attribute for form submission */
  name?: string;
  /** Whether the field is required */
  required?: boolean;
}

/**
 * Props for the TimePickerDialog component.
 */
export interface TimePickerDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog closes */
  onClose: () => void;
  /** Current time value (HH:mm format) */
  value?: string;
  /** Callback when time is confirmed */
  onChange: (time: string) => void;
  /** Dialog title */
  title?: string;
  /** Labels for internationalization */
  labels: Required<TimePickerLabels>;
  /** Use 24-hour format for the clock */
  use24Hour?: boolean;
}

/**
 * Props for the ClockDial component.
 */
export interface ClockDialProps {
  /** Current selection mode (hour or minute) */
  mode: TimeMode;
  /** Currently selected value (hour: 1-12, minute: 0-59) */
  value: number;
  /** Callback when value changes */
  onChange: (value: number) => void;
  /** Callback when selection is complete (pointer up) */
  onSelectionComplete?: () => void;
  /** Whether the dial is disabled */
  disabled?: boolean;
  /** Additional CSS class names */
  className?: string;
  /** Use 24-hour format for hours (shows 0-23) */
  use24Hour?: boolean;
}

/**
 * Props for the TimeDisplay component.
 */
export interface TimeDisplayProps {
  /** Current hour (1-12 for 12h, 0-23 for 24h) */
  hour: number;
  /** Current minute (0-59) */
  minute: number;
  /** Current period (only used in 12-hour mode) */
  period: Period;
  /** Current selection mode */
  mode: TimeMode;
  /** Callback when mode changes */
  onModeChange: (mode: TimeMode) => void;
  /** Callback when period changes */
  onPeriodChange: (period: Period) => void;
  /** Current input mode */
  inputMode: InputMode;
  /** Callback when hour changes (keyboard input) */
  onHourChange?: (hour: number) => void;
  /** Callback when minute changes (keyboard input) */
  onMinuteChange?: (minute: number) => void;
  /** Labels for internationalization */
  labels: Required<TimePickerLabels>;
  /** Use 24-hour format */
  use24Hour?: boolean;
  /** Additional CSS class names */
  className?: string;
}

// ============================================================================
// Labels & Internationalization
// ============================================================================

/**
 * Labels for TimePicker internationalization.
 * All labels are optional - defaults are provided.
 * Pass pre-translated strings from your i18n solution.
 */
export interface TimePickerLabels {
  /** Label for the select time button/title */
  selectTime?: string;
  /** Label for clear time button (accessibility) */
  clearTime?: string;
  /** Label for hour input/display */
  hour?: string;
  /** Label for minute input/display */
  minute?: string;
  /** Label for switching to keyboard input (accessibility) */
  switchToKeyboard?: string;
  /** Label for switching to dial input (accessibility) */
  switchToDial?: string;
  /** Label for cancel button */
  cancel?: string;
  /** Label for OK/confirm button */
  ok?: string;
  /** Label for AM period */
  am?: string;
  /** Label for PM period */
  pm?: string;
}

// ============================================================================
// Hook Return Types
// ============================================================================

/**
 * Return type for useTimePickerState hook.
 */
export interface UseTimePickerStateReturn {
  /** Current hour value */
  hour: number;
  /** Current minute value */
  minute: number;
  /** Current period */
  period: Period;
  /** Current selection mode */
  mode: TimeMode;
  /** Current input mode */
  inputMode: InputMode;
  /** Set hour value */
  setHour: (hour: number) => void;
  /** Set minute value */
  setMinute: (minute: number) => void;
  /** Set period */
  setPeriod: (period: Period) => void;
  /** Set selection mode */
  setMode: (mode: TimeMode) => void;
  /** Toggle input mode between dial and keyboard */
  toggleInputMode: () => void;
  /** Set input mode directly */
  setInputMode: (mode: InputMode) => void;
  /** Reset to initial values */
  reset: (value?: string) => void;
  /** Get formatted time string */
  getFormattedTime: () => string;
}

/**
 * Options for useTimePickerState hook.
 */
export interface UseTimePickerStateOptions {
  /** Initial time value (HH:mm format) */
  initialValue?: string;
  /** Default mode */
  defaultMode?: TimeMode;
  /** Default input mode */
  defaultInputMode?: InputMode;
}

/**
 * Return type for useClockDial hook.
 */
export interface UseClockDialReturn {
  /** Ref for the dial element */
  dialRef: React.RefObject<HTMLDivElement | null>;
  /** Whether user is currently dragging */
  isDragging: boolean;
  /** Handle pointer down event */
  handlePointerDown: (e: React.PointerEvent) => void;
  /** Handle pointer move event */
  handlePointerMove: (e: React.PointerEvent) => void;
  /** Handle pointer up event */
  handlePointerUp: () => void;
  /** Calculate angle for the clock hand */
  getHandAngle: () => number;
}

/**
 * Return type for useBodyScrollLock hook.
 */
export interface UseBodyScrollLockReturn {
  /** Lock body scroll */
  lock: () => void;
  /** Unlock body scroll */
  unlock: () => void;
}
