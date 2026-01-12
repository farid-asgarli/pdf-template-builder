// Shared types for property panel components

/**
 * Base props for property editors that handle individual property changes.
 * @template T - The type of the properties object being edited
 */
export interface PropertyEditorProps<T> {
  /** The current properties object */
  properties: T;
  /** Callback fired when a single property changes */
  onChange: (name: string, value: unknown) => void;
}

/**
 * Extended props for property editors that can handle batch property updates.
 * Used for complex editors like TablePropertyEditor that need atomic multi-property updates.
 * @template T - The type of the properties object being edited
 */
export interface PropertyEditorWithBatchProps<T> extends PropertyEditorProps<T> {
  /** Callback fired when multiple properties need to change atomically */
  onBatchChange: (updates: Record<string, unknown>) => void;
}

/**
 * Common option type for select/dropdown components
 */
export interface SelectOption<T = string> {
  value: T;
  label: string;
}

/**
 * Grouped select option for categorized selections
 */
export interface GroupedSelectOption<T = string> extends SelectOption<T> {
  group: string;
}
