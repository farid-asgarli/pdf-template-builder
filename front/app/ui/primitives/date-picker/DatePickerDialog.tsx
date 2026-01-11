// ============================================================================
// DatePickerDialog Component
// ============================================================================
// Modal dialog for date selection with calendar view and direct input.
// Follows Material Design 3 modal patterns with accessibility support.

import { memo, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, Pencil } from 'lucide-react';
import { IconButton, Button } from '../buttons';
import { cn } from '@/app/ui';
import { DEFAULT_DATE_PICKER_LABELS } from '../types';
import type { DatePickerDialogProps, CalendarViewMode } from './types';
import { CalendarGrid } from './CalendarGrid';
import { CalendarHeader } from './CalendarHeader';
import { MonthYearPicker } from './MonthYearPicker';
import { parseISO, formatDateISO, formatM3HeaderDate } from './utils';
import { useCalendarNavigation, useDateSelection, useDateInput, useViewMode, useBodyScrollLock, usePrevious } from './hooks';

// ============================================================================
// Component
// ============================================================================

/**
 * DatePickerDialog is a modal dialog for selecting a single date.
 * Supports calendar view, month/year picker, and direct input modes.
 *
 * @example
 * ```tsx
 * <DatePickerDialog
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   value="2026-01-03"
 *   onChange={(date) => setSelectedDate(date)}
 *   minDate="2026-01-01"
 *   maxDate="2026-12-31"
 * />
 * ```
 */
export const DatePickerDialog = memo(function DatePickerDialog({
  open,
  onClose,
  value,
  onChange,
  minDate,
  maxDate,
  title,
  labels = {},
}: DatePickerDialogProps) {
  const mergedLabels = { ...DEFAULT_DATE_PICKER_LABELS, ...labels };
  const resolvedTitle = title ?? mergedLabels.selectDate;

  // Track previous open state
  const prevOpen = usePrevious(open);

  // View mode management
  const { viewMode, setViewMode } = useViewMode<CalendarViewMode>({
    initialMode: 'calendar',
  });

  // Calendar navigation
  const { currentMonth, currentYear, goToPrevMonth, goToNextMonth, goToDate } = useCalendarNavigation({
    initialDate: value,
  });

  // Date selection
  const { selectedDate, selectDate } = useDateSelection({
    initialDate: value,
    minDate,
    maxDate,
  });

  // Date input handling
  const { inputValue, hasError, handleChange, setValue } = useDateInput({
    initialValue: value,
    minDate,
    maxDate,
    onValidDate: (date) => {
      selectDate(date);
      goToDate(date.getMonth(), date.getFullYear());
    },
  });

  // Body scroll lock
  useBodyScrollLock(open);

  // Reset state when dialog opens
  useEffect(() => {
    if (open && !prevOpen) {
      const date = value ? parseISO(value) : new Date();
      if (date) {
        goToDate(date.getMonth(), date.getFullYear());
      }
      setViewMode('calendar');
      setValue(value || '');
    }
  }, [open, prevOpen, value, goToDate, setViewMode, setValue]);

  // Handlers
  const handleDateSelect = useCallback(
    (date: Date) => {
      selectDate(date);
      setValue(formatDateISO(date));
    },
    [selectDate, setValue]
  );

  const handleMonthYearSelect = useCallback(
    (month: number, year: number) => {
      goToDate(month, year);
      setViewMode('calendar');
    },
    [goToDate, setViewMode]
  );

  const handleToggleInputMode = useCallback(() => {
    if (viewMode === 'input') {
      setViewMode('calendar');
    } else {
      setViewMode('input');
      setValue(selectedDate ? formatDateISO(selectedDate) : '');
    }
  }, [viewMode, selectedDate, setViewMode, setValue]);

  const handleConfirm = useCallback(() => {
    if (selectedDate) {
      onChange(formatDateISO(selectedDate));
      onClose();
    }
  }, [selectedDate, onChange, onClose]);

  // Don't render if not open
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="datepicker-title">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-scrim/32 animate-in fade-in duration-200" onClick={onClose} aria-hidden="true" />

      {/* Dialog */}
      <div
        className={cn(
          'relative w-full max-w-96 rounded-3xl overflow-hidden',
          'bg-surface-container-high shadow-xl',
          'animate-in fade-in zoom-in-95 duration-200'
        )}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-6 border-b border-outline-variant/20">
          <p id="datepicker-title" className="text-sm text-on-surface-variant mb-3">
            {resolvedTitle}
          </p>
          <div className="flex items-center justify-between">
            <h2 className="text-3xl leading-10 font-normal text-on-surface">
              {selectedDate ? formatM3HeaderDate(formatDateISO(selectedDate), mergedLabels) : 'No date'}
            </h2>
            <IconButton
              variant="standard"
              size="default"
              onClick={handleToggleInputMode}
              aria-label={viewMode === 'input' ? 'Switch to calendar' : 'Switch to keyboard input'}
              className="text-on-surface-variant"
            >
              {viewMode === 'input' ? <Calendar className="h-5 w-5" /> : <Pencil className="h-5 w-5" />}
            </IconButton>
          </div>
        </div>

        {/* Content */}
        {viewMode === 'input' ? (
          <div className="px-6 py-8">
            <label htmlFor="date-input" className="block text-xs font-medium text-on-surface-variant mb-2">
              Date (YYYY-MM-DD)
            </label>
            <input
              id="date-input"
              type="text"
              value={inputValue}
              onChange={handleChange}
              placeholder="YYYY-MM-DD"
              className={cn(
                'w-full h-14 px-4 text-lg rounded-xl transition-colors outline-none',
                'bg-surface-container border-2',
                hasError ? 'border-error text-error' : 'border-outline-variant/50 text-on-surface focus:border-primary'
              )}
              aria-invalid={hasError}
              aria-describedby={hasError ? 'date-input-error' : undefined}
            />
            {hasError && (
              <p id="date-input-error" className="mt-2 text-sm text-error" role="alert">
                Invalid date
              </p>
            )}
          </div>
        ) : viewMode === 'calendar' ? (
          <>
            <CalendarHeader
              currentMonth={currentMonth}
              currentYear={currentYear}
              onPrevMonth={goToPrevMonth}
              onNextMonth={goToNextMonth}
              onMonthYearClick={() => setViewMode('monthYear')}
              labels={mergedLabels}
            />
            <CalendarGrid
              currentMonth={currentMonth}
              currentYear={currentYear}
              selectedDate={selectedDate}
              minDate={minDate}
              maxDate={maxDate}
              onDateSelect={handleDateSelect}
              labels={mergedLabels}
            />
          </>
        ) : (
          <MonthYearPicker
            currentMonth={currentMonth}
            currentYear={currentYear}
            onSelect={handleMonthYearSelect}
            onBack={() => setViewMode('calendar')}
            labels={mergedLabels}
          />
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 px-4 py-3">
          <Button variant="text" onClick={onClose}>
            {mergedLabels.cancel}
          </Button>
          <Button variant="text" onClick={handleConfirm} disabled={!selectedDate}>
            OK
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
});
