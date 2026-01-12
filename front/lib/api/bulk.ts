/**
 * Bulk Operations API Module
 * Handles bulk PDF generation from CSV/Excel files
 */

import { fetchApi, fetchBlob, fetchWithFormData } from './client';
import type { BulkGenerationJob, BulkDataPreview } from '@/lib/types/variable.types';

// =============================================================================
// Types
// =============================================================================

/** Options for starting a bulk generation job */
export interface BulkGenerationOptions {
  /** Mapping of document variables to file columns */
  columnMappings?: Record<string, string>;
  /** Name of the worksheet to use (for Excel files) */
  worksheetName?: string;
}

// =============================================================================
// Bulk Generation
// =============================================================================

/**
 * Upload file and start bulk PDF generation
 */
export async function startBulkGeneration(documentId: string, file: File, options?: BulkGenerationOptions): Promise<BulkGenerationJob> {
  const formData = new FormData();
  formData.append('file', file);

  if (options?.columnMappings) {
    formData.append('columnMappings', JSON.stringify(options.columnMappings));
  }
  if (options?.worksheetName) {
    formData.append('worksheetName', options.worksheetName);
  }

  return fetchWithFormData<BulkGenerationJob>(`/api/documents/${documentId}/bulk-generate`, formData, 'Bulk Generation');
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
  return fetchBlob(`/api/bulk-jobs/${jobId}/download`, {}, 'Download');
}

/**
 * Preview bulk data from uploaded file
 */
export async function previewBulkData(documentId: string, file: File): Promise<BulkDataPreview> {
  const formData = new FormData();
  formData.append('file', file);

  return fetchWithFormData<BulkDataPreview>(`/api/documents/${documentId}/bulk-preview`, formData, 'Preview');
}

// =============================================================================
// Polling Utilities
// =============================================================================

/** Options for polling a bulk job */
export interface BulkJobPollingOptions {
  /** Polling interval in milliseconds (default: 2000) */
  intervalMs?: number;
  /** Maximum time to wait in milliseconds (default: 5 minutes) */
  timeoutMs?: number;
  /** Callback for progress updates */
  onProgress?: (job: BulkGenerationJob) => void;
}

/** Possible job statuses */
export type BulkJobStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * Poll a bulk job until it completes or fails
 *
 * @param jobId - The job ID to poll
 * @param options - Polling options
 * @returns The completed job
 * @throws Error if the job times out or fails
 */
export async function pollBulkJobUntilComplete(jobId: number, options: BulkJobPollingOptions = {}): Promise<BulkGenerationJob> {
  const {
    intervalMs = 2000,
    timeoutMs = 5 * 60 * 1000, // 5 minutes
    onProgress,
  } = options;

  const startTime = Date.now();

  while (true) {
    const job = await getBulkJobStatus(jobId);

    onProgress?.(job);

    if (job.status === 'completed') {
      return job;
    }

    if (job.status === 'failed') {
      const errorMessage = job.errors?.[0]?.message || 'Bulk generation failed';
      throw new Error(errorMessage);
    }

    if (Date.now() - startTime > timeoutMs) {
      throw new Error('Bulk generation timed out');
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}
