// Variable System Types
// Matches backend DTOs for comprehensive variable support

/**
 * Variable type options matching backend VariableTypes class.
 */
export type VariableType = 'string' | 'number' | 'date' | 'boolean' | 'currency' | 'array' | 'object';

/**
 * Variable definition - describes a variable's schema for validation and UI generation.
 * Matches backend VariableDefinitionDto.
 */
export interface VariableDefinition {
  name: string;
  type: VariableType;
  label: string;
  description?: string;
  required: boolean;
  defaultValue?: string;
  /** Validation pattern (regex) for string/number types */
  pattern?: string;
  /** Format string for date/currency types (e.g., "MMMM dd, yyyy" or "C2") */
  format?: string;
  /** Category for grouping in UI */
  category?: string;
  /** Display order within category */
  order: number;

  // Array type properties
  /** Schema for array items (for type='array') */
  itemSchema?: VariableDefinition[];
  minItems?: number;
  maxItems?: number;

  // Object type properties
  /** Properties for object type (for type='object') */
  properties?: VariableDefinition[];

  // Computed variable properties
  /** If true, this variable is computed from other variables */
  isComputed: boolean;
  /** Expression to evaluate for computed variables */
  expression?: string;
  /** List of variable names this computed variable depends on */
  dependsOn?: string[];
}

/**
 * Response from GET /api/documents/{id}/variables or /api/templates/{id}/variables
 */
export interface VariableDefinitionsResponse {
  id: string;
  variables: VariableDefinition[];
}

/**
 * Result from variable analysis endpoint.
 */
export interface VariableAnalysisResult {
  /** Defined variable definitions in the document */
  definitions: VariableDefinition[];
  /** All variable placeholders detected in content ({{variableName}}) */
  detectedPlaceholders: string[];
  /** Variables used in content but not defined */
  undefinedVariables: string[];
  /** Variables defined but not used in content */
  unusedDefinitions: string[];
}

/**
 * Variable validation error.
 */
export interface VariableValidationError {
  variableName: string;
  errorType: string;
  message: string;
}

/**
 * Result from variable validation.
 */
export interface VariableValidationResult {
  isValid: boolean;
  errors: VariableValidationError[];
}

/**
 * Variable history record.
 */
export interface VariableHistoryRecord {
  id: number;
  documentId: string;
  version: number;
  createdAt: string;
  generatedBy?: string;
  notes?: string;
  pdfHash?: string;
  pdfSizeBytes?: number;
  variables: Record<string, unknown>;
}

/**
 * Request to generate PDF with variables.
 */
export interface GeneratePdfWithVariablesRequest {
  variables?: Record<string, unknown>;
  saveToHistory?: boolean;
  generatedBy?: string;
  notes?: string;
}

/**
 * Bulk generation job status.
 */
export type BulkJobStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * Bulk generation error detail.
 */
export interface BulkGenerationError {
  rowIndex: number;
  message: string;
}

/**
 * Bulk generation job response.
 */
export interface BulkGenerationJob {
  id: number;
  documentId: string;
  status: BulkJobStatus;
  totalItems: number;
  processedItems: number;
  failedItems: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  sourceFileName?: string;
  createdBy?: string;
  errors?: BulkGenerationError[];
}

/**
 * Bulk data preview from uploaded file.
 */
export interface BulkDataPreview {
  headers: string[];
  sampleRows: Record<string, string>[];
  totalRows: number;
  suggestedMappings: Record<string, string>;
}

/**
 * Currency value type for currency variables.
 */
export interface CurrencyValue {
  value: number;
  currency: string;
}

// ============================================================================
// Helper functions
// ============================================================================

/**
 * Check if a variable type is primitive (not array or object).
 */
export function isPrimitiveType(type: VariableType): boolean {
  return type !== 'array' && type !== 'object';
}

/**
 * Check if a variable type is complex (array or object).
 */
export function isComplexType(type: VariableType): boolean {
  return type === 'array' || type === 'object';
}

/**
 * Get a human-readable label for a variable type.
 */
export function getVariableTypeLabel(type: VariableType): string {
  const labels: Record<VariableType, string> = {
    string: 'Text',
    number: 'Number',
    date: 'Date',
    boolean: 'Yes/No',
    currency: 'Currency',
    array: 'List',
    object: 'Object',
  };
  return labels[type];
}

/**
 * Get a default value for a variable type.
 */
export function getDefaultValueForType(type: VariableType): unknown {
  switch (type) {
    case 'string':
      return '';
    case 'number':
      return 0;
    case 'date':
      return new Date().toISOString().split('T')[0];
    case 'boolean':
      return false;
    case 'currency':
      return { value: 0, currency: 'USD' };
    case 'array':
      return [];
    case 'object':
      return {};
    default:
      return '';
  }
}

/**
 * Create a default variable definition.
 */
export function createDefaultVariableDefinition(name: string = ''): VariableDefinition {
  return {
    name,
    type: 'string',
    label: name || 'New Variable',
    required: false,
    order: 0,
    isComputed: false,
  };
}

/**
 * Group variable definitions by category.
 */
export function groupVariablesByCategory(variables: VariableDefinition[]): Map<string, VariableDefinition[]> {
  const groups = new Map<string, VariableDefinition[]>();

  for (const variable of variables) {
    const category = variable.category || 'General';
    const existing = groups.get(category) || [];
    existing.push(variable);
    groups.set(category, existing);
  }

  // Sort within each category by order
  for (const [category, vars] of groups) {
    groups.set(
      category,
      vars.sort((a, b) => a.order - b.order)
    );
  }

  return groups;
}

/**
 * Validate a single variable value against its definition.
 */
export function validateVariableValue(definition: VariableDefinition, value: unknown): string | null {
  // Check required
  if (definition.required) {
    if (value === undefined || value === null || value === '') {
      return `${definition.label} is required`;
    }
  }

  // Skip validation if empty and not required
  if (value === undefined || value === null || value === '') {
    return null;
  }

  // Type-specific validation
  switch (definition.type) {
    case 'number': {
      const num = Number(value);
      if (isNaN(num)) {
        return `${definition.label} must be a valid number`;
      }
      break;
    }
    case 'date': {
      const date = new Date(value as string);
      if (isNaN(date.getTime())) {
        return `${definition.label} must be a valid date`;
      }
      break;
    }
    case 'boolean': {
      if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
        return `${definition.label} must be true or false`;
      }
      break;
    }
    case 'currency': {
      const currVal = value as CurrencyValue;
      if (typeof currVal !== 'object' || typeof currVal.value !== 'number') {
        return `${definition.label} must be a valid currency value`;
      }
      break;
    }
    case 'array': {
      if (!Array.isArray(value)) {
        return `${definition.label} must be a list`;
      }
      if (definition.minItems && value.length < definition.minItems) {
        return `${definition.label} must have at least ${definition.minItems} items`;
      }
      if (definition.maxItems && value.length > definition.maxItems) {
        return `${definition.label} must have at most ${definition.maxItems} items`;
      }
      break;
    }
  }

  // Pattern validation
  if (definition.pattern && typeof value === 'string') {
    const regex = new RegExp(definition.pattern);
    if (!regex.test(value)) {
      return `${definition.label} does not match the required format`;
    }
  }

  return null;
}
