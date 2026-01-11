// ============================================================================
// Date Picker Hooks
// ============================================================================
// Reusable hooks for date picker logic.
// Separates state management from presentation components.

import { useState, useCallback, useRef, useEffect } from 'react';
import { parseISO, isDateDisabled, formatDateInput } from './utils';
import type { ISODateString } from './types';

// ============================================================================
// useCalendarNavigation
// ============================================================================

export interface UseCalendarNavigationOptions {
  /** Initial date to focus on */
  initialDate?: ISODateString;
}

export interface UseCalendarNavigationReturn {
  /** Current displayed month (0-11) */
  currentMonth: number;
  /** Current displayed year */
  currentYear: number;
  /** Navigate to previous month */
  goToPrevMonth: () => void;
  /** Navigate to next month */
  goToNextMonth: () => void;
  /** Navigate to a specific month/year */
  goToDate: (month: number, year: number) => void;
  /** Reset to initial or current date */
  reset: () => void;
}

/**
 * Hook for managing calendar month/year navigation.
 *
 * @example
 * ```tsx
 * const { currentMonth, currentYear, goToPrevMonth, goToNextMonth } = useCalendarNavigation({
 *   initialDate: "2026-01-03"
 * });
 * ```
 */
export function useCalendarNavigation(options: UseCalendarNavigationOptions = {}): UseCalendarNavigationReturn {
  const { initialDate } = options;

  const getInitialState = useCallback(() => {
    const date = initialDate ? parseISO(initialDate) : new Date();
    return {
      month: date?.getMonth() ?? new Date().getMonth(),
      year: date?.getFullYear() ?? new Date().getFullYear(),
    };
  }, [initialDate]);

  const [currentMonth, setCurrentMonth] = useState(() => getInitialState().month);
  const [currentYear, setCurrentYear] = useState(() => getInitialState().year);

  const goToPrevMonth = useCallback(() => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  }, [currentMonth]);

  const goToNextMonth = useCallback(() => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  }, [currentMonth]);

  const goToDate = useCallback((month: number, year: number) => {
    setCurrentMonth(month);
    setCurrentYear(year);
  }, []);

  const reset = useCallback(() => {
    const { month, year } = getInitialState();
    setCurrentMonth(month);
    setCurrentYear(year);
  }, [getInitialState]);

  return {
    currentMonth,
    currentYear,
    goToPrevMonth,
    goToNextMonth,
    goToDate,
    reset,
  };
}

// ============================================================================
// useDateSelection
// ============================================================================

export interface UseDateSelectionOptions {
  /** Initial selected date */
  initialDate?: ISODateString;
  /** Minimum selectable date */
  minDate?: ISODateString;
  /** Maximum selectable date */
  maxDate?: ISODateString;
  /** Callback when date is selected */
  onSelect?: (date: Date) => void;
}

export interface UseDateSelectionReturn {
  /** Currently selected date */
  selectedDate: Date | null;
  /** Select a date */
  selectDate: (date: Date) => void;
  /** Clear selection */
  clearSelection: () => void;
  /** Check if a date can be selected */
  canSelect: (date: Date) => boolean;
}

/**
 * Hook for managing single date selection.
 *
 * @example
 * ```tsx
 * const { selectedDate, selectDate, canSelect } = useDateSelection({
 *   initialDate: "2026-01-03",
 *   minDate: "2026-01-01",
 *   maxDate: "2026-12-31"
 * });
 * ```
 */
export function useDateSelection(options: UseDateSelectionOptions = {}): UseDateSelectionReturn {
  const { initialDate, minDate, maxDate, onSelect } = options;

  const [selectedDate, setSelectedDate] = useState<Date | null>(() => (initialDate ? parseISO(initialDate) : null));

  const canSelect = useCallback((date: Date) => !isDateDisabled(date, minDate, maxDate), [minDate, maxDate]);

  const selectDate = useCallback(
    (date: Date) => {
      if (canSelect(date)) {
        setSelectedDate(date);
        onSelect?.(date);
      }
    },
    [canSelect, onSelect]
  );

  const clearSelection = useCallback(() => {
    setSelectedDate(null);
  }, []);

  return {
    selectedDate,
    selectDate,
    clearSelection,
    canSelect,
  };
}

// ============================================================================
// useDateRangeSelection
// ============================================================================

export interface UseDateRangeSelectionOptions {
  /** Initial start date */
  initialFrom?: ISODateString;
  /** Initial end date */
  initialTo?: ISODateString;
  /** Minimum selectable date */
  minDate?: ISODateString;
  /** Maximum selectable date */
  maxDate?: ISODateString;
  /** Callback when range is selected */
  onSelect?: (from: Date, to: Date | null) => void;
}

export interface UseDateRangeSelectionReturn {
  /** Start of the selected range */
  rangeStart: Date | null;
  /** End of the selected range */
  rangeEnd: Date | null;
  /** Currently hovered date */
  hoverDate: Date | null;
  /** Handle date selection (builds range progressively) */
  selectDate: (date: Date) => void;
  /** Set the hover date for preview */
  setHoverDate: (date: Date | null) => void;
  /** Clear the entire selection */
  clearSelection: () => void;
  /** Set a complete range at once */
  setRange: (from: Date | null, to: Date | null) => void;
  /** Check if a date can be selected */
  canSelect: (date: Date) => boolean;
}

/**
 * Hook for managing date range selection.
 *
 * @example
 * ```tsx
 * const { rangeStart, rangeEnd, selectDate, hoverDate, setHoverDate } = useDateRangeSelection({
 *   initialFrom: "2026-01-01",
 *   initialTo: "2026-01-07"
 * });
 * ```
 */
export function useDateRangeSelection(options: UseDateRangeSelectionOptions = {}): UseDateRangeSelectionReturn {
  const { initialFrom, initialTo, minDate, maxDate, onSelect } = options;

  const [rangeStart, setRangeStart] = useState<Date | null>(() => (initialFrom ? parseISO(initialFrom) : null));
  const [rangeEnd, setRangeEnd] = useState<Date | null>(() => (initialTo ? parseISO(initialTo) : null));
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  const canSelect = useCallback((date: Date) => !isDateDisabled(date, minDate, maxDate), [minDate, maxDate]);

  const selectDate = useCallback(
    (date: Date) => {
      if (!canSelect(date)) return;

      if (!rangeStart || (rangeStart && rangeEnd)) {
        // Start new selection
        setRangeStart(date);
        setRangeEnd(null);
        onSelect?.(date, null);
      } else {
        // Complete the selection
        if (date < rangeStart) {
          setRangeEnd(rangeStart);
          setRangeStart(date);
          onSelect?.(date, rangeStart);
        } else {
          setRangeEnd(date);
          onSelect?.(rangeStart, date);
        }
      }
    },
    [rangeStart, rangeEnd, canSelect, onSelect]
  );

  const clearSelection = useCallback(() => {
    setRangeStart(null);
    setRangeEnd(null);
    setHoverDate(null);
  }, []);

  const setRange = useCallback((from: Date | null, to: Date | null) => {
    setRangeStart(from);
    setRangeEnd(to);
  }, []);

  return {
    rangeStart,
    rangeEnd,
    hoverDate,
    selectDate,
    setHoverDate,
    clearSelection,
    setRange,
    canSelect,
  };
}

// ============================================================================
// useDateInput
// ============================================================================

export interface UseDateInputOptions {
  /** Initial value */
  initialValue?: ISODateString;
  /** Minimum selectable date */
  minDate?: ISODateString;
  /** Maximum selectable date */
  maxDate?: ISODateString;
  /** Callback when a valid date is entered */
  onValidDate?: (date: Date) => void;
}

export interface UseDateInputReturn {
  /** Current input value */
  inputValue: string;
  /** Whether the current value has an error */
  hasError: boolean;
  /** Handle input change */
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Set input value directly */
  setValue: (value: string) => void;
  /** Reset to initial value */
  reset: () => void;
}

/**
 * Hook for managing date input field with validation.
 *
 * @example
 * ```tsx
 * const { inputValue, hasError, handleChange } = useDateInput({
 *   initialValue: "2026-01-03",
 *   onValidDate: (date) => console.log("Valid date:", date)
 * });
 * ```
 */
export function useDateInput(options: UseDateInputOptions = {}): UseDateInputReturn {
  const { initialValue = '', minDate, maxDate, onValidDate } = options;

  const [inputValue, setInputValue] = useState(initialValue);
  const [hasError, setHasError] = useState(false);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatDateInput(e.target.value);
      setInputValue(formatted);

      if (formatted.length === 10) {
        const parsed = parseISO(formatted);
        if (parsed && !isDateDisabled(parsed, minDate, maxDate)) {
          setHasError(false);
          onValidDate?.(parsed);
        } else {
          setHasError(true);
        }
      } else {
        setHasError(false);
      }
    },
    [minDate, maxDate, onValidDate]
  );

  const setValue = useCallback((value: string) => {
    setInputValue(value);
    setHasError(false);
  }, []);

  const reset = useCallback(() => {
    setInputValue(initialValue);
    setHasError(false);
  }, [initialValue]);

  return {
    inputValue,
    hasError,
    handleChange,
    setValue,
    reset,
  };
}

// ============================================================================
// useDialogState
// ============================================================================

export interface UseDialogStateOptions {
  /** Initial open state */
  initialOpen?: boolean;
  /** Callback when dialog opens */
  onOpen?: () => void;
  /** Callback when dialog closes */
  onClose?: () => void;
}

export interface UseDialogStateReturn {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Open the dialog */
  open: () => void;
  /** Close the dialog */
  close: () => void;
  /** Toggle the dialog */
  toggle: () => void;
}

/**
 * Hook for managing dialog open/close state.
 *
 * @example
 * ```tsx
 * const { isOpen, open, close } = useDialogState({
 *   onOpen: () => console.log("Dialog opened")
 * });
 * ```
 */
export function useDialogState(options: UseDialogStateOptions = {}): UseDialogStateReturn {
  const { initialOpen = false, onOpen, onClose } = options;

  const [isOpen, setIsOpen] = useState(initialOpen);

  const open = useCallback(() => {
    setIsOpen(true);
    onOpen?.();
  }, [onOpen]);

  const close = useCallback(() => {
    setIsOpen(false);
    onClose?.();
  }, [onClose]);

  const toggle = useCallback(() => {
    setIsOpen((prev) => {
      if (prev) {
        onClose?.();
      } else {
        onOpen?.();
      }
      return !prev;
    });
  }, [onOpen, onClose]);

  return { isOpen, open, close, toggle };
}

// ============================================================================
// useBodyScrollLock
// ============================================================================

/**
 * Hook to lock body scroll when a modal is open.
 *
 * @param isLocked - Whether scroll should be locked
 *
 * @example
 * ```tsx
 * useBodyScrollLock(isDialogOpen);
 * ```
 */
export function useBodyScrollLock(isLocked: boolean): void {
  useEffect(() => {
    if (isLocked) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isLocked]);
}

// ============================================================================
// useViewMode
// ============================================================================

export interface UseViewModeOptions<T extends string> {
  /** Initial view mode */
  initialMode: T;
}

export interface UseViewModeReturn<T extends string> {
  /** Current view mode */
  viewMode: T;
  /** Set view mode */
  setViewMode: (mode: T) => void;
  /** Check if current mode matches */
  isMode: (mode: T) => boolean;
}

/**
 * Hook for managing view mode state.
 *
 * @example
 * ```tsx
 * const { viewMode, setViewMode, isMode } = useViewMode({
 *   initialMode: 'calendar'
 * });
 * ```
 */
export function useViewMode<T extends string>(options: UseViewModeOptions<T>): UseViewModeReturn<T> {
  const { initialMode } = options;
  const [viewMode, setViewMode] = useState<T>(initialMode);

  const isMode = useCallback((mode: T) => viewMode === mode, [viewMode]);

  return { viewMode, setViewMode, isMode };
}

// ============================================================================
// usePrevious
// ============================================================================

/**
 * Hook to track the previous value of a variable.
 *
 * @param value - The value to track
 * @returns The previous value
 *
 * @example
 * ```tsx
 * const prevCount = usePrevious(count);
 * ```
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}
