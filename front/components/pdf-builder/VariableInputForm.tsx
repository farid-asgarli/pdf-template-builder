'use client';

import { useState, useMemo, useCallback } from 'react';
import { Input, Textarea, Select, Switch } from '@/app/ui/primitives';
import { DatePicker } from '@/app/ui/primitives/date-picker';
import { Plus, Trash2, ChevronDown, ChevronRight, GripVertical, AlertCircle } from 'lucide-react';
import type { VariableDefinition, VariableType, CurrencyValue } from '@/lib/types/variable.types';
import { groupVariablesByCategory, getDefaultValueForType, isPrimitiveType } from '@/lib/types/variable.types';

// Currency options for currency inputs
const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'JPY', label: 'JPY (¥)' },
  { value: 'CAD', label: 'CAD ($)' },
  { value: 'AUD', label: 'AUD ($)' },
  { value: 'CHF', label: 'CHF' },
  { value: 'CNY', label: 'CNY (¥)' },
  { value: 'INR', label: 'INR (₹)' },
];

interface VariableInputFormProps {
  /** Variable definitions to render inputs for */
  definitions: VariableDefinition[];
  /** Current variable values */
  values: Record<string, unknown>;
  /** Callback when a value changes */
  onChange: (name: string, value: unknown) => void;
  /** Validation errors by variable name */
  errors?: Record<string, string>;
  /** Whether the form is disabled */
  disabled?: boolean;
  /** Whether to show computed variables (read-only) */
  showComputed?: boolean;
  /** Compact mode for space-constrained layouts */
  compact?: boolean;
}

/**
 * Dynamic form that renders inputs based on variable definitions.
 * Supports all variable types including nested arrays and objects.
 */
export function VariableInputForm({
  definitions,
  values,
  onChange,
  errors = {},
  disabled = false,
  showComputed = false,
  compact = false,
}: VariableInputFormProps) {
  // Filter out computed variables if not showing them
  const visibleDefinitions = useMemo(() => {
    return showComputed ? definitions : definitions.filter((d) => !d.isComputed);
  }, [definitions, showComputed]);

  // Group by category
  const groupedVariables = useMemo(() => groupVariablesByCategory(visibleDefinitions), [visibleDefinitions]);

  if (visibleDefinitions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-sm text-on-surface-variant">No variables defined</p>
        <p className="text-xs text-on-surface-variant/70 mt-1">Add variable placeholders like {'{{variableName}}'} to your document</p>
      </div>
    );
  }

  return (
    <div className={compact ? 'space-y-3' : 'space-y-6'}>
      {Array.from(groupedVariables.entries()).map(([category, vars]) => (
        <div key={category}>
          {groupedVariables.size > 1 && <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3">{category}</h3>}
          <div className={compact ? 'space-y-2' : 'space-y-4'}>
            {vars.map((definition) => (
              <VariableInput
                key={definition.name}
                definition={definition}
                value={values[definition.name]}
                onChange={(value) => onChange(definition.name, value)}
                error={errors[definition.name]}
                disabled={disabled || definition.isComputed}
                compact={compact}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

interface VariableInputProps {
  definition: VariableDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  disabled?: boolean;
  compact?: boolean;
}

/**
 * Renders the appropriate input component based on variable type.
 */
function VariableInput({ definition, value, onChange, error, disabled = false, compact = false }: VariableInputProps) {
  const { type, label, description, required, defaultValue, isComputed, format } = definition;

  // Get effective value (use default if no value provided)
  const effectiveValue = value ?? (defaultValue ? parseDefaultValue(defaultValue, type) : undefined);

  const labelElement = (
    <label className="block text-sm font-medium text-on-surface mb-1">
      {label}
      {required && <span className="text-error ml-0.5">*</span>}
      {isComputed && <span className="ml-2 text-xs text-on-surface-variant">(computed)</span>}
    </label>
  );

  const errorElement = error && (
    <p className="flex items-center gap-1 text-xs text-error mt-1">
      <AlertCircle className="h-3 w-3" />
      {error}
    </p>
  );

  const descriptionElement = description && !compact && <p className="text-xs text-on-surface-variant mt-1">{description}</p>;

  const wrapperClass = compact ? 'mb-2' : 'mb-4';

  switch (type) {
    case 'string':
      return (
        <div className={wrapperClass}>
          {labelElement}
          {definition.pattern || (effectiveValue && String(effectiveValue).length > 100) ? (
            <Textarea
              value={String(effectiveValue ?? '')}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
              placeholder={definition.description || `Enter ${label.toLowerCase()}`}
              rows={3}
              className={error ? 'border-error' : ''}
            />
          ) : (
            <Input
              type="text"
              value={String(effectiveValue ?? '')}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
              placeholder={definition.description || `Enter ${label.toLowerCase()}`}
              className={error ? 'border-error' : ''}
            />
          )}
          {errorElement}
          {descriptionElement}
        </div>
      );

    case 'number':
      return (
        <div className={wrapperClass}>
          {labelElement}
          <Input
            type="number"
            value={effectiveValue !== undefined ? String(effectiveValue) : ''}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
            disabled={disabled}
            placeholder={`Enter ${label.toLowerCase()}`}
            className={error ? 'border-error' : ''}
          />
          {errorElement}
          {descriptionElement}
        </div>
      );

    case 'boolean':
      return (
        <div className={wrapperClass}>
          <Switch
            checked={Boolean(effectiveValue)}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
            label={label + (required ? ' *' : '')}
          />
          {errorElement}
          {descriptionElement}
        </div>
      );

    case 'date':
      return (
        <div className={wrapperClass}>
          {labelElement}
          <DatePicker value={effectiveValue as string | undefined} onChange={(date) => onChange(date)} disabled={disabled} />
          {format && <p className="text-xs text-on-surface-variant mt-1">Format: {format}</p>}
          {errorElement}
          {descriptionElement}
        </div>
      );

    case 'currency':
      return (
        <CurrencyInput
          definition={definition}
          value={effectiveValue as CurrencyValue | undefined}
          onChange={onChange}
          error={error}
          disabled={disabled}
          compact={compact}
        />
      );

    case 'array':
      return (
        <ArrayInput
          definition={definition}
          value={effectiveValue as unknown[] | undefined}
          onChange={onChange}
          error={error}
          disabled={disabled}
          compact={compact}
        />
      );

    case 'object':
      return (
        <ObjectInput
          definition={definition}
          value={effectiveValue as Record<string, unknown> | undefined}
          onChange={onChange}
          error={error}
          disabled={disabled}
          compact={compact}
        />
      );

    default:
      return (
        <div className={wrapperClass}>
          {labelElement}
          <Input
            type="text"
            value={String(effectiveValue ?? '')}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            placeholder={`Enter ${label.toLowerCase()}`}
          />
          {errorElement}
        </div>
      );
  }
}

/**
 * Currency input with value and currency code.
 */
function CurrencyInput({
  definition,
  value,
  onChange,
  error,
  disabled,
  compact,
}: {
  definition: VariableDefinition;
  value?: CurrencyValue;
  onChange: (value: CurrencyValue) => void;
  error?: string;
  disabled?: boolean;
  compact?: boolean;
}) {
  const currencyValue = value || { value: 0, currency: 'USD' };

  return (
    <div className={compact ? 'mb-2' : 'mb-4'}>
      <label className="block text-sm font-medium text-on-surface mb-1">
        {definition.label}
        {definition.required && <span className="text-error ml-0.5">*</span>}
      </label>
      <div className="flex gap-2">
        <Input
          type="number"
          value={currencyValue.value}
          onChange={(e) => onChange({ ...currencyValue, value: Number(e.target.value) || 0 })}
          disabled={disabled}
          placeholder="0.00"
          step="0.01"
          className={`flex-1 ${error ? 'border-error' : ''}`}
        />
        <Select
          options={CURRENCY_OPTIONS}
          value={currencyValue.currency}
          onChange={(currency) => onChange({ ...currencyValue, currency })}
          disabled={disabled}
        />
      </div>
      {error && (
        <p className="flex items-center gap-1 text-xs text-error mt-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Array input for list variables.
 */
function ArrayInput({
  definition,
  value,
  onChange,
  error,
  disabled,
  compact,
}: {
  definition: VariableDefinition;
  value?: unknown[];
  onChange: (value: unknown[]) => void;
  error?: string;
  disabled?: boolean;
  compact?: boolean;
}) {
  const arrayValue = useMemo(() => value || [], [value]);
  const itemSchema = definition.itemSchema?.[0];

  const addItem = useCallback(() => {
    if (definition.maxItems && arrayValue.length >= definition.maxItems) {
      return;
    }
    const newItem = itemSchema ? getDefaultValueForType(itemSchema.type) : '';
    onChange([...arrayValue, newItem]);
  }, [arrayValue, onChange, itemSchema, definition.maxItems]);

  const removeItem = useCallback(
    (index: number) => {
      const newArray = [...arrayValue];
      newArray.splice(index, 1);
      onChange(newArray);
    },
    [arrayValue, onChange]
  );

  const updateItem = useCallback(
    (index: number, newValue: unknown) => {
      const newArray = [...arrayValue];
      newArray[index] = newValue;
      onChange(newArray);
    },
    [arrayValue, onChange]
  );

  const canAddMore = !definition.maxItems || arrayValue.length < definition.maxItems;
  const canRemove = !definition.minItems || arrayValue.length > definition.minItems;

  return (
    <div className={compact ? 'mb-2' : 'mb-4'}>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-on-surface">
          {definition.label}
          {definition.required && <span className="text-error ml-0.5">*</span>}
        </label>
        <button
          type="button"
          onClick={addItem}
          disabled={disabled || !canAddMore}
          className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="h-3 w-3" />
          Add Item
        </button>
      </div>

      {arrayValue.length === 0 ? (
        <div className="flex items-center justify-center py-4 border border-dashed border-outline-variant rounded-lg">
          <p className="text-sm text-on-surface-variant">No items yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {arrayValue.map((item, index) => (
            <div key={index} className="flex items-start gap-2 p-2 bg-surface-container rounded-lg">
              <div className="shrink-0 pt-2 text-on-surface-variant">
                <GripVertical className="h-4 w-4" />
              </div>
              <div className="flex-1">
                {itemSchema ? (
                  isPrimitiveType(itemSchema.type) ? (
                    <VariableInput
                      definition={{ ...itemSchema, label: `Item ${index + 1}` }}
                      value={item}
                      onChange={(v) => updateItem(index, v)}
                      disabled={disabled}
                      compact
                    />
                  ) : (
                    <ObjectInput
                      definition={{ ...itemSchema, label: `Item ${index + 1}` }}
                      value={item as Record<string, unknown>}
                      onChange={(v) => updateItem(index, v)}
                      disabled={disabled}
                      compact
                    />
                  )
                ) : (
                  <Input
                    value={String(item ?? '')}
                    onChange={(e) => updateItem(index, e.target.value)}
                    disabled={disabled}
                    placeholder={`Item ${index + 1}`}
                  />
                )}
              </div>
              <button
                type="button"
                onClick={() => removeItem(index)}
                disabled={disabled || !canRemove}
                className="shrink-0 p-1 text-error/70 hover:text-error disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={`Remove item ${index + 1}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="flex items-center gap-1 text-xs text-error mt-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}

      {(definition.minItems || definition.maxItems) && (
        <p className="text-xs text-on-surface-variant mt-1">
          {definition.minItems && definition.maxItems
            ? `${definition.minItems} - ${definition.maxItems} items`
            : definition.minItems
            ? `At least ${definition.minItems} items`
            : `Up to ${definition.maxItems} items`}
        </p>
      )}
    </div>
  );
}

/**
 * Object input for nested object variables.
 */
function ObjectInput({
  definition,
  value,
  onChange,
  error,
  disabled,
  compact,
}: {
  definition: VariableDefinition;
  value?: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
  error?: string;
  disabled?: boolean;
  compact?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const objectValue = useMemo(() => value || {}, [value]);
  const properties = definition.properties || [];

  const updateProperty = useCallback(
    (propName: string, propValue: unknown) => {
      onChange({ ...objectValue, [propName]: propValue });
    },
    [objectValue, onChange]
  );

  if (properties.length === 0) {
    return (
      <div className={compact ? 'mb-2' : 'mb-4'}>
        <label className="block text-sm font-medium text-on-surface mb-1">
          {definition.label}
          {definition.required && <span className="text-error ml-0.5">*</span>}
        </label>
        <p className="text-xs text-on-surface-variant">No properties defined</p>
      </div>
    );
  }

  return (
    <div className={compact ? 'mb-2' : 'mb-4'}>
      <button type="button" onClick={() => setIsExpanded(!isExpanded)} className="flex items-center gap-2 w-full text-left">
        {isExpanded ? <ChevronDown className="h-4 w-4 text-on-surface-variant" /> : <ChevronRight className="h-4 w-4 text-on-surface-variant" />}
        <span className="text-sm font-medium text-on-surface">
          {definition.label}
          {definition.required && <span className="text-error ml-0.5">*</span>}
        </span>
      </button>

      {isExpanded && (
        <div className="mt-2 pl-4 border-l-2 border-outline-variant/30">
          {properties.map((prop) => (
            <VariableInput
              key={prop.name}
              definition={prop}
              value={objectValue[prop.name]}
              onChange={(v) => updateProperty(prop.name, v)}
              disabled={disabled}
              compact
            />
          ))}
        </div>
      )}

      {error && (
        <p className="flex items-center gap-1 text-xs text-error mt-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Parse a default value string to the appropriate type.
 */
function parseDefaultValue(defaultValue: string, type: VariableType): unknown {
  try {
    switch (type) {
      case 'number':
        return Number(defaultValue);
      case 'boolean':
        return defaultValue === 'true';
      case 'array':
      case 'object':
      case 'currency':
        return JSON.parse(defaultValue);
      default:
        return defaultValue;
    }
  } catch {
    return defaultValue;
  }
}
