// API Client for PDF Builder Backend
// Handles all communication with the .NET backend

import type {
  Document,
  DocumentResponse,
  CreateDocumentRequest,
  UpdateDocumentRequest,
  Template,
  TemplateResponse,
  CreateTemplateRequest,
  UpdateTemplateRequest,
  TemplateContent,
} from '@/lib/types/document.types';

import type {
  VariableDefinition,
  VariableDefinitionsResponse,
  VariableAnalysisResult,
  VariableValidationResult,
  VariableHistoryRecord,
  GeneratePdfWithVariablesRequest,
  BulkGenerationJob,
  BulkDataPreview,
} from '@/lib/types/variable.types';

// Base URL for the API - defaults to localhost for development
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5043';

// Custom error class for API errors
export class ApiError extends Error {
  constructor(public status: number, message: string, public data?: unknown) {
    super(message);
    this.name = 'ApiError';
  }
}

// Generic fetch wrapper with error handling
async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errorData: unknown;
    try {
      errorData = await response.json();
    } catch {
      errorData = await response.text();
    }
    throw new ApiError(response.status, `API Error: ${response.statusText}`, errorData);
  }

  // Handle empty responses (204 No Content)
  if (response.status === 204) {
    return undefined as T;
  }

  // Check content type for proper parsing
  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return response.json();
  }

  return response.text() as T;
}

// ============================================================================
// Document API Functions
// ============================================================================

/**
 * Fetch all documents (for dashboard/listing)
 */
export async function fetchDocuments(): Promise<DocumentResponse[]> {
  return fetchApi<DocumentResponse[]>('/api/documents');
}

/**
 * Fetch a single document by ID
 */
export async function fetchDocument(id: string): Promise<DocumentResponse> {
  return fetchApi<DocumentResponse>(`/api/documents/${id}`);
}

/**
 * Create a new document
 */
export async function createDocument(title: string): Promise<DocumentResponse> {
  const request: CreateDocumentRequest = { title };
  return fetchApi<DocumentResponse>('/api/documents', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

/**
 * Update an existing document
 */
export async function updateDocument(id: string, data: UpdateDocumentRequest): Promise<DocumentResponse> {
  return fetchApi<DocumentResponse>(`/api/documents/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Delete a document
 */
export async function deleteDocument(id: string): Promise<void> {
  return fetchApi<void>(`/api/documents/${id}`, {
    method: 'DELETE',
  });
}

// ============================================================================
// PDF Generation Functions
// ============================================================================

/**
 * Generate PDF from a saved document and trigger download
 */
export async function generatePdf(id: string): Promise<Blob> {
  const url = `${API_BASE_URL}/api/documents/${id}/generate-pdf`;

  const response = await fetch(url, {
    method: 'POST',
  });

  if (!response.ok) {
    let errorData: unknown;
    try {
      errorData = await response.json();
    } catch {
      errorData = await response.text();
    }
    throw new ApiError(response.status, `PDF Generation Error: ${response.statusText}`, errorData);
  }

  return response.blob();
}

/**
 * Generate PDF preview from document content (without saving)
 */
export async function generatePdfPreview(content: string): Promise<Blob> {
  const url = `${API_BASE_URL}/api/generate-pdf-preview`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    let errorData: unknown;
    try {
      errorData = await response.json();
    } catch {
      errorData = await response.text();
    }
    throw new ApiError(response.status, `PDF Preview Error: ${response.statusText}`, errorData);
  }

  return response.blob();
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = window.document.createElement('a');
  link.href = url;
  link.download = filename;
  window.document.body.appendChild(link);
  link.click();
  window.document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Convert frontend Document type to API content string
 */
export function serializeDocumentContent(document: Document): string {
  // Extract only the content parts (not metadata like id, title, timestamps)
  const content = {
    pages: document.pages,
    headerFooter: document.headerFooter,
    variables: document.variables,
    variableDefinitions: document.variableDefinitions,
  };
  return JSON.stringify(content);
}

/**
 * Parse API document response into frontend Document type
 */
export function parseDocumentResponse(response: DocumentResponse): Document {
  let parsedContent: Pick<Document, 'pages' | 'headerFooter' | 'variables' | 'variableDefinitions'>;

  try {
    parsedContent = JSON.parse(response.content);
  } catch {
    // If content is empty or invalid, create default structure
    parsedContent = {
      pages: [
        {
          id: `page-${Date.now()}`,
          pageNumber: 1,
          headerType: 'default',
          footerType: 'default',
          components: [],
        },
      ],
      headerFooter: {
        defaultHeader: { height: 25, components: [] },
        defaultFooter: { height: 15, components: [] },
      },
      variables: {},
      variableDefinitions: [],
    };
  }

  return {
    id: response.id,
    title: response.title,
    createdAt: response.createdAt,
    updatedAt: response.updatedAt,
    ...parsedContent,
  };
}

// ============================================================================
// Template API Functions
// ============================================================================

/**
 * Fetch all templates (user-created, not built-in)
 */
export async function fetchTemplates(): Promise<TemplateResponse[]> {
  return fetchApi<TemplateResponse[]>('/api/templates');
}

/**
 * Fetch a single template by ID
 */
export async function fetchTemplate(id: string): Promise<TemplateResponse> {
  return fetchApi<TemplateResponse>(`/api/templates/${id}`);
}

/**
 * Create a new template from document content
 */
export async function createTemplate(request: CreateTemplateRequest): Promise<TemplateResponse> {
  return fetchApi<TemplateResponse>('/api/templates', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

/**
 * Update an existing template
 */
export async function updateTemplate(id: string, data: UpdateTemplateRequest): Promise<TemplateResponse> {
  return fetchApi<TemplateResponse>(`/api/templates/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Delete a template
 */
export async function deleteTemplate(id: string): Promise<void> {
  return fetchApi<void>(`/api/templates/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Create a new document from a template
 */
export async function createDocumentFromTemplate(templateId: string, title: string): Promise<DocumentResponse> {
  return fetchApi<DocumentResponse>('/api/documents/from-template', {
    method: 'POST',
    body: JSON.stringify({ templateId, title }),
  });
}

/**
 * Parse template response into frontend Template type
 */
export function parseTemplateResponse(response: TemplateResponse): Template {
  let parsedContent: TemplateContent;

  try {
    parsedContent = JSON.parse(response.content);
  } catch {
    // Default empty template content
    parsedContent = {
      pages: [
        {
          id: `page-${Date.now()}`,
          pageNumber: 1,
          headerType: 'default',
          footerType: 'default',
          components: [],
        },
      ],
      headerFooter: {
        defaultHeader: { height: 25, components: [] },
        defaultFooter: { height: 15, components: [] },
      },
      variables: {},
      variableDefinitions: [],
    };
  }

  return {
    id: response.id,
    name: response.name,
    description: response.description,
    category: response.category as Template['category'],
    isBuiltIn: response.isBuiltIn,
    createdAt: response.createdAt,
    updatedAt: response.updatedAt,
    content: parsedContent,
  };
}

/**
 * Serialize template content for API
 */
export function serializeTemplateContent(content: TemplateContent): string {
  return JSON.stringify(content);
}

// ============================================================================
// Variable API Functions
// ============================================================================

/**
 * Fetch variable definitions for a document
 */
export async function fetchDocumentVariables(documentId: string): Promise<VariableDefinitionsResponse> {
  return fetchApi<VariableDefinitionsResponse>(`/api/documents/${documentId}/variables`);
}

/**
 * Fetch variable definitions for a template
 */
export async function fetchTemplateVariables(templateId: string): Promise<VariableDefinitionsResponse> {
  return fetchApi<VariableDefinitionsResponse>(`/api/templates/${templateId}/variables`);
}

/**
 * Analyze variables in a document (detect placeholders, find undefined/unused)
 */
export async function analyzeDocumentVariables(documentId: string): Promise<VariableAnalysisResult> {
  return fetchApi<VariableAnalysisResult>(`/api/documents/${documentId}/variables/analyze`);
}

/**
 * Analyze variables in a template
 */
export async function analyzeTemplateVariables(templateId: string): Promise<VariableAnalysisResult> {
  return fetchApi<VariableAnalysisResult>(`/api/templates/${templateId}/variables/analyze`);
}

/**
 * Validate variable values for a document
 */
export async function validateDocumentVariables(documentId: string, variables: Record<string, unknown>): Promise<VariableValidationResult> {
  return fetchApi<VariableValidationResult>(`/api/documents/${documentId}/validate-variables`, {
    method: 'POST',
    body: JSON.stringify({ variables }),
  });
}

/**
 * Validate variable values for a template
 */
export async function validateTemplateVariables(templateId: string, variables: Record<string, unknown>): Promise<VariableValidationResult> {
  return fetchApi<VariableValidationResult>(`/api/templates/${templateId}/validate-variables`, {
    method: 'POST',
    body: JSON.stringify({ variables }),
  });
}

/**
 * Generate PDF with variables (enhanced version)
 */
export async function generatePdfWithVariables(documentId: string, request: GeneratePdfWithVariablesRequest): Promise<Blob> {
  const url = `${API_BASE_URL}/api/documents/${documentId}/generate-pdf`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    let errorData: unknown;
    try {
      errorData = await response.json();
    } catch {
      errorData = await response.text();
    }
    throw new ApiError(response.status, `PDF Generation Error: ${response.statusText}`, errorData);
  }

  return response.blob();
}

// ============================================================================
// Variable History API Functions
// ============================================================================

/**
 * Fetch variable history for a document
 */
export async function fetchDocumentHistory(
  documentId: string,
  page: number = 1,
  pageSize: number = 20
): Promise<{ records: VariableHistoryRecord[]; totalCount: number }> {
  const response = await fetchApi<{
    records: VariableHistoryRecord[];
    totalCount: number;
  }>(`/api/documents/${documentId}/history?page=${page}&pageSize=${pageSize}`);
  return response;
}

/**
 * Fetch a specific history version
 */
export async function fetchHistoryVersion(documentId: string, version: number): Promise<VariableHistoryRecord> {
  return fetchApi<VariableHistoryRecord>(`/api/documents/${documentId}/history/${version}`);
}

/**
 * Regenerate PDF from a history version
 */
export async function regenerateFromHistory(documentId: string, version: number): Promise<Blob> {
  const url = `${API_BASE_URL}/api/documents/${documentId}/history/${version}/regenerate`;

  const response = await fetch(url, {
    method: 'POST',
  });

  if (!response.ok) {
    let errorData: unknown;
    try {
      errorData = await response.json();
    } catch {
      errorData = await response.text();
    }
    throw new ApiError(response.status, `PDF Regeneration Error: ${response.statusText}`, errorData);
  }

  return response.blob();
}

/**
 * Delete a history version
 */
export async function deleteHistoryVersion(documentId: string, version: number): Promise<void> {
  return fetchApi<void>(`/api/documents/${documentId}/history/${version}`, {
    method: 'DELETE',
  });
}

// ============================================================================
// Bulk Generation API Functions
// ============================================================================

/**
 * Upload file and start bulk PDF generation
 */
export async function startBulkGeneration(
  documentId: string,
  file: File,
  columnMappings?: Record<string, string>,
  worksheetName?: string
): Promise<BulkGenerationJob> {
  const formData = new FormData();
  formData.append('file', file);

  if (columnMappings) {
    formData.append('columnMappings', JSON.stringify(columnMappings));
  }
  if (worksheetName) {
    formData.append('worksheetName', worksheetName);
  }

  const url = `${API_BASE_URL}/api/documents/${documentId}/bulk-generate`;

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let errorData: unknown;
    try {
      errorData = await response.json();
    } catch {
      errorData = await response.text();
    }
    throw new ApiError(response.status, `Bulk Generation Error: ${response.statusText}`, errorData);
  }

  return response.json();
}

/**
 * Get bulk generation job status
 */
export async function getBulkJobStatus(jobId: number): Promise<BulkGenerationJob> {
  return fetchApi<BulkGenerationJob>(`/api/bulk-jobs/${jobId}`);
}

/**
 * Download completed bulk generation ZIP
 */
export async function downloadBulkResult(jobId: number): Promise<Blob> {
  const url = `${API_BASE_URL}/api/bulk-jobs/${jobId}/download`;

  const response = await fetch(url);

  if (!response.ok) {
    let errorData: unknown;
    try {
      errorData = await response.json();
    } catch {
      errorData = await response.text();
    }
    throw new ApiError(response.status, `Download Error: ${response.statusText}`, errorData);
  }

  return response.blob();
}

/**
 * Preview bulk data from uploaded file
 */
export async function previewBulkData(documentId: string, file: File): Promise<BulkDataPreview> {
  const formData = new FormData();
  formData.append('file', file);

  const url = `${API_BASE_URL}/api/documents/${documentId}/bulk-preview`;

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let errorData: unknown;
    try {
      errorData = await response.json();
    } catch {
      errorData = await response.text();
    }
    throw new ApiError(response.status, `Preview Error: ${response.statusText}`, errorData);
  }

  return response.json();
}

// ============================================================================
// HTML Generation Functions
// ============================================================================

/**
 * Request options for HTML generation
 */
export interface GenerateHtmlOptions {
  /** Variable values to substitute in the document */
  variables?: Record<string, unknown>;
  /** If true, return HTML as a file download. Otherwise returns inline content */
  asDownload?: boolean;
  /** If true, includes print-optimized CSS styles */
  includePrintStyles?: boolean;
  /** If true, inlines all CSS styles (useful for email compatibility) */
  inlineStyles?: boolean;
  /** Whether to include Google Fonts links. Defaults to true */
  includeFontLinks?: boolean;
  /** Additional font families to include from Google Fonts */
  fontFamilies?: string[];
  /** Whether to auto-detect fonts used in the document. Defaults to true */
  autoDetectFonts?: boolean;
}

/**
 * Generate HTML from a saved document
 */
export async function generateHtml(documentId: string, options?: GenerateHtmlOptions): Promise<string> {
  const url = `${API_BASE_URL}/api/documents/${documentId}/generate-html`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      variables: options?.variables,
      asDownload: options?.asDownload ?? false,
      includePrintStyles: options?.includePrintStyles ?? true,
      inlineStyles: options?.inlineStyles ?? false,
      includeFontLinks: options?.includeFontLinks ?? true,
      fontFamilies: options?.fontFamilies,
      autoDetectFonts: options?.autoDetectFonts ?? true,
    }),
  });

  if (!response.ok) {
    let errorData: unknown;
    try {
      errorData = await response.json();
    } catch {
      errorData = await response.text();
    }
    throw new ApiError(response.status, `HTML Generation Error: ${response.statusText}`, errorData);
  }

  return response.text();
}

/**
 * Generate HTML from a saved document and download as file
 */
export async function generateHtmlDownload(documentId: string, options?: GenerateHtmlOptions): Promise<Blob> {
  const url = `${API_BASE_URL}/api/documents/${documentId}/generate-html`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      variables: options?.variables,
      asDownload: true,
      includePrintStyles: options?.includePrintStyles ?? true,
      inlineStyles: options?.inlineStyles ?? false,
      includeFontLinks: options?.includeFontLinks ?? true,
      fontFamilies: options?.fontFamilies,
      autoDetectFonts: options?.autoDetectFonts ?? true,
    }),
  });

  if (!response.ok) {
    let errorData: unknown;
    try {
      errorData = await response.json();
    } catch {
      errorData = await response.text();
    }
    throw new ApiError(response.status, `HTML Generation Error: ${response.statusText}`, errorData);
  }

  return response.blob();
}

/**
 * Generate HTML preview from document content (without saving)
 */
export async function generateHtmlPreview(
  content: string,
  options?: {
    title?: string;
    variables?: Record<string, unknown>;
    includePrintStyles?: boolean;
    inlineStyles?: boolean;
    includeFontLinks?: boolean;
    fontFamilies?: string[];
    autoDetectFonts?: boolean;
  }
): Promise<string> {
  const url = `${API_BASE_URL}/api/generate-html-preview`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      content,
      title: options?.title,
      variables: options?.variables,
      includePrintStyles: options?.includePrintStyles ?? true,
      inlineStyles: options?.inlineStyles ?? false,
      includeFontLinks: options?.includeFontLinks ?? true,
      fontFamilies: options?.fontFamilies,
      autoDetectFonts: options?.autoDetectFonts ?? true,
    }),
  });

  if (!response.ok) {
    let errorData: unknown;
    try {
      errorData = await response.json();
    } catch {
      errorData = await response.text();
    }
    throw new ApiError(response.status, `HTML Preview Error: ${response.statusText}`, errorData);
  }

  return response.text();
}

/**
 * Download HTML string as a file
 */
export function downloadHtml(htmlContent: string, filename: string): void {
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  downloadBlob(blob, filename);
}
