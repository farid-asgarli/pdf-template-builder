// ============================================================================
// DatePicker Component
// ============================================================================
// A complete date picker input with calendar dialog.
// Follows Material Design 3 patterns with full accessibility support.

import { memo, useCallback } from 'react';
import { Calendar, X } from 'lucide-react';
import { IconButton } from '../buttons';
import { cn } from '@/app/ui';
import { DEFAULT_DATE_PICKER_LABELS } from '../types';
import type { SingleDateProps, ISODateString } from './types';
import { DatePickerDialog } from './DatePickerDialog';
import { formatDisplayDate } from './utils';
import { useDialogState } from './hooks';

// ============================================================================
// Props Interface
// ============================================================================

export interface DatePickerProps extends SingleDateProps {
  /** Placeholder text when no date is selected */
  placeholder?: string;
  /** Label for the input field */
  label?: string;
  /** Error message to display */
  error?: string;
  /** Helper text to display below the input */
  helperText?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * DatePicker provides a complete date selection experience with an input field
 * and calendar dialog. Follows Material Design 3 guidelines.
 *
 * @example
 * ```tsx
 * const [date, setDate] = useState<string>();
 *
 * <DatePicker
 *   value={date}
 *   onChange={setDate}
 *   label="Birth Date"
 *   placeholder="Select your birth date"
 *   minDate="1900-01-01"
 *   maxDate="2026-01-03"
 * />
 * ```
 */
export const DatePicker = memo(function DatePicker({
  value,
  onChange,
  placeholder,
  minDate,
  maxDate,
  disabled = false,
  label,
  error,
  helperText,
  className,
  labels = {},
}: DatePickerProps) {
  const mergedLabels = { ...DEFAULT_DATE_PICKER_LABELS, ...labels };
  const { isOpen, open, close } = useDialogState();

  const displayValue = value ? formatDisplayDate(value, mergedLabels) : '';
  const hasError = !!error;

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange(undefined);
    },
    [onChange]
  );

  const handleDateChange = useCallback(
    (date: ISODateString) => {
      onChange(date);
      close();
    },
    [onChange, close]
  );

  return (
    <div className={cn('w-full', className)}>
      {/* Label */}
      {label && <label className={cn('block text-sm font-semibold mb-2', hasError ? 'text-error' : 'text-on-surface')}>{label}</label>}

      {/* Input Container */}
      <div className="relative flex items-center">
        {/* Input Button */}
        <button
          type="button"
          disabled={disabled}
          onClick={open}
          className={cn(
            'w-full h-11 px-4 flex items-center gap-3 text-left',
            'bg-surface-container-lowest border-2 rounded-2xl',
            'transition-all duration-200',
            hasError ? 'border-error' : 'border-outline-variant/50 hover:border-outline-variant focus:border-primary',
            disabled && 'opacity-50 cursor-not-allowed',
            value && !disabled && 'pr-12' // Make room for clear button
          )}
          aria-label={displayValue || placeholder || mergedLabels.selectDate}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-invalid={hasError}
        >
          <Calendar className="h-5 w-5 text-on-surface-variant shrink-0" aria-hidden="true" />
          <span className={cn('flex-1 text-sm truncate', displayValue ? 'text-on-surface' : 'text-on-surface-variant/40')}>
            {displayValue || placeholder || mergedLabels.selectDate}
          </span>
        </button>
        {/* Clear Button - positioned outside the trigger button */}
        {value && !disabled && (
          <IconButton
            variant="standard"
            size="sm"
            className="absolute right-3 h-6 w-6 shrink-0"
            onClick={handleClear}
            aria-label={mergedLabels.clearDate}
          >
            <X className="h-3.5 w-3.5" />
          </IconButton>
        )}
      </div>

      {/* Helper/Error Text */}
      {(helperText || error) && (
        <p className={cn('mt-2 text-sm', hasError ? 'text-error' : 'text-on-surface-variant/70')} role={hasError ? 'alert' : undefined}>
          {error || helperText}
        </p>
      )}

      {/* Dialog */}
      <DatePickerDialog
        open={isOpen}
        onClose={close}
        value={value}
        onChange={handleDateChange}
        minDate={minDate}
        maxDate={maxDate}
        title={mergedLabels.selectDate}
        labels={mergedLabels}
      />
    </div>
  );
});
