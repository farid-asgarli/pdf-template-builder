// ============================================================================
// Time Picker Constants
// ============================================================================
// Centralized constants for the TimePicker module.
// Avoids magic numbers and makes customization easier.

import type { TimePickerLabels } from './types';

// ============================================================================
// Clock Configuration
// ============================================================================

/** Number of hours on a 12-hour clock face */
export const HOURS_12 = 12;

/** Number of hours on a 24-hour clock face */
export const HOURS_24 = 24;

/** Number of minutes in an hour */
export const MINUTES_IN_HOUR = 60;

/** Degrees in a circle */
export const DEGREES_IN_CIRCLE = 360;

/** Starting angle offset (12 o'clock position) */
export const ANGLE_OFFSET = -90;

/** Degrees per hour on 12-hour clock */
export const DEGREES_PER_HOUR_12 = DEGREES_IN_CIRCLE / HOURS_12; // 30

/** Degrees per hour on 24-hour clock inner ring */
export const DEGREES_PER_HOUR_24 = DEGREES_IN_CIRCLE / HOURS_12; // 30 (uses two rings)

/** Degrees per minute */
export const DEGREES_PER_MINUTE = DEGREES_IN_CIRCLE / MINUTES_IN_HOUR; // 6

/** Degrees per 5-minute increment (displayed numbers) */
export const DEGREES_PER_5_MINUTES = DEGREES_IN_CIRCLE / HOURS_12; // 30

// ============================================================================
// Clock Dial Dimensions
// ============================================================================

/** Default dial size in pixels */
export const DEFAULT_DIAL_SIZE = 256; // 64 * 4 = 16rem

/** Radius for number placement on outer ring */
export const NUMBER_RADIUS_OUTER = 95;

/** Radius for number placement on inner ring (24h mode) */
export const NUMBER_RADIUS_INNER = 60;

/** Length of the clock hand in pixels */
export const HAND_LENGTH_OUTER = 80;

/** Length of the clock hand for inner ring (24h mode) */
export const HAND_LENGTH_INNER = 50;

/** Size of the selection circle at hand end */
export const SELECTION_CIRCLE_SIZE = 40; // 10 * 4 = 2.5rem

/** Size of the center dot */
export const CENTER_DOT_SIZE = 8; // 2 * 4 = 0.5rem

// ============================================================================
// Animation & Timing
// ============================================================================

/** Delay before auto-switching from hour to minute mode (ms) */
export const MODE_SWITCH_DELAY = 300;

/** Transition duration for clock hand (ms) */
export const HAND_TRANSITION_DURATION = 75;

/** Dialog animation duration (ms) */
export const DIALOG_ANIMATION_DURATION = 200;

// ============================================================================
// Validation Bounds
// ============================================================================

/** Minimum hour value (12-hour format) */
export const MIN_HOUR_12 = 1;

/** Maximum hour value (12-hour format) */
export const MAX_HOUR_12 = 12;

/** Minimum hour value (24-hour format) */
export const MIN_HOUR_24 = 0;

/** Maximum hour value (24-hour format) */
export const MAX_HOUR_24 = 23;

/** Minimum minute value */
export const MIN_MINUTE = 0;

/** Maximum minute value */
export const MAX_MINUTE = 59;

// ============================================================================
// Default Labels
// ============================================================================

/**
 * Default English labels for TimePicker.
 * Can be overridden by passing custom labels prop.
 */
export const DEFAULT_TIME_PICKER_LABELS: Required<TimePickerLabels> = {
  selectTime: 'Select time',
  clearTime: 'Clear time',
  hour: 'Hour',
  minute: 'Minute',
  switchToKeyboard: 'Switch to keyboard input',
  switchToDial: 'Switch to clock dial',
  cancel: 'Cancel',
  ok: 'OK',
  am: 'AM',
  pm: 'PM',
} as const;

// ============================================================================
// Keyboard Codes
// ============================================================================

/** Arrow key codes for keyboard navigation */
export const ARROW_KEYS = {
  UP: 'ArrowUp',
  DOWN: 'ArrowDown',
  LEFT: 'ArrowLeft',
  RIGHT: 'ArrowRight',
} as const;

/** Action key codes */
export const ACTION_KEYS = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  TAB: 'Tab',
} as const;

// ============================================================================
// CSS Classes (for consistent styling)
// ============================================================================

/** Base CSS classes for time picker components */
export const CSS_CLASSES = {
  /** Root container */
  root: 'time-picker',
  /** Dialog container */
  dialog: 'time-picker-dialog',
  /** Clock dial */
  dial: 'time-picker-dial',
  /** Time display header */
  display: 'time-picker-display',
  /** Error state */
  error: 'time-picker--error',
  /** Disabled state */
  disabled: 'time-picker--disabled',
} as const;
