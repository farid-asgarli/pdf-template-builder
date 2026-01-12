/**
 * Documents API Module
 * Handles all document CRUD operations
 */

import { fetchApi, fetchBlob } from './client';
import type { Document, DocumentResponse, CreateDocumentRequest, UpdateDocumentRequest, GlobalDocumentSettings } from '@/lib/types/document.types';

// =============================================================================
// Types
// =============================================================================

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
