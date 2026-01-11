// ============================================================================
// Clock Dial Component
// ============================================================================
// A circular clock interface for selecting hours or minutes.
// Follows Material Design 3 principles with full accessibility support.

import { forwardRef, useMemo, useCallback, memo } from 'react';
import { cn } from '@/app/ui';
import type { ClockDialProps, TimeMode } from './types';
import { useClockDial } from './hooks';
import { getHourNumbers, getMinuteNumbers, getClockAngle, getClockPosition, padZero } from './utils';
import { NUMBER_RADIUS_OUTER, HAND_LENGTH_OUTER, SELECTION_CIRCLE_SIZE, HAND_TRANSITION_DURATION } from './constants';

// ============================================================================
// Sub-Components
// ============================================================================

interface ClockNumberProps {
  value: number;
  angle: number;
  radius: number;
  isSelected: boolean;
  onClick: (value: number) => void;
  mode: TimeMode;
}

/**
 * Individual number button on the clock face.
 */
const ClockNumber = memo(function ClockNumber({ value, angle, radius, isSelected, onClick, mode }: ClockNumberProps) {
  const { x, y } = getClockPosition(angle, radius);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onClick(value);
    },
    [onClick, value]
  );

  // Format display value
  const displayValue = mode === 'minute' && value === 0 ? '00' : String(value);

  return (
    <button
      type="button"
      className={cn(
        'absolute w-10 h-10 rounded-full flex items-center justify-center',
        'text-sm font-medium transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        isSelected
          ? 'text-transparent' // Hide when selected (selection circle shows value)
          : 'text-on-surface hover:bg-on-surface/8 active:bg-on-surface/12'
      )}
      style={{
        left: `calc(50% + ${x}px)`,
        top: `calc(50% + ${y}px)`,
        transform: 'translate(-50%, -50%)',
      }}
      onClick={handleClick}
      tabIndex={-1} // Navigation handled by parent
      aria-hidden={isSelected} // Screen reader uses selection circle
    >
      {displayValue}
    </button>
  );
});

interface ClockHandProps {
  angle: number;
  length: number;
  value: number;
  mode: TimeMode;
  isDragging: boolean;
}

/**
 * Clock hand with selection indicator at the end.
 */
const ClockHand = memo(function ClockHand({ angle, length, value, mode, isDragging }: ClockHandProps) {
  const { x, y } = getClockPosition(angle, length);

  // Format display value
  const displayValue = mode === 'minute' && value === 0 ? '00' : mode === 'hour' && value === 0 ? '12' : String(value);

  return (
    <>
      {/* Hand line */}
      <div
        className={cn('absolute top-1/2 left-1/2 origin-left h-0.5 bg-primary', !isDragging && 'transition-transform')}
        style={{
          width: `${length}px`,
          transform: `translate(0, -50%) rotate(${angle}deg)`,
          transitionDuration: isDragging ? '0ms' : `${HAND_TRANSITION_DURATION}ms`,
        }}
        aria-hidden="true"
      />

      {/* Selection circle at hand end */}
      <div
        className={cn('absolute rounded-full bg-primary flex items-center justify-center', !isDragging && 'transition-all')}
        style={{
          width: `${SELECTION_CIRCLE_SIZE}px`,
          height: `${SELECTION_CIRCLE_SIZE}px`,
          left: `calc(50% + ${x}px)`,
          top: `calc(50% + ${y}px)`,
          transform: 'translate(-50%, -50%)',
          transitionDuration: isDragging ? '0ms' : `${HAND_TRANSITION_DURATION}ms`,
        }}
        role="status"
        aria-live="polite"
        aria-label={`Selected: ${displayValue}`}
      >
        <span className="text-sm font-medium text-on-primary">{displayValue}</span>
      </div>
    </>
  );
});

// ============================================================================
// ClockDial Component
// ============================================================================

/**
 * A circular clock dial for selecting time values.
 *
 * Features:
 * - Touch and mouse drag support
 * - Keyboard navigation
 * - Smooth animations
 * - Full accessibility
 *
 * @example
 * ```tsx
 * <ClockDial
 *   mode="hour"
 *   value={10}
 *   onChange={setHour}
 *   onSelectionComplete={() => setMode('minute')}
 * />
 * ```
 */
export const ClockDial = memo(
  forwardRef<HTMLDivElement, ClockDialProps>(function ClockDial(
    { mode, value, onChange, onSelectionComplete, disabled = false, className, use24Hour = false },
    ref
  ) {
    // Use the clock dial hook for interaction logic
    const { dialRef, isDragging, handlePointerDown, handlePointerMove, handlePointerUp, getHandAngle } = useClockDial({
      mode,
      value,
      onChange,
      onSelectionComplete,
      use24Hour,
    });

    // Generate numbers for the clock face
    const numbers = useMemo(() => {
      return mode === 'hour' ? getHourNumbers(use24Hour) : getMinuteNumbers();
    }, [mode, use24Hour]);

    // Check if a value is selected
    const isValueSelected = useCallback(
      (num: number): boolean => {
        if (mode === 'hour') {
          return value === num || (value === 0 && num === 12);
        }
        return value === num;
      },
      [mode, value]
    );

    const handAngle = getHandAngle();

    return (
      <div
        ref={(node) => {
          // Merge refs
          (dialRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        className={cn(
          'relative w-64 h-64 rounded-full',
          'bg-surface-container-highest',
          'select-none touch-none',
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
          className
        )}
        onPointerDown={disabled ? undefined : handlePointerDown}
        onPointerMove={disabled ? undefined : handlePointerMove}
        onPointerUp={disabled ? undefined : handlePointerUp}
        onPointerLeave={disabled ? undefined : handlePointerUp}
        role="slider"
        aria-valuemin={mode === 'hour' ? 1 : 0}
        aria-valuemax={mode === 'hour' ? 12 : 59}
        aria-valuenow={value}
        aria-valuetext={mode === 'hour' ? `${value} o'clock` : `${value} minutes`}
        aria-label={mode === 'hour' ? 'Select hour' : 'Select minute'}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
      >
        {/* Center dot */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary z-10" aria-hidden="true" />

        {/* Clock hand with selection circle */}
        <ClockHand angle={handAngle} length={HAND_LENGTH_OUTER} value={value} mode={mode} isDragging={isDragging} />

        {/* Numbers around the dial */}
        {numbers.map((num, index) => {
          const angle = getClockAngle(index);
          return (
            <ClockNumber
              key={num}
              value={num}
              angle={angle}
              radius={NUMBER_RADIUS_OUTER}
              isSelected={isValueSelected(num)}
              onClick={onChange}
              mode={mode}
            />
          );
        })}
      </div>
    );
  })
);

ClockDial.displayName = 'ClockDial';
