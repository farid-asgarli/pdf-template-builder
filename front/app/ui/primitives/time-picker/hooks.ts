// ============================================================================
// Time Picker Hooks
// ============================================================================
// Reusable hooks for time picker logic.
// Separates state management from presentation components.

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type {
  TimeMode,
  InputMode,
  Period,
  UseTimePickerStateReturn,
  UseTimePickerStateOptions,
  UseClockDialReturn,
  UseBodyScrollLockReturn,
} from './types';
import { parseTime, formatTime24, clampHour, clampMinute } from './utils';
import { MODE_SWITCH_DELAY, DEGREES_IN_CIRCLE, ANGLE_OFFSET, DEGREES_PER_HOUR_12, DEGREES_PER_MINUTE } from './constants';

// ============================================================================
// useTimePickerState
// ============================================================================

/**
 * Hook for managing time picker state.
 * Handles hour, minute, period, mode, and input mode.
 *
 * @example
 * ```tsx
 * const { hour, minute, period, setHour, setMinute, setPeriod, getFormattedTime } =
 *   useTimePickerState({ initialValue: "14:30" });
 *
 * // Get the formatted 24h time string
 * const time24 = getFormattedTime(); // "14:30"
 * ```
 */
export function useTimePickerState(options: UseTimePickerStateOptions = {}): UseTimePickerStateReturn {
  const { initialValue, defaultMode = 'hour', defaultInputMode = 'dial' } = options;

  // Parse initial value
  const initialParsed = useMemo(() => parseTime(initialValue), [initialValue]);

  // State
  const [hour, setHourState] = useState(initialParsed.hour);
  const [minute, setMinuteState] = useState(initialParsed.minute);
  const [period, setPeriodState] = useState<Period>(initialParsed.period);
  const [mode, setModeState] = useState<TimeMode>(defaultMode);
  const [inputMode, setInputModeState] = useState<InputMode>(defaultInputMode);

  // Validated setters
  const setHour = useCallback((value: number) => {
    setHourState(clampHour(value, false));
  }, []);

  const setMinute = useCallback((value: number) => {
    setMinuteState(clampMinute(value));
  }, []);

  const setPeriod = useCallback((value: Period) => {
    setPeriodState(value);
  }, []);

  const setMode = useCallback((value: TimeMode) => {
    setModeState(value);
  }, []);

  const setInputMode = useCallback((value: InputMode) => {
    setInputModeState(value);
  }, []);

  const toggleInputMode = useCallback(() => {
    setInputModeState((prev) => (prev === 'dial' ? 'keyboard' : 'dial'));
  }, []);

  // Reset to initial or provided value
  const reset = useCallback(
    (value?: string) => {
      const parsed = parseTime(value);
      setHourState(parsed.hour);
      setMinuteState(parsed.minute);
      setPeriodState(parsed.period);
      setModeState(defaultMode);
      setInputModeState(defaultInputMode);
    },
    [defaultMode, defaultInputMode]
  );

  // Get formatted 24h time string
  const getFormattedTime = useCallback(() => formatTime24(hour, minute, period), [hour, minute, period]);

  return {
    hour,
    minute,
    period,
    mode,
    inputMode,
    setHour,
    setMinute,
    setPeriod,
    setMode,
    toggleInputMode,
    setInputMode,
    reset,
    getFormattedTime,
  };
}

// ============================================================================
// useClockDial
// ============================================================================

export interface UseClockDialOptions {
  /** Current mode (hour or minute) */
  mode: TimeMode;
  /** Current value */
  value: number;
  /** Callback when value changes */
  onChange: (value: number) => void;
  /** Callback when selection is complete */
  onSelectionComplete?: () => void;
  /** Whether using 24-hour format */
  use24Hour?: boolean;
}

/**
 * Hook for managing clock dial interactions.
 * Handles pointer events, value calculation, and animations.
 *
 * @example
 * ```tsx
 * const { dialRef, isDragging, handlePointerDown, handlePointerMove, handlePointerUp, getHandAngle } =
 *   useClockDial({ mode: 'hour', value: 10, onChange: setHour });
 * ```
 */
export function useClockDial(options: UseClockDialOptions): UseClockDialReturn {
  const { mode, value, onChange, onSelectionComplete, use24Hour = false } = options;

  const dialRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Calculate angle for current value
  const getHandAngle = useCallback(() => {
    if (mode === 'hour') {
      if (use24Hour) {
        // For 24h mode, hour 0-11 on outer ring, 12-23 on inner ring
        const displayHour = value % 12;
        return (displayHour / 12) * DEGREES_IN_CIRCLE + ANGLE_OFFSET;
      }
      // 12h mode: convert hour to position (12 at top)
      return ((value % 12) / 12) * DEGREES_IN_CIRCLE + ANGLE_OFFSET;
    }
    // Minute mode
    return (value / 60) * DEGREES_IN_CIRCLE + ANGLE_OFFSET;
  }, [mode, value, use24Hour]);

  // Convert pointer position to value
  const positionToValue = useCallback(
    (clientX: number, clientY: number): number => {
      if (!dialRef.current) return value;

      const rect = dialRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const x = clientX - centerX;
      const y = clientY - centerY;

      // Calculate angle from center (0° at top, clockwise)
      let angle = Math.atan2(y, x) * (180 / Math.PI);
      angle = (angle + 90 + 360) % 360;

      if (mode === 'hour') {
        if (use24Hour) {
          // Calculate distance from center for inner/outer ring detection
          const distance = Math.sqrt(x * x + y * y);
          const threshold = rect.width / 4; // Midpoint between inner and outer ring

          let hourValue = Math.round(angle / DEGREES_PER_HOUR_12);
          if (hourValue === 0) hourValue = 12;

          // Inner ring (00, 13-23)
          if (distance < threshold) {
            return hourValue === 12 ? 0 : hourValue + 12;
          }
          // Outer ring (1-12)
          return hourValue;
        }

        // 12h mode
        let hourValue = Math.round(angle / DEGREES_PER_HOUR_12);
        if (hourValue === 0) hourValue = 12;
        return hourValue;
      }

      // Minute mode
      let minuteValue = Math.round(angle / DEGREES_PER_MINUTE);
      if (minuteValue === 60) minuteValue = 0;
      return minuteValue;
    },
    [mode, value, use24Hour]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      setIsDragging(true);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      const newValue = positionToValue(e.clientX, e.clientY);
      onChange(newValue);
    },
    [onChange, positionToValue]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      const newValue = positionToValue(e.clientX, e.clientY);
      onChange(newValue);
    },
    [isDragging, onChange, positionToValue]
  );

  const handlePointerUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      onSelectionComplete?.();
    }
  }, [isDragging, onSelectionComplete]);

  return {
    dialRef,
    isDragging,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    getHandAngle,
  };
}

// ============================================================================
// useAutoModeSwitch
// ============================================================================

export interface UseAutoModeSwitchOptions {
  /** Whether auto-switching is enabled */
  enabled?: boolean;
  /** Delay before switching (ms) */
  delay?: number;
}

/**
 * Hook for auto-switching from hour to minute mode after selection.
 *
 * @example
 * ```tsx
 * const switchToMinute = useAutoModeSwitch({
 *   enabled: true,
 *   delay: 300
 * });
 *
 * // After hour selection
 * switchToMinute(() => setMode('minute'));
 * ```
 */
export function useAutoModeSwitch(options: UseAutoModeSwitchOptions = {}) {
  const { enabled = true, delay = MODE_SWITCH_DELAY } = options;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const scheduleSwitch = useCallback(
    (callback: () => void) => {
      if (!enabled) return;

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(callback, delay);
    },
    [enabled, delay]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return scheduleSwitch;
}

// ============================================================================
// useBodyScrollLock
// ============================================================================

/**
 * Hook for preventing body scroll when a modal is open.
 *
 * @example
 * ```tsx
 * const { lock, unlock } = useBodyScrollLock();
 *
 * useEffect(() => {
 *   if (isOpen) {
 *     lock();
 *   } else {
 *     unlock();
 *   }
 * }, [isOpen, lock, unlock]);
 * ```
 */
export function useBodyScrollLock(): UseBodyScrollLockReturn {
  const scrollPositionRef = useRef(0);

  const lock = useCallback(() => {
    scrollPositionRef.current = window.scrollY;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollPositionRef.current}px`;
    document.body.style.width = '100%';
  }, []);

  const unlock = useCallback(() => {
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo(0, scrollPositionRef.current);
  }, []);

  return { lock, unlock };
}

// ============================================================================
// useDialogState
// ============================================================================

export interface UseDialogStateOptions {
  /** Initial open state */
  defaultOpen?: boolean;
  /** Callback when dialog opens */
  onOpen?: () => void;
  /** Callback when dialog closes */
  onClose?: () => void;
}

export interface UseDialogStateReturn {
  /** Whether dialog is open */
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
 *   onClose: () => console.log('Dialog closed')
 * });
 * ```
 */
export function useDialogState(options: UseDialogStateOptions = {}): UseDialogStateReturn {
  const { defaultOpen = false, onOpen, onClose } = options;
  const [isOpen, setIsOpen] = useState(defaultOpen);

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
// usePrevious
// ============================================================================

/**
 * Hook that returns the previous value of a variable.
 * Useful for comparing current and previous values.
 *
 * @example
 * ```tsx
 * const prevOpen = usePrevious(isOpen);
 *
 * useEffect(() => {
 *   if (isOpen && !prevOpen) {
 *     // Dialog just opened
 *   }
 * }, [isOpen, prevOpen]);
 * ```
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

// ============================================================================
// useKeyboardNavigation
// ============================================================================

export interface UseKeyboardNavigationOptions {
  /** Current mode */
  mode: TimeMode;
  /** Current hour value */
  hour: number;
  /** Current minute value */
  minute: number;
  /** Set hour */
  setHour: (hour: number) => void;
  /** Set minute */
  setMinute: (minute: number) => void;
  /** Whether keyboard navigation is enabled */
  enabled?: boolean;
  /** Use 24-hour format */
  use24Hour?: boolean;
}

/**
 * Hook for keyboard navigation in time picker.
 * Arrow keys increment/decrement values.
 *
 * @example
 * ```tsx
 * const handleKeyDown = useKeyboardNavigation({
 *   mode,
 *   hour,
 *   minute,
 *   setHour,
 *   setMinute
 * });
 *
 * <div onKeyDown={handleKeyDown}>...</div>
 * ```
 */
export function useKeyboardNavigation(options: UseKeyboardNavigationOptions) {
  const { mode, hour, minute, setHour, setMinute, enabled = true, use24Hour = false } = options;

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!enabled) return;

      let delta = 0;
      if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
        delta = 1;
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
        delta = -1;
      }

      if (delta === 0) return;

      e.preventDefault();

      if (mode === 'hour') {
        if (use24Hour) {
          const newHour = (hour + delta + 24) % 24;
          setHour(newHour);
        } else {
          let newHour = hour + delta;
          if (newHour > 12) newHour = 1;
          if (newHour < 1) newHour = 12;
          setHour(newHour);
        }
      } else {
        const newMinute = (minute + delta + 60) % 60;
        setMinute(newMinute);
      }
    },
    [enabled, mode, hour, minute, setHour, setMinute, use24Hour]
  );

  return handleKeyDown;
}
