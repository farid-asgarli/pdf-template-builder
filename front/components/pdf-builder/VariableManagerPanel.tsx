'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  Button,
  Input,
  Select,
  Textarea,
  Switch,
  IconButton,
  Tooltip,
  Badge,
} from '@/app/ui/primitives';
import {
  Plus,
  Trash2,
  Edit2,
  Copy,
  X,
  Variable,
  Type,
  Hash,
  Calendar,
  ToggleLeft,
  DollarSign,
  List,
  Braces,
  GripVertical,
  AlertCircle,
  Info,
} from 'lucide-react';
import { useDocumentStore } from '@/lib/store/documentStore';
import type { VariableDefinition, VariableType } from '@/lib/types/variable.types';

// ─────────────────────────────────────────────────────────────────────────────
// Type Constants
// ─────────────────────────────────────────────────────────────────────────────

const VARIABLE_TYPE_OPTIONS = [
  { value: 'string', label: 'Text', icon: Type, description: 'Plain text content' },
  { value: 'number', label: 'Number', icon: Hash, description: 'Numeric values' },
  { value: 'date', label: 'Date', icon: Calendar, description: 'Date values with formatting' },
  { value: 'boolean', label: 'Yes/No', icon: ToggleLeft, description: 'True or false values' },
  { value: 'currency', label: 'Currency', icon: DollarSign, description: 'Money with currency symbol' },
  { value: 'array', label: 'List', icon: List, description: 'Repeating items for loops' },
  { value: 'object', label: 'Object', icon: Braces, description: 'Nested properties' },
] as const;

const DATE_FORMAT_OPTIONS = [
  { value: 'MM/dd/yyyy', label: 'MM/DD/YYYY (01/15/2024)' },
  { value: 'dd/MM/yyyy', label: 'DD/MM/YYYY (15/01/2024)' },
  { value: 'yyyy-MM-dd', label: 'YYYY-MM-DD (2024-01-15)' },
  { value: 'MMMM dd, yyyy', label: 'Month DD, YYYY (January 15, 2024)' },
  { value: 'dd MMMM yyyy', label: 'DD Month YYYY (15 January 2024)' },
  { value: 'MMM dd, yyyy', label: 'Mon DD, YYYY (Jan 15, 2024)' },
];

const NUMBER_FORMAT_OPTIONS = [
  { value: 'N0', label: 'Integer (1,234)' },
  { value: 'N2', label: '2 Decimals (1,234.56)' },
  { value: 'N4', label: '4 Decimals (1,234.5678)' },
  { value: 'P0', label: 'Percentage (12%)' },
  { value: 'P2', label: 'Percentage (12.34%)' },
];

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD - US Dollar ($)' },
  { value: 'EUR', label: 'EUR - Euro (€)' },
  { value: 'GBP', label: 'GBP - British Pound (£)' },
  { value: 'JPY', label: 'JPY - Japanese Yen (¥)' },
  { value: 'CAD', label: 'CAD - Canadian Dollar ($)' },
  { value: 'AUD', label: 'AUD - Australian Dollar ($)' },
  { value: 'CHF', label: 'CHF - Swiss Franc' },
  { value: 'CNY', label: 'CNY - Chinese Yuan (¥)' },
  { value: 'INR', label: 'INR - Indian Rupee (₹)' },
];

const DEFAULT_CATEGORIES = ['General', 'Personal Info', 'Contact', 'Financial', 'Dates', 'Custom'];

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

function getTypeIcon(type: VariableType) {
  const typeOption = VARIABLE_TYPE_OPTIONS.find((t) => t.value === type);
  const Icon = typeOption?.icon || Variable;
  return <Icon className="h-4 w-4" />;
}

function getTypeColor(type: VariableType): string {
  const colors: Record<VariableType, string> = {
    string: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    number: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    date: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    boolean: 'bg-green-500/10 text-green-600 border-green-500/20',
    currency: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    array: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
    object: 'bg-pink-500/10 text-pink-600 border-pink-500/20',
  };
  return colors[type] || 'bg-gray-500/10 text-gray-600 border-gray-500/20';
}

function validateVariableName(name: string, existingNames: string[], currentName?: string): string | null {
  if (!name.trim()) return 'Variable name is required';
  if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(name)) {
    return 'Name must start with a letter and contain only letters, numbers, and underscores';
  }
  if (name.length > 50) return 'Name must be 50 characters or less';
  if (existingNames.includes(name) && name !== currentName) {
    return 'A variable with this name already exists';
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Variable Editor Dialog
// ─────────────────────────────────────────────────────────────────────────────

interface VariableEditorProps {
  variable: Partial<VariableDefinition> | null;
  existingNames: string[];
  onSave: (variable: VariableDefinition) => void;
  onClose: () => void;
}

function VariableEditor({ variable, existingNames, onSave, onClose }: VariableEditorProps) {
  const isEditing = !!variable?.name;
  const [formData, setFormData] = useState<Partial<VariableDefinition>>({
    name: '',
    type: 'string',
    label: '',
    description: '',
    required: false,
    defaultValue: '',
    format: '',
    category: 'General',
    isComputed: false,
    ...variable,
  });
  const [nameError, setNameError] = useState<string | null>(null);

  const handleNameChange = useCallback(
    (value: string) => {
      // Auto-format: remove spaces, convert to camelCase
      const formatted = value.replace(/\s+/g, '').replace(/[^a-zA-Z0-9_]/g, '');
      setFormData((prev) => ({ ...prev, name: formatted }));
      setNameError(validateVariableName(formatted, existingNames, variable?.name));
    },
    [existingNames, variable?.name]
  );

  const handleLabelChange = useCallback((value: string) => {
    setFormData((prev) => {
      // Auto-generate name from label if name is empty or matches previous auto-generated name
      const autoName = value
        .trim()
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .split(/\s+/)
        .map((word, i) => (i === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()))
        .join('');

      if (!prev.name || prev.name === '' || prev.label?.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === prev.name.toLowerCase()) {
        return { ...prev, label: value, name: autoName };
      }
      return { ...prev, label: value };
    });
  }, []);

  const handleTypeChange = useCallback((value: string) => {
    setFormData((prev) => ({
      ...prev,
      type: value as VariableType,
      format: '', // Reset format when type changes
      defaultValue: '', // Reset default value
      itemSchema: value === 'array' ? [] : undefined,
      properties: value === 'object' ? [] : undefined,
    }));
  }, []);

  const handleSave = useCallback(() => {
    const error = validateVariableName(formData.name || '', existingNames, variable?.name);
    if (error) {
      setNameError(error);
      return;
    }

    const newVariable: VariableDefinition = {
      name: formData.name!,
      type: formData.type as VariableType,
      label: formData.label || formData.name!,
      description: formData.description,
      required: formData.required || false,
      defaultValue: formData.defaultValue,
      format: formData.format,
      category: formData.category || 'General',
      order: variable?.order ?? 0,
      isComputed: formData.isComputed || false,
      expression: formData.expression,
      dependsOn: formData.dependsOn,
      itemSchema: formData.itemSchema,
      properties: formData.properties,
    };

    onSave(newVariable);
  }, [formData, existingNames, variable, onSave]);

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Variable' : 'Add Variable'}</DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-4">
          {/* Label */}
          <div>
            <Input
              label="Label"
              value={formData.label || ''}
              onChange={(e) => handleLabelChange(e.target.value)}
              placeholder="e.g., Customer Name"
              size="sm"
            />
            <p className="mt-1 text-xs text-on-surface-variant">Display name shown in the UI</p>
          </div>

          {/* Name */}
          <div>
            <Input
              label="Variable Name"
              value={formData.name || ''}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g., customerName"
              size="sm"
              error={nameError || undefined}
            />
            {nameError ? (
              <p className="mt-1 text-xs text-error">{nameError}</p>
            ) : (
              <p className="mt-1 text-xs text-on-surface-variant">
                Use in templates as:{' '}
                <code className="px-1 py-0.5 bg-surface-container rounded text-primary">{`{{${formData.name || 'variableName'}}}`}</code>
              </p>
            )}
          </div>

          {/* Type Selection */}
          <div>
            <label className="text-sm font-medium text-on-surface mb-2 block">Type</label>
            <div className="grid grid-cols-4 gap-2">
              {VARIABLE_TYPE_OPTIONS.slice(0, 5).map((opt) => {
                const Icon = opt.icon;
                const isSelected = formData.type === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleTypeChange(opt.value)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-outline-variant/30 hover:border-outline-variant hover:bg-surface-container'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs font-medium">{opt.label}</span>
                  </button>
                );
              })}
            </div>
            {/* Advanced types */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              {VARIABLE_TYPE_OPTIONS.slice(5).map((opt) => {
                const Icon = opt.icon;
                const isSelected = formData.type === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleTypeChange(opt.value)}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-outline-variant/30 hover:border-outline-variant hover:bg-surface-container'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <div className="text-left">
                      <span className="text-xs font-medium block">{opt.label}</span>
                      <span className="text-[10px] text-on-surface-variant">{opt.description}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Type-specific options */}
          {formData.type === 'date' && (
            <Select
              label="Date Format"
              options={DATE_FORMAT_OPTIONS}
              value={formData.format || 'MM/dd/yyyy'}
              onChange={(v) => setFormData((prev) => ({ ...prev, format: v }))}
              size="sm"
            />
          )}

          {formData.type === 'number' && (
            <Select
              label="Number Format"
              options={NUMBER_FORMAT_OPTIONS}
              value={formData.format || 'N0'}
              onChange={(v) => setFormData((prev) => ({ ...prev, format: v }))}
              size="sm"
            />
          )}

          {formData.type === 'currency' && (
            <Select
              label="Currency"
              options={CURRENCY_OPTIONS}
              value={formData.format || 'USD'}
              onChange={(v) => setFormData((prev) => ({ ...prev, format: v }))}
              size="sm"
            />
          )}

          {/* Description */}
          <div>
            <Textarea
              label="Description"
              value={formData.description || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Optional description of what this variable is used for..."
              rows={2}
              variant="filled"
            />
          </div>

          {/* Default Value */}
          {formData.type !== 'array' && formData.type !== 'object' && (
            <div>
              <Input
                label="Default Value"
                value={formData.defaultValue || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, defaultValue: e.target.value }))}
                placeholder={formData.type === 'boolean' ? 'true or false' : 'Optional default value'}
                size="sm"
              />
            </div>
          )}

          {/* Category */}
          <div>
            <Select
              label="Category"
              options={DEFAULT_CATEGORIES.map((c) => ({ value: c, label: c }))}
              value={formData.category || 'General'}
              onChange={(v) => setFormData((prev) => ({ ...prev, category: v }))}
              size="sm"
            />
          </div>

          {/* Required toggle */}
          <div className="flex items-center justify-between py-2">
            <div>
              <span className="text-sm font-medium text-on-surface">Required</span>
              <p className="text-xs text-on-surface-variant">Must be provided when generating PDF</p>
            </div>
            <Switch checked={formData.required || false} onChange={(e) => setFormData((prev) => ({ ...prev, required: e.target.checked }))} />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="text" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="filled" onClick={handleSave} disabled={!!nameError || !formData.name}>
            {isEditing ? 'Save Changes' : 'Add Variable'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Variable List Item
// ─────────────────────────────────────────────────────────────────────────────

interface VariableListItemProps {
  variable: VariableDefinition;
  onEdit: () => void;
  onDelete: () => void;
  onCopyPlaceholder: () => void;
}

function VariableListItem({ variable, onEdit, onDelete, onCopyPlaceholder }: VariableListItemProps) {
  return (
    <div className="group flex items-center gap-3 p-3 rounded-lg border border-outline-variant/20 hover:border-outline-variant/40 hover:bg-surface-container/50 transition-all">
      {/* Drag Handle */}
      <div className="cursor-grab opacity-0 group-hover:opacity-50 transition-opacity">
        <GripVertical className="h-4 w-4 text-on-surface-variant" />
      </div>

      {/* Type Icon */}
      <div className={`flex items-center justify-center w-8 h-8 rounded-lg border ${getTypeColor(variable.type)}`}>{getTypeIcon(variable.type)}</div>

      {/* Variable Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-on-surface truncate">{variable.label || variable.name}</span>
          {variable.required && (
            <Badge variant="error" size="sm">
              Required
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <code className="text-xs text-primary bg-primary/5 px-1.5 py-0.5 rounded">{`{{${variable.name}}}`}</code>
          <span className="text-xs text-on-surface-variant capitalize">{variable.type}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Tooltip content="Copy placeholder">
          <IconButton variant="ghost" size="sm" aria-label="Copy placeholder" icon={<Copy className="h-3.5 w-3.5" />} onClick={onCopyPlaceholder} />
        </Tooltip>
        <Tooltip content="Edit">
          <IconButton variant="ghost" size="sm" aria-label="Edit variable" icon={<Edit2 className="h-3.5 w-3.5" />} onClick={onEdit} />
        </Tooltip>
        <Tooltip content="Delete">
          <IconButton
            variant="ghost"
            size="sm"
            aria-label="Delete variable"
            icon={<Trash2 className="h-3.5 w-3.5 text-error" />}
            onClick={onDelete}
          />
        </Tooltip>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Variable Manager Panel
// ─────────────────────────────────────────────────────────────────────────────

interface VariableManagerPanelProps {
  open: boolean;
  onClose: () => void;
}

export function VariableManagerPanel({ open, onClose }: VariableManagerPanelProps) {
  const { document, addVariableDefinition, updateVariableDefinition, deleteVariableDefinition } = useDocumentStore();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingVariable, setEditingVariable] = useState<VariableDefinition | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const variables = useMemo(() => document?.variableDefinitions || [], [document?.variableDefinitions]);
  const existingNames = useMemo(() => variables.map((v) => v.name), [variables]);

  // Group variables by category
  const groupedVariables = useMemo(() => {
    const filtered = variables.filter((v) => {
      const matchesSearch =
        !searchQuery || v.name.toLowerCase().includes(searchQuery.toLowerCase()) || v.label.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || v.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    const groups = new Map<string, VariableDefinition[]>();
    filtered.forEach((v) => {
      const category = v.category || 'General';
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(v);
    });
    return groups;
  }, [variables, searchQuery, selectedCategory]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(variables.map((v) => v.category || 'General'));
    return Array.from(cats).sort();
  }, [variables]);

  const handleAddVariable = useCallback(() => {
    setEditingVariable(null);
    setEditorOpen(true);
  }, []);

  const handleEditVariable = useCallback((variable: VariableDefinition) => {
    setEditingVariable(variable);
    setEditorOpen(true);
  }, []);

  const handleSaveVariable = useCallback(
    (variable: VariableDefinition) => {
      if (editingVariable) {
        // Update existing
        if (editingVariable.name !== variable.name) {
          // Name changed - need to delete old and add new
          deleteVariableDefinition(editingVariable.name);
          addVariableDefinition(variable);
        } else {
          updateVariableDefinition(variable.name, variable);
        }
      } else {
        // Add new
        addVariableDefinition(variable);
      }
      setEditorOpen(false);
      setEditingVariable(null);
    },
    [editingVariable, addVariableDefinition, updateVariableDefinition, deleteVariableDefinition]
  );

  const handleDeleteVariable = useCallback(
    (name: string) => {
      deleteVariableDefinition(name);
    },
    [deleteVariableDefinition]
  );

  const handleCopyPlaceholder = useCallback((name: string) => {
    navigator.clipboard.writeText(`{{${name}}}`);
  }, []);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/30" onClick={onClose} />

        {/* Panel */}
        <div className="relative ml-auto w-full max-w-md bg-surface shadow-xl flex flex-col animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/20">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                <Variable className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-on-surface">Variables</h2>
                <p className="text-xs text-on-surface-variant">
                  {variables.length} variable{variables.length !== 1 ? 's' : ''} defined
                </p>
              </div>
            </div>
            <IconButton variant="ghost" aria-label="Close panel" icon={<X className="h-5 w-5" />} onClick={onClose} />
          </div>

          {/* Search & Filter */}
          <div className="px-4 py-3 border-b border-outline-variant/10 space-y-2">
            <Input
              placeholder="Search variables..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="sm"
              className="w-full"
            />
            {categories.length > 1 && (
              <div className="flex gap-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => setSelectedCategory(null)}
                  className={`px-2 py-1 text-xs rounded-full transition-colors ${
                    !selectedCategory ? 'bg-primary text-on-primary' : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
                  }`}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2 py-1 text-xs rounded-full transition-colors ${
                      selectedCategory === cat
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Variable List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {variables.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-4">
                  <Variable className="h-8 w-8 text-on-surface-variant/50" />
                </div>
                <h3 className="text-sm font-medium text-on-surface mb-1">No variables defined</h3>
                <p className="text-xs text-on-surface-variant max-w-50">Create variables to use dynamic content in your document templates.</p>
              </div>
            ) : groupedVariables.size === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle className="h-8 w-8 text-on-surface-variant/50 mb-2" />
                <p className="text-sm text-on-surface-variant">No variables match your search</p>
              </div>
            ) : (
              Array.from(groupedVariables.entries()).map(([category, vars]) => (
                <div key={category}>
                  {groupedVariables.size > 1 && (
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2">{category}</h3>
                  )}
                  <div className="space-y-2">
                    {vars.map((variable) => (
                      <VariableListItem
                        key={variable.name}
                        variable={variable}
                        onEdit={() => handleEditVariable(variable)}
                        onDelete={() => handleDeleteVariable(variable.name)}
                        onCopyPlaceholder={() => handleCopyPlaceholder(variable.name)}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-outline-variant/20">
            <Button variant="filled" className="w-full" onClick={handleAddVariable}>
              <Plus className="h-4 w-4 mr-2" />
              Add Variable
            </Button>
          </div>

          {/* Info */}
          <div className="px-4 py-3 bg-surface-container/50 border-t border-outline-variant/10">
            <div className="flex items-start gap-2 text-xs text-on-surface-variant">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <p>
                Use variables in text fields with the syntax <code className="px-1 py-0.5 bg-surface-container rounded">{`{{variableName}}`}</code>.
                Values are provided when generating the PDF.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Variable Editor Dialog */}
      {editorOpen && (
        <VariableEditor
          variable={editingVariable}
          existingNames={existingNames}
          onSave={handleSaveVariable}
          onClose={() => {
            setEditorOpen(false);
            setEditingVariable(null);
          }}
        />
      )}
    </>
  );
}
