// ============================================================================
// Time Picker Utilities
// ============================================================================
// Pure utility functions for time parsing, formatting, and validation.
// All functions are side-effect free and thoroughly documented.

import type { Period, ParsedTime, Time24 } from './types';
import { MIN_HOUR_12, MAX_HOUR_12, MIN_HOUR_24, MAX_HOUR_24, MIN_MINUTE, MAX_MINUTE } from './constants';

// ============================================================================
// Parsing Functions
// ============================================================================

/**
 * Parses a 24-hour time string into its components.
 *
 * @param timeStr - Time string in "HH:mm" format, or undefined
 * @returns Parsed time with hour (1-12), minute (0-59), and period
 *
 * @example
 * ```ts
 * parseTime("14:30") // { hour: 2, minute: 30, period: 'PM' }
 * parseTime("09:15") // { hour: 9, minute: 15, period: 'AM' }
 * parseTime("00:00") // { hour: 12, minute: 0, period: 'AM' }
 * parseTime(undefined) // { hour: 12, minute: 0, period: 'AM' }
 * ```
 */
export function parseTime(timeStr: string | undefined): ParsedTime {
  if (!timeStr) {
    return { hour: 12, minute: 0, period: 'AM' };
  }

  const [hourStr, minuteStr] = timeStr.split(':');
  let hour24 = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10) || 0;

  // Validate hour
  if (isNaN(hour24) || hour24 < 0 || hour24 > 23) {
    hour24 = 0;
  }

  // Convert to 12-hour format
  let period: Period = 'AM';
  let hour12: number;

  if (hour24 === 0) {
    hour12 = 12;
    period = 'AM';
  } else if (hour24 === 12) {
    hour12 = 12;
    period = 'PM';
  } else if (hour24 > 12) {
    hour12 = hour24 - 12;
    period = 'PM';
  } else {
    hour12 = hour24;
    period = 'AM';
  }

  return { hour: hour12, minute: clampMinute(minute), period };
}

/**
 * Parses a 24-hour time string into 24-hour components.
 *
 * @param timeStr - Time string in "HH:mm" format
 * @returns Time24 object with hour (0-23) and minute (0-59)
 *
 * @example
 * ```ts
 * parseTime24("14:30") // { hour: 14, minute: 30 }
 * parseTime24("09:15") // { hour: 9, minute: 15 }
 * ```
 */
export function parseTime24(timeStr: string | undefined): Time24 {
  if (!timeStr) {
    return { hour: 0, minute: 0 };
  }

  const [hourStr, minuteStr] = timeStr.split(':');
  const hour = parseInt(hourStr, 10) || 0;
  const minute = parseInt(minuteStr, 10) || 0;

  return {
    hour: clampHour(hour, true),
    minute: clampMinute(minute),
  };
}

// ============================================================================
// Formatting Functions
// ============================================================================

/**
 * Formats time components into a 24-hour time string.
 *
 * @param hour - Hour in 12-hour format (1-12)
 * @param minute - Minute (0-59)
 * @param period - AM or PM
 * @returns Time string in "HH:mm" format (24-hour)
 *
 * @example
 * ```ts
 * formatTime24(2, 30, 'PM')  // "14:30"
 * formatTime24(12, 0, 'AM')  // "00:00"
 * formatTime24(12, 0, 'PM')  // "12:00"
 * formatTime24(9, 5, 'AM')   // "09:05"
 * ```
 */
export function formatTime24(hour: number, minute: number, period: Period): string {
  let hour24: number;

  if (period === 'AM') {
    hour24 = hour === 12 ? 0 : hour;
  } else {
    hour24 = hour === 12 ? 12 : hour + 12;
  }

  return `${padZero(hour24)}:${padZero(minute)}`;
}

/**
 * Formats time components from 24-hour values.
 *
 * @param hour24 - Hour in 24-hour format (0-23)
 * @param minute - Minute (0-59)
 * @returns Time string in "HH:mm" format
 *
 * @example
 * ```ts
 * formatTime24Direct(14, 30) // "14:30"
 * formatTime24Direct(0, 0)   // "00:00"
 * formatTime24Direct(9, 5)   // "09:05"
 * ```
 */
export function formatTime24Direct(hour24: number, minute: number): string {
  return `${padZero(hour24)}:${padZero(minute)}`;
}

/**
 * Formats time for display based on format preference.
 *
 * @param timeStr - Time string in "HH:mm" format (24-hour)
 * @param use24Hour - Whether to display in 24-hour format
 * @returns Formatted display string
 *
 * @example
 * ```ts
 * formatDisplayTime("14:30", true)  // "14:30"
 * formatDisplayTime("14:30", false) // "2:30 PM"
 * formatDisplayTime("09:05", false) // "9:05 AM"
 * formatDisplayTime(undefined, false) // ""
 * ```
 */
export function formatDisplayTime(timeStr: string | undefined, use24Hour: boolean): string {
  if (!timeStr) return '';

  if (use24Hour) {
    // Return as-is for 24-hour format
    const [h, m] = timeStr.split(':');
    return `${h}:${m}`;
  }

  // Convert to 12-hour format
  const { hour, minute, period } = parseTime(timeStr);
  return `${hour}:${padZero(minute)} ${period}`;
}

/**
 * Formats time for accessibility labels.
 *
 * @param hour - Hour value
 * @param minute - Minute value
 * @param period - AM/PM (optional for 24-hour)
 * @param use24Hour - Whether using 24-hour format
 * @returns Accessibility-friendly time string
 *
 * @example
 * ```ts
 * formatTimeForA11y(2, 30, 'PM', false) // "2:30 PM"
 * formatTimeForA11y(14, 30, undefined, true) // "14:30"
 * ```
 */
export function formatTimeForA11y(hour: number, minute: number, period?: Period, use24Hour: boolean = false): string {
  if (use24Hour) {
    return `${padZero(hour)}:${padZero(minute)}`;
  }
  return `${hour}:${padZero(minute)} ${period || 'AM'}`;
}

// ============================================================================
// Validation & Clamping Functions
// ============================================================================

/**
 * Clamps an hour value to valid range.
 *
 * @param hour - Hour value to clamp
 * @param is24Hour - Whether to use 24-hour range
 * @returns Clamped hour value
 *
 * @example
 * ```ts
 * clampHour(13, false) // 12 (max for 12-hour)
 * clampHour(0, false)  // 1 (min for 12-hour)
 * clampHour(25, true)  // 23 (max for 24-hour)
 * clampHour(-1, true)  // 0 (min for 24-hour)
 * ```
 */
export function clampHour(hour: number, is24Hour: boolean): number {
  if (is24Hour) {
    return Math.max(MIN_HOUR_24, Math.min(MAX_HOUR_24, hour));
  }
  return Math.max(MIN_HOUR_12, Math.min(MAX_HOUR_12, hour));
}

/**
 * Clamps a minute value to valid range (0-59).
 *
 * @param minute - Minute value to clamp
 * @returns Clamped minute value
 *
 * @example
 * ```ts
 * clampMinute(60)  // 59
 * clampMinute(-1)  // 0
 * clampMinute(30)  // 30
 * ```
 */
export function clampMinute(minute: number): number {
  return Math.max(MIN_MINUTE, Math.min(MAX_MINUTE, minute));
}

/**
 * Validates if a string is a valid time format (HH:mm).
 *
 * @param timeStr - String to validate
 * @returns True if valid time format
 *
 * @example
 * ```ts
 * isValidTimeString("14:30") // true
 * isValidTimeString("9:30")  // true
 * isValidTimeString("24:00") // false
 * isValidTimeString("14:60") // false
 * isValidTimeString("abc")   // false
 * ```
 */
export function isValidTimeString(timeStr: string): boolean {
  if (!timeStr || typeof timeStr !== 'string') return false;

  const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return false;

  const hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);

  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
}

// ============================================================================
// Conversion Functions
// ============================================================================

/**
 * Converts 12-hour time to 24-hour format.
 *
 * @param hour12 - Hour in 12-hour format (1-12)
 * @param period - AM or PM
 * @returns Hour in 24-hour format (0-23)
 *
 * @example
 * ```ts
 * to24Hour(12, 'AM') // 0
 * to24Hour(12, 'PM') // 12
 * to24Hour(1, 'AM')  // 1
 * to24Hour(1, 'PM')  // 13
 * to24Hour(11, 'PM') // 23
 * ```
 */
export function to24Hour(hour12: number, period: Period): number {
  if (period === 'AM') {
    return hour12 === 12 ? 0 : hour12;
  }
  return hour12 === 12 ? 12 : hour12 + 12;
}

/**
 * Converts 24-hour time to 12-hour format.
 *
 * @param hour24 - Hour in 24-hour format (0-23)
 * @returns Object with hour (1-12) and period
 *
 * @example
 * ```ts
 * to12Hour(0)  // { hour: 12, period: 'AM' }
 * to12Hour(12) // { hour: 12, period: 'PM' }
 * to12Hour(13) // { hour: 1, period: 'PM' }
 * to12Hour(23) // { hour: 11, period: 'PM' }
 * ```
 */
export function to12Hour(hour24: number): { hour: number; period: Period } {
  if (hour24 === 0) {
    return { hour: 12, period: 'AM' };
  }
  if (hour24 === 12) {
    return { hour: 12, period: 'PM' };
  }
  if (hour24 > 12) {
    return { hour: hour24 - 12, period: 'PM' };
  }
  return { hour: hour24, period: 'AM' };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Pads a number with leading zero if needed.
 *
 * @param num - Number to pad
 * @returns Zero-padded string (2 digits)
 *
 * @example
 * ```ts
 * padZero(5)  // "05"
 * padZero(12) // "12"
 * padZero(0)  // "00"
 * ```
 */
export function padZero(num: number): string {
  return String(num).padStart(2, '0');
}

/**
 * Generates array of hour numbers for clock display.
 *
 * @param use24Hour - Whether to generate 24-hour numbers
 * @returns Array of hour numbers
 *
 * @example
 * ```ts
 * getHourNumbers(false) // [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
 * getHourNumbers(true)  // [[0, 13], [1, 14], ...] (outer and inner rings)
 * ```
 */
export function getHourNumbers(use24Hour: boolean = false): number[] {
  if (use24Hour) {
    // For 24-hour mode, return 1-12 for outer ring
    // Inner ring (13-24/0) is handled separately
    return Array.from({ length: 12 }, (_, i) => (i === 0 ? 12 : i));
  }
  // 12-hour mode: 12, 1, 2, ..., 11
  return Array.from({ length: 12 }, (_, i) => (i === 0 ? 12 : i));
}

/**
 * Generates array of minute numbers for clock display (0, 5, 10, ..., 55).
 *
 * @returns Array of minute numbers (multiples of 5)
 *
 * @example
 * ```ts
 * getMinuteNumbers() // [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]
 * ```
 */
export function getMinuteNumbers(): number[] {
  return Array.from({ length: 12 }, (_, i) => i * 5);
}

/**
 * Calculates the angle for a clock position.
 *
 * @param index - Position index (0-11)
 * @returns Angle in degrees (0 at top, clockwise)
 *
 * @example
 * ```ts
 * getClockAngle(0)  // -90 (12 o'clock position)
 * getClockAngle(3)  // 0 (3 o'clock position)
 * getClockAngle(6)  // 90 (6 o'clock position)
 * ```
 */
export function getClockAngle(index: number): number {
  return (index / 12) * 360 - 90;
}

/**
 * Calculates x, y coordinates for a point on the clock face.
 *
 * @param angle - Angle in degrees
 * @param radius - Distance from center
 * @returns Object with x and y coordinates
 *
 * @example
 * ```ts
 * getClockPosition(-90, 100) // { x: 0, y: -100 } (12 o'clock)
 * getClockPosition(0, 100)   // { x: 100, y: 0 } (3 o'clock)
 * ```
 */
export function getClockPosition(angle: number, radius: number): { x: number; y: number } {
  const radians = (angle * Math.PI) / 180;
  return {
    x: Math.cos(radians) * radius,
    y: Math.sin(radians) * radius,
  };
}
