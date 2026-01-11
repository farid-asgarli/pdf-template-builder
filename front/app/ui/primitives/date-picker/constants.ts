// ============================================================================
// Date Picker Constants
// ============================================================================
// Centralized constants for date picker components.
// Includes i18n keys, default presets, and configuration values.

import type { DatePreset } from './types';
import { formatDateISO } from './utils';

// ============================================================================
// Localization Keys (for external i18n systems)
// ============================================================================

/**
 * Month name keys for i18n lookup
 * @example t(`months.${MONTH_KEYS[0]}`) → "January"
 */
export const MONTH_KEYS = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
] as const;

/**
 * Abbreviated month name keys for i18n lookup
 */
export const MONTH_SHORT_KEYS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'] as const;

/**
 * Weekday name keys for i18n lookup (starting from Sunday)
 */
export const WEEKDAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

// ============================================================================
// Type Exports from Constants
// ============================================================================

export type MonthKey = (typeof MONTH_KEYS)[number];
export type MonthShortKey = (typeof MONTH_SHORT_KEYS)[number];
export type WeekdayKey = (typeof WEEKDAY_KEYS)[number];

// ============================================================================
// Preset Label Keys (for i18n systems)
// ============================================================================

/**
 * Mapping of preset IDs to i18n translation keys
 */
export const PRESET_LABEL_KEYS: Readonly<Record<string, string>> = {
  today: 'datePicker.presetLabels.today',
  yesterday: 'datePicker.presetLabels.yesterday',
  last7d: 'datePicker.presetLabels.last7days',
  last30d: 'datePicker.presetLabels.last30days',
  thisMonth: 'datePicker.presetLabels.thisMonth',
  lastMonth: 'datePicker.presetLabels.lastMonth',
} as const;

// ============================================================================
// Preset Factory Functions
// ============================================================================

/**
 * Creates a "Today" preset
 */
const createTodayPreset = (): DatePreset => ({
  id: 'today',
  label: 'Today',
  getRange: () => {
    const today = formatDateISO(new Date());
    return { fromDate: today, toDate: today };
  },
});

/**
 * Creates a "Yesterday" preset
 */
const createYesterdayPreset = (): DatePreset => ({
  id: 'yesterday',
  label: 'Yesterday',
  getRange: () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = formatDateISO(yesterday);
    return { fromDate: dateStr, toDate: dateStr };
  },
});

/**
 * Creates a "Last N days" preset
 */
const createLastNDaysPreset = (days: number, id: string, label: string): DatePreset => ({
  id,
  label,
  getRange: () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - (days - 1));
    return { fromDate: formatDateISO(start), toDate: formatDateISO(end) };
  },
});

/**
 * Creates a "This Month" preset
 */
const createThisMonthPreset = (): DatePreset => ({
  id: 'thisMonth',
  label: 'This month',
  getRange: () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { fromDate: formatDateISO(start), toDate: formatDateISO(now) };
  },
});

/**
 * Creates a "Last Month" preset
 */
const createLastMonthPreset = (): DatePreset => ({
  id: 'lastMonth',
  label: 'Last month',
  getRange: () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    return { fromDate: formatDateISO(start), toDate: formatDateISO(end) };
  },
});

// ============================================================================
// Default Presets
// ============================================================================

/**
 * Default date range presets for DateRangePicker
 * Labels are in English - consumers should override with translated labels
 */
export const DEFAULT_PRESETS: DatePreset[] = [
  createTodayPreset(),
  createYesterdayPreset(),
  createLastNDaysPreset(7, 'last7d', 'Last 7 days'),
  createLastNDaysPreset(30, 'last30d', 'Last 30 days'),
  createThisMonthPreset(),
  createLastMonthPreset(),
];

// ============================================================================
// Calendar Configuration
// ============================================================================

/** Number of days in a week */
export const DAYS_IN_WEEK = 7;

/** First day of week (0 = Sunday, 1 = Monday, etc.) */
export const FIRST_DAY_OF_WEEK = 0;

/** Number of years to show before/after current year in year picker */
export const YEAR_RANGE_OFFSET = 10;
