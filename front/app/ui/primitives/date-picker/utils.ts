// ============================================================================
// Date Picker Utilities
// ============================================================================
// Pure utility functions for date manipulation and formatting.
// All functions are stateless, well-typed, and thoroughly documented.

import type { DatePickerLabels } from '../types';
import type { ISODateString, DateRangeInfo } from './types';
import { DEFAULT_DATE_PICKER_LABELS } from '../types';
import { MONTH_SHORT_KEYS } from './constants';

// ============================================================================
// Date Generation
// ============================================================================

/**
 * Generates an array of dates for a calendar month grid.
 * Includes null values for empty cells before the first day of the month.
 *
 * @param year - The year (e.g., 2026)
 * @param month - The month (0-11, where 0 is January)
 * @returns Array of Date objects and nulls for empty cells
 *
 * @example
 * ```ts
 * const days = getMonthDays(2026, 0); // January 2026
 * // Returns [null, null, null, null, Date(Jan 1), Date(Jan 2), ...]
 * ```
 */
export function getMonthDays(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDay = firstDay.getDay();

  const days: (Date | null)[] = [];

  // Add empty slots for days before the first day of the month
  for (let i = 0; i < startDay; i++) {
    days.push(null);
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(new Date(year, month, day));
  }

  return days;
}

// ============================================================================
// Date Formatting
// ============================================================================

/**
 * Formats a Date object to ISO 8601 date string (YYYY-MM-DD).
 *
 * @param date - The date to format
 * @returns ISO date string
 *
 * @example
 * ```ts
 * formatDateISO(new Date(2026, 0, 3)) // "2026-01-03"
 * ```
 */
export function formatDateISO(date: Date): ISODateString {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses an ISO date string to a Date object.
 * Returns null for invalid or empty strings.
 *
 * @param dateStr - ISO date string (YYYY-MM-DD)
 * @returns Date object or null if invalid
 *
 * @example
 * ```ts
 * parseISO("2026-01-03") // Date object for Jan 3, 2026
 * parseISO("invalid")    // null
 * parseISO("")           // null
 * ```
 */
export function parseISO(dateStr: string | undefined | null): Date | null {
  if (!dateStr) return null;
  // Append time to avoid timezone issues
  const date = new Date(dateStr + 'T00:00:00');
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Formats a date for display (e.g., "Jan 3, 2026").
 *
 * @param dateStr - ISO date string
 * @param labels - Optional labels for month names
 * @returns Formatted date string for display
 *
 * @example
 * ```ts
 * formatDisplayDate("2026-01-03") // "Jan 3, 2026"
 * ```
 */
export function formatDisplayDate(dateStr: string | undefined, labels: DatePickerLabels = {}): string {
  if (!dateStr) return '';

  const date = parseISO(dateStr);
  if (!date) return '';

  const mergedLabels = { ...DEFAULT_DATE_PICKER_LABELS, ...labels };
  const monthShort = mergedLabels.monthsShort?.[date.getMonth()] ?? MONTH_SHORT_KEYS[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();

  return `${monthShort} ${day}, ${year}`;
}

/**
 * Formats a date in Material Design 3 header style (e.g., "Friday, Jan 3").
 *
 * @param dateStr - ISO date string
 * @param labels - Optional labels for customization
 * @returns M3-style formatted date string
 *
 * @example
 * ```ts
 * formatM3HeaderDate("2026-01-03") // "Saturday, Jan 3"
 * ```
 */
export function formatM3HeaderDate(dateStr: string | undefined, labels: DatePickerLabels = {}): string {
  if (!dateStr) return '';

  const date = parseISO(dateStr);
  if (!date) return '';

  const mergedLabels = { ...DEFAULT_DATE_PICKER_LABELS, ...labels };
  const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const weekday = weekdayNames[date.getDay()];
  const monthShort = mergedLabels.monthsShort?.[date.getMonth()] ?? MONTH_SHORT_KEYS[date.getMonth()];
  const day = date.getDate();

  return `${weekday}, ${monthShort} ${day}`;
}

// ============================================================================
// Date Comparison
// ============================================================================

/**
 * Checks if two dates represent the same calendar day.
 *
 * @param date1 - First date
 * @param date2 - Second date
 * @returns True if both dates are the same day
 *
 * @example
 * ```ts
 * isSameDay(new Date(2026, 0, 3), new Date(2026, 0, 3)) // true
 * isSameDay(new Date(2026, 0, 3), new Date(2026, 0, 4)) // false
 * ```
 */
export function isSameDay(date1: Date | null, date2: Date | null): boolean {
  if (!date1 || !date2) return false;
  return date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth() && date1.getDate() === date2.getDate();
}

/**
 * Safe comparison that handles null/undefined values.
 * Alias for isSameDay with better null handling semantics.
 *
 * @param date - Date to check
 * @param compareTo - Date to compare against (can be null/undefined)
 * @returns True if dates are the same day
 */
export function safeSameDay(date: Date | null, compareTo: Date | null | undefined): boolean {
  if (!compareTo) return false;
  return isSameDay(date, compareTo);
}

/**
 * Checks if a date falls within a range (inclusive).
 *
 * @param date - Date to check
 * @param from - Range start date
 * @param to - Range end date
 * @returns True if date is within the range
 *
 * @example
 * ```ts
 * const jan5 = new Date(2026, 0, 5);
 * const jan1 = new Date(2026, 0, 1);
 * const jan10 = new Date(2026, 0, 10);
 * isDateInRange(jan5, jan1, jan10) // true
 * ```
 */
export function isDateInRange(date: Date, from: Date | null, to: Date | null): boolean {
  if (!from || !to) return false;
  const time = date.getTime();
  return time >= from.getTime() && time <= to.getTime();
}

// ============================================================================
// Date Validation
// ============================================================================

/**
 * Checks if a date is disabled based on min/max constraints.
 *
 * @param date - Date to check
 * @param minDate - Minimum allowed date (ISO string)
 * @param maxDate - Maximum allowed date (ISO string)
 * @returns True if the date should be disabled
 *
 * @example
 * ```ts
 * const jan5 = new Date(2026, 0, 5);
 * isDateDisabled(jan5, "2026-01-10") // true (before min)
 * isDateDisabled(jan5, undefined, "2026-01-01") // true (after max)
 * ```
 */
export function isDateDisabled(date: Date, minDate?: ISODateString, maxDate?: ISODateString): boolean {
  if (minDate) {
    const min = parseISO(minDate);
    if (min && date < min) return true;
  }
  if (maxDate) {
    const max = parseISO(maxDate);
    if (max && date > max) return true;
  }
  return false;
}

// ============================================================================
// Range Utilities
// ============================================================================

/**
 * Gets comprehensive range information for a date cell.
 * Used for styling range selections in the calendar grid.
 *
 * @param date - The date to analyze
 * @param index - The cell index in the calendar grid
 * @param rangeStart - Start of the selected range
 * @param rangeEnd - End of the selected range (or hover date)
 * @returns Object with range positioning information
 */
export function getDateRangeInfo(
  date: Date | null,
  index: number,
  rangeStart: Date | null | undefined,
  rangeEnd: Date | null | undefined
): DateRangeInfo {
  const defaultInfo: DateRangeInfo = {
    inRange: false,
    isStart: false,
    isEnd: false,
    isFirstOfRow: false,
    isLastOfRow: false,
  };

  if (!date) return defaultInfo;

  const isRangeStartDay = safeSameDay(date, rangeStart);
  const isRangeEndDay = safeSameDay(date, rangeEnd);
  const inRange = rangeStart && rangeEnd && isDateInRange(date, rangeStart, rangeEnd);

  const colIndex = index % 7;
  const isFirstOfRow = colIndex === 0;
  const isLastOfRow = colIndex === 6;

  return {
    inRange: inRange ?? false,
    isStart: isRangeStartDay,
    isEnd: isRangeEndDay,
    isFirstOfRow,
    isLastOfRow,
  };
}

// ============================================================================
// Month Navigation
// ============================================================================

/**
 * Calculates the previous month and year.
 *
 * @param month - Current month (0-11)
 * @param year - Current year
 * @returns Object with new month and year
 */
export function getPrevMonth(month: number, year: number): { month: number; year: number } {
  if (month === 0) {
    return { month: 11, year: year - 1 };
  }
  return { month: month - 1, year };
}

/**
 * Calculates the next month and year.
 *
 * @param month - Current month (0-11)
 * @param year - Current year
 * @returns Object with new month and year
 */
export function getNextMonth(month: number, year: number): { month: number; year: number } {
  if (month === 11) {
    return { month: 0, year: year + 1 };
  }
  return { month: month + 1, year };
}

// ============================================================================
// Input Formatting
// ============================================================================

/**
 * Formats raw input into a date string pattern (YYYY-MM-DD).
 * Strips non-numeric characters and adds hyphens at appropriate positions.
 *
 * @param rawValue - Raw input string
 * @returns Formatted date string
 *
 * @example
 * ```ts
 * formatDateInput("20260103") // "2026-01-03"
 * formatDateInput("2026-01")  // "2026-01"
 * ```
 */
export function formatDateInput(rawValue: string): string {
  const digitsOnly = rawValue.replace(/\D/g, '');
  let formatted = '';

  for (let i = 0; i < digitsOnly.length && i < 8; i++) {
    if (i === 4 || i === 6) {
      formatted += '-';
    }
    formatted += digitsOnly[i];
  }

  return formatted;
}
