/**
 * API Module Index
 * Central export point for all API functionality
 *
 * @example
 * ```ts
 * // Import specific functions
 * import { fetchDocuments, createDocument } from '@/lib/api';
 *
 * // Import all from a specific module
 * import * as documentsApi from '@/lib/api/documents';
 *
 * // Import types
 * import type { GenerateHtmlOptions } from '@/lib/api';
 * ```
 */

// =============================================================================
// Client Exports
// =============================================================================

export {
  // Configuration
  API_BASE_URL,

  // Error handling
  ApiError,

  // HTTP client utilities
  fetchApi,
  fetchBlob,
  fetchWithFormData,
  fetchBlobWithFormData,

  // Download utilities
  downloadBlob,
  downloadHtml,
} from './client';

// =============================================================================
// Documents API
// =============================================================================

export {
  // Constants
  DEFAULT_DOCUMENT_SETTINGS,

  // CRUD
  fetchDocuments,
  fetchDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  createDocumentFromTemplate,

  // PDF Generation
  generatePdf,

  // Serialization
  serializeDocumentContent,
  parseDocumentResponse,
} from './documents';

// =============================================================================
// Templates API
// =============================================================================

export {
  // CRUD
  fetchTemplates,
  fetchTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,

  // Serialization
  parseTemplateResponse,
  serializeTemplateContent,
} from './templates';

// =============================================================================
// Variables API
// =============================================================================

export {
  // Variable definitions
  fetchDocumentVariables,
  fetchTemplateVariables,

  // Analysis
  analyzeDocumentVariables,
  analyzeTemplateVariables,

  // Validation
  validateDocumentVariables,
  validateTemplateVariables,

  // PDF with variables
  generatePdfWithVariables,

  // History
  fetchDocumentHistory,
  fetchHistoryVersion,
  regenerateFromHistory,
  deleteHistoryVersion,
} from './variables';

// Re-export types from variables
export type { HistoryPaginationOptions, PaginatedHistoryResponse } from './variables';

// =============================================================================
// Generation API
// =============================================================================

export {
  // PDF
  generatePdfPreview,

  // HTML
  generateHtml,
  generateHtmlDownload,
  generateHtmlPreview,
} from './generation';

// Re-export types from generation
export type { GenerateHtmlOptions, GenerateHtmlPreviewOptions } from './generation';

// =============================================================================
// Bulk Operations API
// =============================================================================

export {
  // Operations
  startBulkGeneration,
  getBulkJobStatus,
  downloadBulkResult,
  previewBulkData,

  // Polling utility
  pollBulkJobUntilComplete,
} from './bulk';

// Re-export types from bulk
export type { BulkGenerationOptions, BulkJobPollingOptions, BulkJobStatus } from './bulk';
