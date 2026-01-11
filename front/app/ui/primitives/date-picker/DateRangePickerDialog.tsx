// ============================================================================
// DateRangePickerDialog Component
// ============================================================================
// Modal dialog for date range selection with presets and calendar views.
// Follows Material Design 3 modal patterns with accessibility support.

import { memo, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Check } from 'lucide-react';
import { IconButton, Button } from '../buttons';
import { cn } from '@/app/ui';
import { DEFAULT_DATE_PICKER_LABELS } from '../types';
import type { DateRangePickerDialogProps, DatePreset, CalendarViewMode, ISODateString } from './types';
import { DEFAULT_PRESETS } from './constants';
import { CalendarGrid } from './CalendarGrid';
import { CalendarHeader } from './CalendarHeader';
import { MonthYearPicker } from './MonthYearPicker';
import { parseISO, formatDateISO, formatM3HeaderDate, isSameDay } from './utils';
import { useCalendarNavigation, useDateRangeSelection, useViewMode, useBodyScrollLock, usePrevious } from './hooks';

// ============================================================================
// Sub-Components
// ============================================================================

interface TabSwitcherProps {
  activeTab: 'presets' | 'custom';
  onTabChange: (tab: 'presets' | 'custom') => void;
  presetsLabel: string;
  customLabel: string;
}

const TabSwitcher = memo(function TabSwitcher({ activeTab, onTabChange, presetsLabel, customLabel }: TabSwitcherProps) {
  return (
    <div className="flex mx-3 mt-3 p-1 bg-surface-container rounded-full" role="tablist">
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === 'presets'}
        onClick={() => onTabChange('presets')}
        className={cn(
          'flex-1 px-4 py-2 text-sm font-medium rounded-full transition-colors',
          activeTab === 'presets' ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface-variant hover:text-on-surface'
        )}
      >
        {presetsLabel}
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === 'custom'}
        onClick={() => onTabChange('custom')}
        className={cn(
          'flex-1 px-4 py-2 text-sm font-medium rounded-full transition-colors',
          activeTab === 'custom' ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface-variant hover:text-on-surface'
        )}
      >
        {customLabel}
      </button>
    </div>
  );
});

interface PresetListProps {
  presets: DatePreset[];
  selectedPresetId: string | null;
  onSelect: (preset: DatePreset) => void;
}

const PresetList = memo(function PresetList({ presets, selectedPresetId, onSelect }: PresetListProps) {
  return (
    <div className="p-3 max-h-72 overflow-y-auto" role="listbox" aria-label="Date range presets">
      <div className="space-y-0.5">
        {presets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            role="option"
            aria-selected={selectedPresetId === preset.id}
            onClick={() => onSelect(preset)}
            className={cn(
              'w-full flex items-center justify-between px-4 py-3 rounded-full text-sm',
              'transition-colors',
              selectedPresetId === preset.id
                ? 'bg-secondary-container text-on-secondary-container font-medium'
                : 'hover:bg-on-surface/8 text-on-surface'
            )}
          >
            <span>{preset.label}</span>
            {selectedPresetId === preset.id && <Check className="h-4 w-4" aria-hidden="true" />}
          </button>
        ))}
      </div>
    </div>
  );
});

// ============================================================================
// Main Component
// ============================================================================

/**
 * DateRangePickerDialog is a modal for selecting date ranges.
 * Supports preset quick selections and custom calendar-based selection.
 *
 * @example
 * ```tsx
 * <DateRangePickerDialog
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   fromDate="2026-01-01"
 *   toDate="2026-01-07"
 *   onChange={(from, to) => setDateRange({ from, to })}
 *   showPresets
 * />
 * ```
 */
export const DateRangePickerDialog = memo(function DateRangePickerDialog({
  open,
  onClose,
  fromDate,
  toDate,
  onChange,
  minDate,
  maxDate,
  presets = DEFAULT_PRESETS,
  showPresets = true,
  labels = {},
}: DateRangePickerDialogProps) {
  const mergedLabels = { ...DEFAULT_DATE_PICKER_LABELS, ...labels };

  // Track previous open state
  const prevOpen = usePrevious(open);

  // Tab management
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>(showPresets ? 'presets' : 'custom');

  // Preset selection
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  // View mode (calendar vs month/year picker)
  const { viewMode, setViewMode } = useViewMode<CalendarViewMode>({
    initialMode: 'calendar',
  });

  // Calendar navigation
  const { currentMonth, currentYear, goToPrevMonth, goToNextMonth, goToDate } = useCalendarNavigation({
    initialDate: fromDate,
  });

  // Date range selection
  const { rangeStart, rangeEnd, hoverDate, selectDate, setHoverDate, setRange } = useDateRangeSelection({
    initialFrom: fromDate,
    initialTo: toDate,
    minDate,
    maxDate,
  });

  // Body scroll lock
  useBodyScrollLock(open);

  // Reset state when dialog opens
  useEffect(() => {
    if (open && !prevOpen) {
      const startDate = fromDate ? parseISO(fromDate) : new Date();
      if (startDate) {
        goToDate(startDate.getMonth(), startDate.getFullYear());
      }
      setRange(fromDate ? parseISO(fromDate) : null, toDate ? parseISO(toDate) : null);
      setSelectedPresetId(null);
      setActiveTab(showPresets ? 'presets' : 'custom');
      setViewMode('calendar');
    }
  }, [open, prevOpen, fromDate, toDate, showPresets, goToDate, setRange, setViewMode]);

  // Handle preset selection
  const handlePresetSelect = useCallback(
    (preset: DatePreset) => {
      const range = preset.getRange();
      const startDate = parseISO(range.fromDate);
      const endDate = parseISO(range.toDate);

      setRange(startDate, endDate);
      setSelectedPresetId(preset.id);

      if (startDate) {
        goToDate(startDate.getMonth(), startDate.getFullYear());
      }
    },
    [setRange, goToDate]
  );

  // Handle calendar date selection
  const handleDateSelect = useCallback(
    (date: Date) => {
      setSelectedPresetId(null);
      selectDate(date);
    },
    [selectDate]
  );

  // Handle month/year selection
  const handleMonthYearSelect = useCallback(
    (month: number, year: number) => {
      goToDate(month, year);
      setViewMode('calendar');
    },
    [goToDate, setViewMode]
  );

  // Handle confirm
  const handleConfirm = useCallback(() => {
    if (rangeStart) {
      const from = formatDateISO(rangeStart);
      const to = rangeEnd ? formatDateISO(rangeEnd) : from;
      onChange(from, to);
      onClose();
    }
  }, [rangeStart, rangeEnd, onChange, onClose]);

  // Don't render if not open
  if (!open) return null;

  // Format display range
  const displayRange = rangeStart
    ? `${formatM3HeaderDate(formatDateISO(rangeStart), mergedLabels)}${
        rangeEnd && !isSameDay(rangeStart, rangeEnd) ? ` – ${formatM3HeaderDate(formatDateISO(rangeEnd), mergedLabels)}` : ''
      }`
    : mergedLabels.selectDate;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="date-range-picker-title"
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-scrim/32 animate-in fade-in duration-200" onClick={onClose} aria-hidden="true" />

      {/* Dialog */}
      <div
        className={cn(
          'relative w-full max-w-md rounded-3xl overflow-hidden',
          'bg-surface-container-high shadow-xl',
          'animate-in fade-in zoom-in-95 duration-200'
        )}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-5 border-b border-outline-variant/20">
          <p id="date-range-picker-title" className="text-sm text-on-surface-variant mb-3">
            {mergedLabels.selectDateRange}
          </p>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-normal text-on-surface truncate pr-2">{displayRange}</h2>
            <IconButton variant="standard" size="sm" onClick={onClose} className="text-on-surface-variant shrink-0" aria-label={mergedLabels.close}>
              <X className="h-5 w-5" />
            </IconButton>
          </div>
        </div>

        {/* Tab Switcher */}
        {showPresets && (
          <TabSwitcher activeTab={activeTab} onTabChange={setActiveTab} presetsLabel={mergedLabels.presets} customLabel={mergedLabels.custom} />
        )}

        {/* Content */}
        {activeTab === 'presets' && showPresets ? (
          <PresetList presets={presets} selectedPresetId={selectedPresetId} onSelect={handlePresetSelect} />
        ) : viewMode === 'monthYear' ? (
          <MonthYearPicker
            currentMonth={currentMonth}
            currentYear={currentYear}
            onSelect={handleMonthYearSelect}
            onBack={() => setViewMode('calendar')}
            labels={mergedLabels}
          />
        ) : (
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
              rangeStart={rangeStart}
              rangeEnd={rangeEnd}
              hoverDate={hoverDate}
              minDate={minDate}
              maxDate={maxDate}
              onDateSelect={handleDateSelect}
              onDateHover={setHoverDate}
              isRangeMode
              labels={mergedLabels}
            />
          </>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 px-4 py-3">
          <Button variant="text" onClick={onClose}>
            {mergedLabels.cancel}
          </Button>
          <Button variant="text" onClick={handleConfirm} disabled={!rangeStart}>
            {mergedLabels.ok}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
});
