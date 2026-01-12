/**
 * Documents API Module
 * Handles all document CRUD operations
 */

import { fetchApi, fetchBlob, API_BASE_URL, ApiError } from './client';
import type { Document, DocumentResponse, CreateDocumentRequest, UpdateDocumentRequest, GlobalDocumentSettings } from '@/lib/types/document.types';

// =============================================================================
// Types
// =============================================================================

/** DOCX import response from the API */
export interface DocxImportResponse {
  success: boolean;
  document?: DocumentResponse;
  errorMessage?: string;
  metadata?: DocxImportMetadata;
}

/** Metadata about the imported DOCX file */
export interface DocxImportMetadata {
  paragraphCount: number;
  tableCount: number;
  imageCount: number;
  listCount: number;
  hyperlinkCount: number;
  totalPages: number;
  originalFileName?: string;
  warnings?: string[];
  // Enhanced import metadata
  hasHeaders: boolean;
  hasFooters: boolean;
  pageBreakCount: number;
  sectionCount: number;
  mergedCellCount: number;
  // Extended metadata
  textBoxCount: number;
  footnoteCount: number;
  endnoteCount: number;
  bookmarkCount: number;
  commentCount: number;
  shapeCount: number;
  hasWatermark: boolean;
  documentProperties?: DocxDocumentProperties;
  // Advanced content metadata (Phase 4)
  equationCount: number;
  chartCount: number;
  smartArtCount: number;
  formFieldCount: number;
  contentControlCount: number;
  revisionCount: number;
  styleCount: number;
  hasTableOfContents: boolean;
  citationCount: number;
  bibliographySourceCount: number;
  embeddedObjectCount: number;
  hasCustomXml: boolean;
  theme?: DocxThemeInfo;
}

/** Document properties/metadata from DOCX */
export interface DocxDocumentProperties {
  title?: string;
  subject?: string;
  creator?: string;
  keywords?: string;
  description?: string;
  lastModifiedBy?: string;
  created?: string;
  modified?: string;
  category?: string;
  company?: string;
  manager?: string;
  totalTime?: number;
  pages?: number;
  words?: number;
  characters?: number;
  charactersWithSpaces?: number;
  lines?: number;
  paragraphs?: number;
  application?: string;
  appVersion?: string;
}

/** Theme information from DOCX */
export interface DocxThemeInfo {
  name?: string;
  colorScheme?: DocxColorSchemeInfo;
  fontScheme?: DocxFontSchemeInfo;
}

/** Color scheme from DOCX theme */
export interface DocxColorSchemeInfo {
  name?: string;
  dark1?: string;
  light1?: string;
  dark2?: string;
  light2?: string;
  accent1?: string;
  accent2?: string;
  accent3?: string;
  accent4?: string;
  accent5?: string;
  accent6?: string;
  hyperlink?: string;
  followedHyperlink?: string;
}

/** Font scheme from DOCX theme */
export interface DocxFontSchemeInfo {
  name?: string;
  majorFont?: string;
  minorFont?: string;
}

/** Default global document settings */
export const DEFAULT_DOCUMENT_SETTINGS: GlobalDocumentSettings = {
  predefinedSize: 'a4',
  orientation: 'portrait',
  backgroundColor: '#FFFFFF',
  contentDirection: 'ltr',
  margins: { top: 0, right: 0, bottom: 0, left: 0 },
};

// =============================================================================
// CRUD Operations
// =============================================================================

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

/**
 * Create a new document from a template
 */
export async function createDocumentFromTemplate(templateId: string, title: string): Promise<DocumentResponse> {
  return fetchApi<DocumentResponse>('/api/documents/from-template', {
    method: 'POST',
    body: JSON.stringify({ templateId, title }),
  });
}

// =============================================================================
// DOCX Import
// =============================================================================

/**
 * Import a document from a DOCX file.
 * Converts Word document content to editor-compatible format.
 *
 * @param file - The DOCX file to import
 * @param title - Optional custom title (defaults to filename)
 * @returns Import result with created document or error
 */
export async function importFromDocx(file: File, title?: string): Promise<DocxImportResponse> {
  const formData = new FormData();
  formData.append('file', file);
  if (title) {
    formData.append('title', title);
  }

  const url = `${API_BASE_URL}/api/documents/import-docx`;

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
    // Note: Don't set Content-Type header - browser will set it with boundary for multipart/form-data
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Import failed' }));
    throw new ApiError(response.status, errorData.error || 'Failed to import DOCX file', errorData);
  }

  return response.json();
}

/**
 * Validate if a file is a valid DOCX file
 */
export function isValidDocxFile(file: File): { valid: boolean; error?: string } {
  const validTypes = [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/msword', // .doc
  ];

  const extension = file.name.toLowerCase().split('.').pop();

  if (!validTypes.includes(file.type) && extension !== 'docx' && extension !== 'doc') {
    return { valid: false, error: 'Invalid file type. Please select a .docx or .doc file.' };
  }

  if (extension === 'doc') {
    return { valid: false, error: 'Legacy .doc format is not supported. Please convert to .docx format.' };
  }

  // Max file size: 50MB
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: 'File is too large. Maximum size is 50MB.' };
  }

  return { valid: true };
}

// =============================================================================
// PDF Generation
// =============================================================================

/**
 * Generate PDF from a saved document
 */
export async function generatePdf(id: string): Promise<Blob> {
  return fetchBlob(`/api/documents/${id}/generate-pdf`, { method: 'POST' }, 'PDF Generation');
}

// =============================================================================
// Serialization Helpers
// =============================================================================

/**
 * Convert frontend Document type to API content string
 */
export function serializeDocumentContent(document: Document): string {
  const content = {
    pages: document.pages,
    headerFooter: document.headerFooter,
    variables: document.variables,
    variableDefinitions: document.variableDefinitions,
    settings: document.settings,
  };
  return JSON.stringify(content);
}

/**
 * Parse API document response into frontend Document type
 */
export function parseDocumentResponse(response: DocumentResponse): Document {
  let parsedContent: Pick<Document, 'pages' | 'headerFooter' | 'variables' | 'variableDefinitions' | 'settings'>;

  try {
    parsedContent = JSON.parse(response.content);
  } catch {
    // If content is empty or invalid, create default structure
    parsedContent = createDefaultDocumentContent();
  }

  return {
    id: response.id,
    title: response.title,
    createdAt: response.createdAt,
    updatedAt: response.updatedAt,
    ...parsedContent,
    settings: {
      ...DEFAULT_DOCUMENT_SETTINGS,
      ...parsedContent.settings,
    },
  };
}

/**
 * Create default document content structure
 */
function createDefaultDocumentContent(): Pick<Document, 'pages' | 'headerFooter' | 'variables' | 'variableDefinitions' | 'settings'> {
  return {
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
    settings: { ...DEFAULT_DOCUMENT_SETTINGS },
  };
}
