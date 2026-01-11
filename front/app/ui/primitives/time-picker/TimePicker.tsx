// ============================================================================
// TimePicker Component
// ============================================================================
// A time input component with dialog picker following Material Design 3.
// Translation-agnostic: all text comes from labels prop.

import { forwardRef, useCallback, memo, useId } from 'react';
import { Clock, X } from 'lucide-react';
import { cn } from '@/app/ui';
import { IconButton } from '../buttons';
import { TimePickerDialog } from './TimePickerDialog';
import type { TimePickerProps } from './types';
import { useDialogState } from './hooks';
import { formatDisplayTime } from './utils';
import { DEFAULT_TIME_PICKER_LABELS } from './constants';

// ============================================================================
// TimePicker Component
// ============================================================================

/**
 * A Material Design 3 time picker input with dialog.
 *
 * Features:
 * - Click to open time picker dialog
 * - Support for 12-hour (AM/PM) and 24-hour formats
 * - Clear button when value is set
 * - Full accessibility support
 * - Translation-agnostic (pass pre-translated labels)
 *
 * @example
 * ```tsx
 * const [time, setTime] = useState<string>();
 *
 * <TimePicker
 *   value={time}
 *   onChange={setTime}
 *   label="Meeting Time"
 *   placeholder="Select a time"
 * />
 * ```
 *
 * @example
 * // With 24-hour format and custom labels
 * <TimePicker
 *   value={time}
 *   onChange={setTime}
 *   use24Hour
 *   labels={{
 *     selectTime: t('time.select'),
 *     clearTime: t('time.clear'),
 *     hour: t('time.hour'),
 *     minute: t('time.minute'),
 *   }}
 * />
 */
export const TimePicker = memo(
  forwardRef<HTMLButtonElement, TimePickerProps>(function TimePicker(
    {
      value,
      onChange,
      placeholder,
      use24Hour = false,
      disabled = false,
      label,
      error,
      helperText,
      className,
      labels = {},
      id: providedId,
      name,
      required = false,
    },
    ref
  ) {
    // Generate stable ID for accessibility
    const generatedId = useId();
    const inputId = providedId || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    // Merge labels with defaults
    const mergedLabels = { ...DEFAULT_TIME_PICKER_LABELS, ...labels };

    // Dialog state management
    const { isOpen, open, close } = useDialogState();

    // Derived state
    const displayValue = value ? formatDisplayTime(value, use24Hour) : '';
    const hasError = !!error;
    const hasValue = !!value;

    // Handle clear button click
    const handleClear = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(undefined);
      },
      [onChange]
    );

    // Handle opening dialog
    const handleOpen = useCallback(() => {
      if (!disabled) {
        open();
      }
    }, [disabled, open]);

    // Handle time change from dialog
    const handleTimeChange = useCallback(
      (newTime: string) => {
        onChange(newTime);
      },
      [onChange]
    );

    // Handle keyboard interaction
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleOpen();
        }
      },
      [handleOpen]
    );

    return (
      <div className={cn('w-full', className)}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className={cn('block text-sm font-semibold mb-2', hasError ? 'text-error' : 'text-on-surface', disabled && 'opacity-50')}
          >
            {label}
            {required && (
              <span className="text-error ml-1" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}

        {/* Input Container */}
        <div className="relative flex items-center">
          {/* Input Button */}
          <button
            ref={ref}
            id={inputId}
            type="button"
            name={name}
            disabled={disabled}
            onClick={handleOpen}
            onKeyDown={handleKeyDown}
            className={cn(
              'w-full h-11 px-4 flex items-center gap-3 text-left',
              'bg-surface-container-lowest border-2 rounded-2xl',
              'transition-all duration-200',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
              hasError ? 'border-error' : 'border-outline-variant/50 hover:border-outline-variant focus:border-primary',
              disabled && 'opacity-50 cursor-not-allowed',
              hasValue && !disabled && 'pr-12' // Make room for clear button
            )}
            aria-label={displayValue || placeholder || mergedLabels.selectTime}
            aria-haspopup="dialog"
            aria-expanded={isOpen}
            aria-invalid={hasError}
            aria-describedby={cn(error && errorId, helperText && helperId) || undefined}
            aria-required={required}
          >
            <Clock className="h-5 w-5 text-on-surface-variant shrink-0" aria-hidden="true" />
            <span className={cn('flex-1 text-sm truncate', displayValue ? 'text-on-surface' : 'text-on-surface-variant/40')}>
              {displayValue || placeholder || mergedLabels.selectTime}
            </span>
          </button>
          {/* Clear Button - positioned outside the trigger button */}
          {hasValue && !disabled && (
            <IconButton
              variant="standard"
              size="sm"
              className="absolute right-3 h-6 w-6 shrink-0"
              onClick={handleClear}
              aria-label={mergedLabels.clearTime}
              tabIndex={-1}
            >
              <X className="h-4 w-4" />
            </IconButton>
          )}
        </div>

        {/* Helper/Error Text */}
        {(helperText || error) && (
          <p
            id={error ? errorId : helperId}
            className={cn('mt-2 text-sm', hasError ? 'text-error' : 'text-on-surface-variant/70')}
            role={hasError ? 'alert' : undefined}
          >
            {error || helperText}
          </p>
        )}

        {/* Time Picker Dialog */}
        <TimePickerDialog
          open={isOpen}
          onClose={close}
          value={value}
          onChange={handleTimeChange}
          title={mergedLabels.selectTime}
          labels={mergedLabels as Required<typeof mergedLabels>}
          use24Hour={use24Hour}
        />
      </div>
    );
  })
);

TimePicker.displayName = 'TimePicker';
