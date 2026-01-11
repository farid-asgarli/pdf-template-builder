// ============================================================================
// DateRangePicker Component
// ============================================================================
// A complete date range picker with trigger button and dialog.
// Follows Material Design 3 patterns with full accessibility support.

import { memo, useMemo, useCallback } from 'react';
import { Calendar, X, ChevronRight } from 'lucide-react';
import { Button, IconButton } from '../buttons';
import { cn } from '@/app/ui';
import { DEFAULT_DATE_PICKER_LABELS } from '../types';
import type { DateRangeProps, DatePreset, ISODateString } from './types';
import { DateRangePickerDialog } from './DateRangePickerDialog';
import { formatDisplayDate } from './utils';
import { useDialogState } from './hooks';

// ============================================================================
// Props Interface
// ============================================================================

export interface DateRangePickerProps extends DateRangeProps {
  /** Available presets for quick selection */
  presets?: DatePreset[];
  /** Whether to show the presets tab */
  showPresets?: boolean;
}

// ============================================================================
// Component
// ============================================================================

/**
 * DateRangePicker provides a complete date range selection experience with
 * a trigger button and modal dialog. Supports presets for common ranges.
 *
 * @example
 * ```tsx
 * const [fromDate, setFromDate] = useState<string>();
 * const [toDate, setToDate] = useState<string>();
 *
 * <DateRangePicker
 *   fromDate={fromDate}
 *   toDate={toDate}
 *   onChange={(from, to) => {
 *     setFromDate(from);
 *     setToDate(to);
 *   }}
 *   showPresets
 *   minDate="2026-01-01"
 * />
 * ```
 */
export const DateRangePicker = memo(function DateRangePicker({
  fromDate,
  toDate,
  onChange,
  minDate,
  maxDate,
  presets,
  showPresets = true,
  disabled = false,
  className,
  labels = {},
}: DateRangePickerProps) {
  const mergedLabels = { ...DEFAULT_DATE_PICKER_LABELS, ...labels };
  const { isOpen, open, close } = useDialogState();

  // Format display value
  const displayValue = useMemo(() => {
    if (!fromDate) return '';
    const from = formatDisplayDate(fromDate, mergedLabels);
    if (!toDate || fromDate === toDate) return from;
    return `${from} – ${formatDisplayDate(toDate, mergedLabels)}`;
  }, [fromDate, toDate, mergedLabels]);

  // Clear handler
  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange(undefined, undefined);
    },
    [onChange]
  );

  // Range change handler
  const handleRangeChange = useCallback(
    (from: ISODateString | undefined, to: ISODateString | undefined) => {
      onChange(from, to);
      close();
    },
    [onChange, close]
  );

  const hasValue = !!fromDate;

  return (
    <div className={cn('relative', className)}>
      {/* Trigger Button */}
      <Button
        variant={hasValue ? 'tonal' : 'outline'}
        disabled={disabled}
        onClick={open}
        className={cn('gap-2', hasValue && 'pr-2')}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={displayValue || mergedLabels.dateRange}
      >
        <Calendar className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">{displayValue || mergedLabels.dateRange}</span>
        {hasValue ? (
          <IconButton variant="standard" size="sm" className="h-6 w-6 ml-1" onClick={handleClear} aria-label={mergedLabels.clearDateFilter}>
            <X className="h-3.5 w-3.5" />
          </IconButton>
        ) : (
          <ChevronRight className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-90')} aria-hidden="true" />
        )}
      </Button>

      {/* Dialog */}
      <DateRangePickerDialog
        open={isOpen}
        onClose={close}
        fromDate={fromDate}
        toDate={toDate}
        onChange={handleRangeChange}
        minDate={minDate}
        maxDate={maxDate}
        presets={presets}
        showPresets={showPresets}
        labels={mergedLabels}
      />
    </div>
  );
});
