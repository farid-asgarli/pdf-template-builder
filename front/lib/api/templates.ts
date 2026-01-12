/**
 * Templates API Module
 * Handles all template CRUD operations
 */

import { fetchApi } from './client';
import type { Template, TemplateResponse, CreateTemplateRequest, UpdateTemplateRequest, TemplateContent } from '@/lib/types/document.types';

// =============================================================================
// CRUD Operations
// =============================================================================

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

// =============================================================================
// Serialization Helpers
// =============================================================================

/**
 * Parse template response into frontend Template type
 */
export function parseTemplateResponse(response: TemplateResponse): Template {
  let parsedContent: TemplateContent;

  try {
    parsedContent = JSON.parse(response.content);
  } catch {
    parsedContent = createDefaultTemplateContent();
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

/**
 * Create default template content structure
 */
function createDefaultTemplateContent(): TemplateContent {
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
  };
}
