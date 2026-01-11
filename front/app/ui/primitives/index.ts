// @survey/ui-primitives - Low-level UI building blocks
// These are "atoms" - fundamental, translation-agnostic components
//
// Components should NOT use i18n/useTranslation internally.
// All text should come from props or children.

// ============================================================================
// Core Utilities
// ============================================================================

export type { ClassValue } from 'clsx';

// ============================================================================
// Types
// ============================================================================

export type {
  ViewMode,
  CommonLabels,
  SelectLabels,
  SearchInputLabels,
  TimePickerLabels,
  DatePickerLabels,
  DialogLabels,
  DrawerLabels,
  OverlayHeaderLabels,
  EmptyStateLabels,
} from './types';

export {
  DEFAULT_COMMON_LABELS,
  DEFAULT_SELECT_LABELS,
  DEFAULT_SEARCH_INPUT_LABELS,
  DEFAULT_TIME_PICKER_LABELS,
  DEFAULT_DATE_PICKER_LABELS,
  DEFAULT_DIALOG_LABELS,
  DEFAULT_DRAWER_LABELS,
  DEFAULT_OVERLAY_HEADER_LABELS,
} from './types';

// ============================================================================
// Component Modules
// ============================================================================

// Buttons
export * from './buttons';

// Inputs
export * from './inputs';

// Feedback
export * from './feedback';

// Layout
export * from './layout';

// Display
export * from './display';

// Date Picker
export * from './date-picker';

// Time Picker
export * from './time-picker';

// ============================================================================
// Migration Map: apps/admin/src/components/ui → packages/ui-primitives/src
// ============================================================================
//
// buttons/
//   Button.tsx      ← Button.tsx
//   IconButton.tsx  ← IconButton.tsx
//   FAB.tsx         ← FAB.tsx
//
// inputs/
//   Input.tsx       ← Input.tsx
//   Textarea.tsx    ← Textarea.tsx
//   Select.tsx      ← Select.tsx
//   Checkbox.tsx    ← Checkbox.tsx
//   Radio.tsx       ← Radio.tsx
//   Switch.tsx      ← Switch.tsx
//
// feedback/
//   Badge.tsx       ← Badge.tsx
//   Progress.tsx    ← Progress.tsx
//   Skeleton.tsx    ← Skeleton.tsx
//
// layout/
//   Card.tsx        ← Card.tsx
//   Dialog.tsx      ← Dialog.tsx
//   Drawer.tsx      ← Drawer.tsx
//   Tabs.tsx        ← Tabs.tsx
//
// display/
//   Avatar.tsx      ← Avatar.tsx
//   Chip.tsx        ← Chip.tsx
//   Tooltip.tsx     ← Tooltip.tsx
// ============================================================================
