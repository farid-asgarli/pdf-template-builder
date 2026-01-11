/* eslint-disable @typescript-eslint/no-empty-object-type */
export type ViewMode = 'grid' | 'list';

// ============================================================================
// Translation-Agnostic Label Types
// ============================================================================
// These types allow components to receive pre-translated strings from the consuming app.
// This makes ui-primitives work with ANY i18n solution (react-i18next, next-intl, etc.)

/**
 * Common labels used across multiple components
 */
export interface CommonLabels {
  close?: string;
  cancel?: string;
  confirm?: string;
  ok?: string;
  save?: string;
  clear?: string;
  search?: string;
  select?: string;
  noResults?: string;
}

/**
 * Labels for Select component
 */
export interface SelectLabels {
  placeholder?: string;
  searchPlaceholder?: string;
  noOptionsFound?: string;
}

/**
 * Labels for SearchInput component
 */
export interface SearchInputLabels {
  placeholder?: string;
  clearSearch?: string;
}

/**
 * Labels for TimePicker component
 */
export interface TimePickerLabels {
  selectTime?: string;
  clearTime?: string;
  hour?: string;
  minute?: string;
  switchToKeyboard?: string;
  switchToDial?: string;
  cancel?: string;
}

/**
 * Labels for DatePicker component
 */
export interface DatePickerLabels {
  selectDate?: string;
  selectDateRange?: string;
  clearDate?: string;
  dateRange?: string;
  clearDateFilter?: string;
  today?: string;
  cancel?: string;
  ok?: string;
  apply?: string;
  close?: string;
  presets?: string;
  custom?: string;
  backToCalendar?: string;
  // Month names (full)
  months?: string[];
  // Month names (abbreviated)
  monthsShort?: string[];
  // Day names (abbreviated - Su, Mo, Tu, etc.)
  daysShort?: string[];
}

/**
 * Labels for Dialog component
 */
export interface DialogLabels {
  close?: string;
}

/**
 * Labels for Drawer component
 */
export interface DrawerLabels {
  close?: string;
}

/**
 * Labels for OverlayHeader component
 */
export interface OverlayHeaderLabels {
  close?: string;
}

/**
 * Labels for EmptyState component
 * Note: EmptyState is complex - preset variants should be implemented in consuming apps
 */
export interface EmptyStateLabels {
  // Base labels passed via props: title, description, action.label
}

// ============================================================================
// Default Labels (English)
// ============================================================================
// These are provided as convenience defaults. Apps can override with their own translations.

export const DEFAULT_COMMON_LABELS: Required<CommonLabels> = {
  close: 'Close',
  cancel: 'Cancel',
  confirm: 'Confirm',
  ok: 'OK',
  save: 'Save',
  clear: 'Clear',
  search: 'Search',
  select: 'Select',
  noResults: 'No results found',
};

export const DEFAULT_SELECT_LABELS: Required<SelectLabels> = {
  placeholder: 'Select...',
  searchPlaceholder: 'Search...',
  noOptionsFound: 'No options found',
};

export const DEFAULT_SEARCH_INPUT_LABELS: Required<SearchInputLabels> = {
  placeholder: 'Search...',
  clearSearch: 'Clear search',
};

export const DEFAULT_TIME_PICKER_LABELS: Required<TimePickerLabels> = {
  selectTime: 'Select time',
  clearTime: 'Clear time',
  hour: 'Hour',
  minute: 'Minute',
  switchToKeyboard: 'Switch to keyboard input',
  switchToDial: 'Switch to dial input',
  cancel: 'Cancel',
};

export const DEFAULT_DATE_PICKER_LABELS: Required<DatePickerLabels> = {
  selectDate: 'Select date',
  selectDateRange: 'Select date range',
  clearDate: 'Clear date',
  dateRange: 'Date range',
  clearDateFilter: 'Clear date filter',
  today: 'Today',
  cancel: 'Cancel',
  ok: 'OK',
  apply: 'Apply',
  close: 'Close',
  presets: 'Presets',
  custom: 'Custom',
  backToCalendar: 'Back to calendar',
  months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  monthsShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  daysShort: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
};

export const DEFAULT_DIALOG_LABELS: Required<DialogLabels> = {
  close: 'Close',
};

export const DEFAULT_DRAWER_LABELS: Required<DrawerLabels> = {
  close: 'Close drawer',
};

export const DEFAULT_OVERLAY_HEADER_LABELS: Required<OverlayHeaderLabels> = {
  close: 'Close',
};
