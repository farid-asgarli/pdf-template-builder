// ============================================================================
// TimePickerDialog Component
// ============================================================================
// A Material Design 3 style modal dialog for time selection.
// Features clock dial and keyboard input modes.

import { Keyboard, Clock } from 'lucide-react';
import { forwardRef, useCallback, useEffect, memo } from 'react';
import { createPortal } from 'react-dom';
import { IconButton, Button } from '../buttons';
import { cn } from '@/app/ui';
import { ClockDial } from './ClockDial';
import { TimeDisplay } from './TimeDisplay';
import type { TimePickerDialogProps } from './types';
import { useTimePickerState, useBodyScrollLock, useAutoModeSwitch, usePrevious, useKeyboardNavigation } from './hooks';
import { MODE_SWITCH_DELAY, DIALOG_ANIMATION_DURATION, ACTION_KEYS } from './constants';

// ============================================================================
// TimePickerDialog Component
// ============================================================================

/**
 * Modal dialog for time selection with Material Design 3 styling.
 *
 * Features:
 * - Clock dial for visual time selection
 * - Keyboard input mode for direct entry
 * - AM/PM toggle for 12-hour format
 * - Full keyboard and screen reader accessibility
 * - Body scroll locking when open
 *
 * @example
 * ```tsx
 * <TimePickerDialog
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   value="14:30"
 *   onChange={(time) => setValue(time)}
 *   labels={labels}
 * />
 * ```
 */
export const TimePickerDialog = memo(
  forwardRef<HTMLDivElement, TimePickerDialogProps>(function TimePickerDialog(
    { open, onClose, value, onChange, title, labels, use24Hour = false },
    ref
  ) {
    // Use custom hooks for state management
    const { hour, minute, period, mode, inputMode, setHour, setMinute, setPeriod, setMode, toggleInputMode, reset, getFormattedTime } =
      useTimePickerState({ initialValue: value });

    const { lock, unlock } = useBodyScrollLock();
    const scheduleAutoSwitch = useAutoModeSwitch({ delay: MODE_SWITCH_DELAY });
    const prevOpen = usePrevious(open);

    // Keyboard navigation for dial mode
    const handleKeyDown = useKeyboardNavigation({
      mode,
      hour,
      minute,
      setHour,
      setMinute,
      enabled: inputMode === 'dial',
      use24Hour,
    });

    // Reset state when dialog opens
    useEffect(() => {
      if (open && !prevOpen) {
        reset(value);
      }
    }, [open, prevOpen, value, reset]);

    // Manage body scroll lock
    useEffect(() => {
      if (open) {
        lock();
      } else {
        unlock();
      }
      return unlock;
    }, [open, lock, unlock]);

    // Handle dial value change with auto-switch
    const handleDialChange = useCallback(
      (val: number) => {
        if (mode === 'hour') {
          setHour(val);
        } else {
          setMinute(val);
        }
      },
      [mode, setHour, setMinute]
    );

    // Auto-switch to minute mode after hour selection
    const handleSelectionComplete = useCallback(() => {
      if (mode === 'hour') {
        scheduleAutoSwitch(() => setMode('minute'));
      }
    }, [mode, scheduleAutoSwitch, setMode]);

    // Handle confirm action
    const handleConfirm = useCallback(() => {
      const time24 = getFormattedTime();
      onChange(time24);
      onClose();
    }, [getFormattedTime, onChange, onClose]);

    // Handle escape key to close
    const handleDialogKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === ACTION_KEYS.ESCAPE) {
          e.preventDefault();
          onClose();
        } else if (e.key === ACTION_KEYS.ENTER) {
          e.preventDefault();
          handleConfirm();
        }
        // Pass to navigation handler
        handleKeyDown(e);
      },
      [onClose, handleConfirm, handleKeyDown]
    );

    // Handle backdrop click
    const handleBackdropClick = useCallback(
      (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      },
      [onClose]
    );

    if (!open) return null;

    return createPortal(
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="time-picker-title"
        onKeyDown={handleDialogKeyDown}
      >
        {/* Backdrop - M3 scrim */}
        <div
          className="fixed inset-0 bg-scrim/32 animate-in fade-in"
          style={{ animationDuration: `${DIALOG_ANIMATION_DURATION}ms` }}
          onClick={handleBackdropClick}
          aria-hidden="true"
        />

        {/* Dialog - M3 surface container high with 28dp corner radius */}
        <div
          ref={ref}
          className={cn('relative rounded-3xl overflow-hidden min-w-80', 'bg-surface-container-high shadow-xl', 'animate-in fade-in zoom-in-95')}
          style={{ animationDuration: `${DIALOG_ANIMATION_DURATION}ms` }}
        >
          {/* Header */}
          <div className="px-6 pt-5 pb-5">
            <p id="time-picker-title" className="text-sm text-on-surface-variant mb-5">
              {title || labels.selectTime}
            </p>

            <TimeDisplay
              hour={hour}
              minute={minute}
              period={period}
              mode={mode}
              onModeChange={setMode}
              onPeriodChange={setPeriod}
              inputMode={inputMode}
              onHourChange={setHour}
              onMinuteChange={setMinute}
              labels={labels}
              use24Hour={use24Hour}
            />
          </div>

          {/* Clock dial (only in dial mode) */}
          {inputMode === 'dial' && (
            <div className="flex justify-center px-6 pb-4">
              <ClockDial
                mode={mode}
                value={mode === 'hour' ? hour : minute}
                onChange={handleDialChange}
                onSelectionComplete={handleSelectionComplete}
                use24Hour={use24Hour}
              />
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3">
            {/* Toggle input mode button */}
            <IconButton
              variant="standard"
              size="default"
              onClick={toggleInputMode}
              aria-label={inputMode === 'dial' ? labels.switchToKeyboard : labels.switchToDial}
            >
              {inputMode === 'dial' ? <Keyboard className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
            </IconButton>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <Button variant="text" onClick={onClose}>
                {labels.cancel}
              </Button>
              <Button variant="text" onClick={handleConfirm}>
                {labels.ok}
              </Button>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  })
);

TimePickerDialog.displayName = 'TimePickerDialog';
