/**
 * API Client Configuration and Core Utilities
 * Handles all low-level HTTP communication with the backend
 */

// =============================================================================
// Configuration
// =============================================================================

/** Base URL for the API - defaults to localhost for development */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5043';

// =============================================================================
// Error Handling
// =============================================================================

/**
 * Custom error class for API errors with status code and response data
 */
export class ApiError extends Error {
  constructor(public readonly status: number, message: string, public readonly data?: unknown) {
    super(message);
    this.name = 'ApiError';
    // Maintains proper stack trace for where error was thrown (V8 engines)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  /** Check if error is a client error (4xx) */
  get isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }

  /** Check if error is a server error (5xx) */
  get isServerError(): boolean {
    return this.status >= 500;
  }

  /** Check if error is a not found error (404) */
  get isNotFound(): boolean {
    return this.status === 404;
  }

  /** Check if error is an unauthorized error (401) */
  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  /** Check if error is a forbidden error (403) */
  get isForbidden(): boolean {
    return this.status === 403;
  }

  /** Check if error is a validation error (400/422) */
  get isValidationError(): boolean {
    return this.status === 400 || this.status === 422;
  }
}

// =============================================================================
// HTTP Client
// =============================================================================

/** Default headers for JSON requests */
const DEFAULT_HEADERS: HeadersInit = {
  'Content-Type': 'application/json',
};

/**
 * Parse error response from the server
 */
async function parseErrorResponse(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return await response.text();
  }
}

/**
 * Core fetch wrapper with error handling and response parsing
 *
 * @param endpoint - API endpoint path (e.g., '/api/documents')
 * @param options - Fetch options (method, headers, body, etc.)
 * @returns Parsed response data
 * @throws {ApiError} When the response is not ok
 */
export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      ...DEFAULT_HEADERS,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await parseErrorResponse(response);
    throw new ApiError(response.status, `API Error: ${response.statusText}`, errorData);
  }

  // Handle empty responses (204 No Content)
  if (response.status === 204) {
    return undefined as T;
  }

  // Parse based on content type
  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return response.json();
  }

  return response.text() as T;
}

/**
 * Fetch binary data (blobs) from the API
 *
 * @param endpoint - API endpoint path
 * @param options - Fetch options
 * @param errorPrefix - Prefix for error messages
 * @returns Blob response
 * @throws {ApiError} When the response is not ok
 */
export async function fetchBlob(endpoint: string, options: RequestInit = {}, errorPrefix: string = 'Request'): Promise<Blob> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      ...DEFAULT_HEADERS,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await parseErrorResponse(response);
    throw new ApiError(response.status, `${errorPrefix} Error: ${response.statusText}`, errorData);
  }

  return response.blob();
}

/**
 * Fetch with FormData (for file uploads)
 * Note: Don't set Content-Type header - browser will set it with boundary
 *
 * @param endpoint - API endpoint path
 * @param formData - FormData to send
 * @param errorPrefix - Prefix for error messages
 * @returns Parsed JSON response
 * @throws {ApiError} When the response is not ok
 */
export async function fetchWithFormData<T>(endpoint: string, formData: FormData, errorPrefix: string = 'Upload'): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await parseErrorResponse(response);
    throw new ApiError(response.status, `${errorPrefix} Error: ${response.statusText}`, errorData);
  }

  return response.json();
}

/**
 * Fetch blob with FormData (for file uploads that return binary data)
 *
 * @param endpoint - API endpoint path
 * @param formData - FormData to send
 * @param errorPrefix - Prefix for error messages
 * @returns Blob response
 * @throws {ApiError} When the response is not ok
 */
export async function fetchBlobWithFormData(endpoint: string, formData: FormData, errorPrefix: string = 'Upload'): Promise<Blob> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await parseErrorResponse(response);
    throw new ApiError(response.status, `${errorPrefix} Error: ${response.statusText}`, errorData);
  }

  return response.blob();
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Download a blob as a file
 *
 * @param blob - The blob to download
 * @param filename - The filename to use for the download
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
 * Download HTML content as a file
 *
 * @param htmlContent - The HTML string to download
 * @param filename - The filename to use for the download
 */
export function downloadHtml(htmlContent: string, filename: string): void {
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  downloadBlob(blob, filename);
}
