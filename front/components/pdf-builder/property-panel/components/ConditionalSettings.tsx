'use client';

import { useCallback } from 'react';
import { Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { Button, Select, Input, Checkbox } from '@/app/ui/primitives';
import { useDocumentStore } from '@/lib/store/documentStore';
import type { Component, ConditionalConfig, ConditionalRule, ConditionalOperator } from '@/lib/types/document.types';

interface ConditionalSettingsProps {
  component: Component;
}

// Operator options for the select dropdown
const OPERATOR_OPTIONS: { value: ConditionalOperator; label: string; needsValue: boolean }[] = [
  { value: 'equals', label: 'Equals', needsValue: true },
  { value: 'not_equals', label: 'Not equals', needsValue: true },
  { value: 'contains', label: 'Contains', needsValue: true },
  { value: 'not_contains', label: 'Does not contain', needsValue: true },
  { value: 'starts_with', label: 'Starts with', needsValue: true },
  { value: 'ends_with', label: 'Ends with', needsValue: true },
  { value: 'greater_than', label: 'Greater than', needsValue: true },
  { value: 'less_than', label: 'Less than', needsValue: true },
  { value: 'greater_than_or_equals', label: 'Greater than or equals', needsValue: true },
  { value: 'less_than_or_equals', label: 'Less than or equals', needsValue: true },
  { value: 'is_empty', label: 'Is empty', needsValue: false },
  { value: 'is_not_empty', label: 'Is not empty', needsValue: false },
  { value: 'is_true', label: 'Is true', needsValue: false },
  { value: 'is_false', label: 'Is false', needsValue: false },
];

const LOGIC_OPTIONS = [
  { value: 'all', label: 'ALL conditions (AND)' },
  { value: 'any', label: 'ANY condition (OR)' },
];

/**
 * Create a default empty condition config
 */
function createDefaultCondition(): ConditionalConfig {
  return {
    enabled: true,
    logic: 'all',
    rules: [{ variable: '', operator: 'equals', value: '' }],
  };
}

/**
 * Create a default empty rule
 */
function createDefaultRule(): ConditionalRule {
  return { variable: '', operator: 'equals', value: '' };
}

export function ConditionalSettings({ component }: ConditionalSettingsProps) {
  const { updateComponent, document } = useDocumentStore();
  const condition = component.condition;

  // Get available variables from the document
  const getAvailableVariables = (): { value: string; label: string }[] => {
    const vars: { value: string; label: string }[] = [];

    // Add from variableDefinitions if available
    if (document?.variableDefinitions) {
      document.variableDefinitions.forEach((def) => {
        vars.push({
          value: def.name,
          label: def.label || def.name,
        });
      });
    }

    // Add from variables object
    if (document?.variables) {
      Object.keys(document.variables).forEach((key) => {
        if (!vars.find((v) => v.value === key)) {
          vars.push({ value: key, label: key });
        }
      });
    }

    // Add common system variables
    const systemVars = ['pageNumber', 'totalPages', 'date', 'year'];
    systemVars.forEach((v) => {
      if (!vars.find((x) => x.value === v)) {
        vars.push({ value: v, label: `{{${v}}}` });
      }
    });

    return vars;
  };

  const availableVariables = getAvailableVariables();

  // Toggle conditional rendering on/off
  const handleToggleEnabled = useCallback(() => {
    if (condition) {
      // Toggle existing condition
      updateComponent(component.id, {
        condition: { ...condition, enabled: !condition.enabled },
      });
    } else {
      // Create new condition config
      updateComponent(component.id, {
        condition: createDefaultCondition(),
      });
    }
  }, [component.id, condition, updateComponent]);

  // Remove conditional config entirely
  const handleRemoveCondition = useCallback(() => {
    updateComponent(component.id, {
      condition: undefined,
    });
  }, [component.id, updateComponent]);

  // Update logic (all/any)
  const handleLogicChange = useCallback(
    (value: string) => {
      if (condition) {
        updateComponent(component.id, {
          condition: { ...condition, logic: value as 'all' | 'any' },
        });
      }
    },
    [component.id, condition, updateComponent]
  );

  // Add a new rule
  const handleAddRule = useCallback(() => {
    if (condition) {
      updateComponent(component.id, {
        condition: {
          ...condition,
          rules: [...condition.rules, createDefaultRule()],
        },
      });
    }
  }, [component.id, condition, updateComponent]);

  // Update a specific rule
  const handleRuleChange = useCallback(
    (index: number, field: keyof ConditionalRule, value: string) => {
      if (condition) {
        const newRules = [...condition.rules];
        newRules[index] = { ...newRules[index], [field]: value };
        updateComponent(component.id, {
          condition: { ...condition, rules: newRules },
        });
      }
    },
    [component.id, condition, updateComponent]
  );

  // Remove a rule
  const handleRemoveRule = useCallback(
    (index: number) => {
      if (condition && condition.rules.length > 1) {
        const newRules = condition.rules.filter((_, i) => i !== index);
        updateComponent(component.id, {
          condition: { ...condition, rules: newRules },
        });
      }
    },
    [component.id, condition, updateComponent]
  );

  // Check if operator needs a value
  const operatorNeedsValue = (operator: ConditionalOperator): boolean => {
    return OPERATOR_OPTIONS.find((o) => o.value === operator)?.needsValue ?? true;
  };

  const isEnabled = condition?.enabled ?? false;
  const hasCondition = !!condition;

  return (
    <div className='space-y-4'>
      {/* Enable/Disable Toggle */}
      <div className='flex items-center justify-between rounded-xl border border-outline-variant/30 bg-surface-container/30 px-3 py-2.5'>
        <div className='flex items-center gap-2'>
          {isEnabled ? <Eye className='h-4 w-4 text-primary' /> : <EyeOff className='h-4 w-4 text-on-surface-variant' />}
          <span className='text-sm font-medium text-on-surface'>{hasCondition ? 'Conditional visibility' : 'Always visible'}</span>
        </div>
        <Checkbox checked={isEnabled} onChange={handleToggleEnabled} label='' />
      </div>

      {/* Conditional Configuration (shown when enabled) */}
      {hasCondition && isEnabled && (
        <div className='space-y-3 rounded-xl border border-outline-variant/30 bg-surface-container/30 p-3'>
          {/* Logic selector */}
          <div className='flex items-center gap-2 text-xs text-on-surface-variant'>
            <span>Show component when</span>
            <Select value={condition.logic} onChange={handleLogicChange} options={LOGIC_OPTIONS} size='sm' className='w-44' />
            <span>match:</span>
          </div>

          {/* Rules */}
          <div className='space-y-2'>
            {condition.rules.map((rule, index) => (
              <div key={index} className='flex items-start gap-2 rounded-lg border border-outline-variant/20 bg-surface/50 p-2'>
                <div className='flex flex-1 flex-col gap-2'>
                  {/* Variable selector */}
                  <div className='flex items-center gap-2'>
                    <span className='text-xs text-on-surface-variant min-w-14'>Variable:</span>
                    {availableVariables.length > 0 ? (
                      <Select
                        value={rule.variable}
                        onChange={(value) => handleRuleChange(index, 'variable', value)}
                        options={[{ value: '', label: 'Select variable...' }, ...availableVariables]}
                        size='sm'
                        className='flex-1'
                      />
                    ) : (
                      <Input
                        value={rule.variable}
                        onChange={(e) => handleRuleChange(index, 'variable', e.target.value)}
                        placeholder='variableName'
                        size='sm'
                        className='flex-1'
                      />
                    )}
                  </div>

                  {/* Operator selector */}
                  <div className='flex items-center gap-2'>
                    <span className='text-xs text-on-surface-variant min-w-14'>Operator:</span>
                    <Select
                      value={rule.operator}
                      onChange={(value) => handleRuleChange(index, 'operator', value)}
                      options={OPERATOR_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                      size='sm'
                      className='flex-1'
                    />
                  </div>

                  {/* Value input (only if operator needs it) */}
                  {operatorNeedsValue(rule.operator) && (
                    <div className='flex items-center gap-2'>
                      <span className='text-xs text-on-surface-variant min-w-14'>Value:</span>
                      <Input
                        value={rule.value ?? ''}
                        onChange={(e) => handleRuleChange(index, 'value', e.target.value)}
                        placeholder='Enter value...'
                        size='sm'
                        className='flex-1'
                      />
                    </div>
                  )}
                </div>

                {/* Remove rule button */}
                {condition.rules.length > 1 && (
                  <Button variant='text' size='sm' onClick={() => handleRemoveRule(index)} className='shrink-0 p-1.5 text-on-surface-variant hover:text-error'>
                    <Trash2 className='h-4 w-4' />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Add rule button */}
          <Button variant='outline' size='sm' onClick={handleAddRule} className='w-full gap-1.5'>
            <Plus className='h-4 w-4' />
            Add condition
          </Button>

          {/* Remove all conditions */}
          <button onClick={handleRemoveCondition} className='w-full text-center text-xs text-on-surface-variant hover:text-error transition-colors py-1'>
            Remove conditional rendering
          </button>
        </div>
      )}

      {/* Info text */}
      <p className='text-xs text-on-surface-variant/70 px-1'>
        {hasCondition && isEnabled
          ? 'Component will only render in the PDF when the specified conditions are met.'
          : 'Enable conditional visibility to show/hide this component based on variable values.'}
      </p>
    </div>
  );
}
