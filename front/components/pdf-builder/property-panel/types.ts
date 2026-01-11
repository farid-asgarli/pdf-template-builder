// Shared types for property panel components

export interface PropertyEditorProps<T> {
  properties: T;
  onChange: (name: string, value: unknown) => void;
}

export interface PropertyEditorWithBatchProps<T> extends PropertyEditorProps<T> {
  onBatchChange: (updates: Record<string, unknown>) => void;
}
