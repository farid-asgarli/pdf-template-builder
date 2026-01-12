/**
 * Variables API Module
 * Handles variable definitions, analysis, validation, and history
 */

import { fetchApi, fetchBlob } from './client';
import type {
  VariableDefinitionsResponse,
  VariableAnalysisResult,
  VariableValidationResult,
  VariableHistoryRecord,
  GeneratePdfWithVariablesRequest,
} from '@/lib/types/variable.types';

// =============================================================================
// Variable Definitions
// =============================================================================

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

// =============================================================================
// Variable Analysis
// =============================================================================

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

// =============================================================================
// Variable Validation
// =============================================================================

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

// =============================================================================
// PDF Generation with Variables
// =============================================================================

/**
 * Generate PDF with variables (enhanced version)
 */
export async function generatePdfWithVariables(documentId: string, request: GeneratePdfWithVariablesRequest): Promise<Blob> {
  return fetchBlob(
    `/api/documents/${documentId}/generate-pdf`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    },
    'PDF Generation'
  );
}

// =============================================================================
// Variable History
// =============================================================================

/** Pagination options for history queries */
export interface HistoryPaginationOptions {
  page?: number;
  pageSize?: number;
}

/** Paginated history response */
export interface PaginatedHistoryResponse {
  records: VariableHistoryRecord[];
  totalCount: number;
}

/**
 * Fetch variable history for a document
 */
export async function fetchDocumentHistory(documentId: string, options: HistoryPaginationOptions = {}): Promise<PaginatedHistoryResponse> {
  const { page = 1, pageSize = 20 } = options;
  return fetchApi<PaginatedHistoryResponse>(`/api/documents/${documentId}/history?page=${page}&pageSize=${pageSize}`);
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
  return fetchBlob(`/api/documents/${documentId}/history/${version}/regenerate`, { method: 'POST' }, 'PDF Regeneration');
}

/**
 * Delete a history version
 */
export async function deleteHistoryVersion(documentId: string, version: number): Promise<void> {
  return fetchApi<void>(`/api/documents/${documentId}/history/${version}`, {
    method: 'DELETE',
  });
}
