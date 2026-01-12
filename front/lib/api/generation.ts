/**
 * Generation API Module
 * Handles PDF and HTML generation from documents and templates
 */

import { fetchBlob, API_BASE_URL } from './client';

// =============================================================================
// Types
// =============================================================================

/** Options for HTML generation */
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

/** Options for HTML preview generation */
export interface GenerateHtmlPreviewOptions extends Omit<GenerateHtmlOptions, 'asDownload'> {
  /** Document title for the HTML page */
  title?: string;
}

// =============================================================================
// PDF Generation
// =============================================================================

/**
 * Generate PDF preview from document content (without saving)
 */
export async function generatePdfPreview(content: string): Promise<Blob> {
  return fetchBlob(
    '/api/generate-pdf-preview',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    },
    'PDF Preview'
  );
}

// =============================================================================
// HTML Generation
// =============================================================================

/**
 * Build HTML generation request body with defaults
 */
function buildHtmlRequestBody(options: GenerateHtmlOptions = {}): string {
  return JSON.stringify({
    variables: options.variables,
    asDownload: options.asDownload ?? false,
    includePrintStyles: options.includePrintStyles ?? true,
    inlineStyles: options.inlineStyles ?? false,
    includeFontLinks: options.includeFontLinks ?? true,
    fontFamilies: options.fontFamilies,
    autoDetectFonts: options.autoDetectFonts ?? true,
  });
}

/**
 * Fetch HTML content with error handling
 */
async function fetchHtml(endpoint: string, body: string, errorPrefix: string): Promise<string> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });

  if (!response.ok) {
    // Error data is captured but not used since we throw a generic error
    // In production, you might want to include errorData in error message
    try {
      await response.json();
    } catch {
      await response.text();
    }
    throw new Error(`${errorPrefix} Error: ${response.statusText}`);
  }

  return response.text();
}

/**
 * Generate HTML from a saved document
 */
export async function generateHtml(documentId: string, options?: GenerateHtmlOptions): Promise<string> {
  const body = buildHtmlRequestBody(options);
  return fetchHtml(`/api/documents/${documentId}/generate-html`, body, 'HTML Generation');
}

/**
 * Generate HTML from a saved document and return as blob for download
 */
export async function generateHtmlDownload(documentId: string, options?: GenerateHtmlOptions): Promise<Blob> {
  const body = buildHtmlRequestBody({ ...options, asDownload: true });
  return fetchBlob(
    `/api/documents/${documentId}/generate-html`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    },
    'HTML Generation'
  );
}

/**
 * Generate HTML preview from document content (without saving)
 */
export async function generateHtmlPreview(content: string, options?: GenerateHtmlPreviewOptions): Promise<string> {
  const body = JSON.stringify({
    content,
    title: options?.title,
    variables: options?.variables,
    includePrintStyles: options?.includePrintStyles ?? true,
    inlineStyles: options?.inlineStyles ?? false,
    includeFontLinks: options?.includeFontLinks ?? true,
    fontFamilies: options?.fontFamilies,
    autoDetectFonts: options?.autoDetectFonts ?? true,
  });

  return fetchHtml('/api/generate-html-preview', body, 'HTML Preview');
}
