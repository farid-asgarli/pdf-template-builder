// ============================================================================
// Time Display Component
// ============================================================================
// Displays and allows editing of the current time selection.
// Supports both dial (tap to select) and keyboard input modes.

import { forwardRef, useCallback, useRef, memo } from 'react';
import { cn } from '@/app/ui';
import type { TimeDisplayProps, Period, TimeMode } from './types';
import { padZero, clampHour, clampMinute } from './utils';
import { MAX_HOUR_12, MAX_HOUR_24, MIN_HOUR_12, MIN_HOUR_24 } from './constants';

// ============================================================================
// Sub-Components
// ============================================================================

interface TimeSegmentButtonProps {
  value: number;
  isActive: boolean;
  onClick: () => void;
  ariaLabel: string;
}

/**
 * Button for selecting hour or minute in dial mode.
 */
const TimeSegmentButton = memo(function TimeSegmentButton({ value, isActive, onClick, ariaLabel }: TimeSegmentButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-4 py-2 text-5xl font-normal rounded-xl transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        isActive ? 'bg-primary-container/60 text-on-surface' : 'text-on-surface-variant/70 hover:bg-on-surface/8'
      )}
      aria-label={ariaLabel}
      aria-pressed={isActive}
    >
      {padZero(value)}
    </button>
  );
});

interface TimeInputFieldProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  max: number;
  min: number;
  onFocus?: () => void;
}

/**
 * Input field for keyboard time entry.
 */
const TimeInputField = memo(function TimeInputField({ value, onChange, label, max, min, onFocus }: TimeInputFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value.replace(/\D/g, '');
      let num = parseInt(val, 10);

      if (isNaN(num)) {
        num = min;
      } else if (num > max) {
        num = max;
      } else if (num < min) {
        num = min;
      }

      onChange(num);
    },
    [onChange, max, min]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow arrow keys to increment/decrement
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        const newValue = value >= max ? min : value + 1;
        onChange(newValue);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const newValue = value <= min ? max : value - 1;
        onChange(newValue);
      }
    },
    [value, onChange, max, min]
  );

  return (
    <div className="flex flex-col items-center">
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={padZero(value)}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={onFocus}
        className={cn(
          'w-24 h-20 text-center text-5xl font-normal rounded-xl',
          'transition-colors outline-none',
          'bg-primary-container/60 text-on-surface',
          'focus:ring-2 focus:ring-primary'
        )}
        maxLength={2}
        aria-label={label}
        autoComplete="off"
      />
      <span className="text-xs text-on-surface-variant mt-1.5">{label}</span>
    </div>
  );
});

interface PeriodToggleProps {
  period: Period;
  onChange: (period: Period) => void;
  labels: { am: string; pm: string };
}

/**
 * AM/PM toggle buttons.
 */
const PeriodToggle = memo(function PeriodToggle({ period, onChange, labels }: PeriodToggleProps) {
  return (
    <div className="flex flex-col ml-2 border-2 border-outline-variant/40 rounded-lg overflow-hidden h-20" role="radiogroup" aria-label="Period">
      <button
        type="button"
        onClick={() => onChange('AM')}
        className={cn(
          'flex-1 px-3 text-sm font-medium transition-colors min-w-11',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary',
          period === 'AM' ? 'bg-tertiary-container text-on-tertiary-container' : 'text-on-surface-variant hover:bg-on-surface/8'
        )}
        role="radio"
        aria-checked={period === 'AM'}
        aria-label={labels.am}
      >
        {labels.am}
      </button>
      <div className="h-px bg-outline-variant/40" aria-hidden="true" />
      <button
        type="button"
        onClick={() => onChange('PM')}
        className={cn(
          'flex-1 px-3 text-sm font-medium transition-colors min-w-11',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary',
          period === 'PM' ? 'bg-tertiary-container text-on-tertiary-container' : 'text-on-surface-variant hover:bg-on-surface/8'
        )}
        role="radio"
        aria-checked={period === 'PM'}
        aria-label={labels.pm}
      >
        {labels.pm}
      </button>
    </div>
  );
});

// ============================================================================
// TimeDisplay Component
// ============================================================================

/**
 * Time display header showing hour:minute and AM/PM toggle.
 * Supports both button (dial) and input (keyboard) modes.
 *
 * @example
 * ```tsx
 * <TimeDisplay
 *   hour={10}
 *   minute={30}
 *   period="AM"
 *   mode="hour"
 *   onModeChange={setMode}
 *   onPeriodChange={setPeriod}
 *   inputMode="dial"
 *   onHourChange={setHour}
 *   onMinuteChange={setMinute}
 *   labels={labels}
 * />
 * ```
 */
export const TimeDisplay = memo(
  forwardRef<HTMLDivElement, TimeDisplayProps>(function TimeDisplay(
    { hour, minute, period, mode, onModeChange, onPeriodChange, inputMode, onHourChange, onMinuteChange, labels, use24Hour = false, className },
    ref
  ) {
    // Handlers for mode changes in dial mode
    const handleHourClick = useCallback(() => {
      onModeChange('hour');
    }, [onModeChange]);

    const handleMinuteClick = useCallback(() => {
      onModeChange('minute');
    }, [onModeChange]);

    // Validation bounds
    const hourMin = use24Hour ? MIN_HOUR_24 : MIN_HOUR_12;
    const hourMax = use24Hour ? MAX_HOUR_24 : MAX_HOUR_12;

    return (
      <div ref={ref} className={cn('flex items-center justify-center gap-1', className)} role="group" aria-label="Time selection">
        {/* Hour */}
        {inputMode === 'keyboard' ? (
          <TimeInputField
            value={hour}
            onChange={onHourChange || (() => {})}
            label={labels.hour}
            min={hourMin}
            max={hourMax}
            onFocus={() => onModeChange('hour')}
          />
        ) : (
          <TimeSegmentButton value={hour} isActive={mode === 'hour'} onClick={handleHourClick} ariaLabel={`${labels.hour}: ${hour}`} />
        )}

        {/* Separator */}
        <span className="text-5xl font-normal text-on-surface self-start mt-2" aria-hidden="true">
          :
        </span>

        {/* Minute */}
        {inputMode === 'keyboard' ? (
          <TimeInputField
            value={minute}
            onChange={onMinuteChange || (() => {})}
            label={labels.minute}
            min={0}
            max={59}
            onFocus={() => onModeChange('minute')}
          />
        ) : (
          <TimeSegmentButton value={minute} isActive={mode === 'minute'} onClick={handleMinuteClick} ariaLabel={`${labels.minute}: ${minute}`} />
        )}

        {/* AM/PM Toggle (only in 12-hour mode) */}
        {!use24Hour && <PeriodToggle period={period} onChange={onPeriodChange} labels={{ am: labels.am, pm: labels.pm }} />}
      </div>
    );
  })
);

TimeDisplay.displayName = 'TimeDisplay';
