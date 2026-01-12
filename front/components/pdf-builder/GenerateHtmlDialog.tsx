'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Switch,
  Textarea,
  Badge,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  DialogBody,
} from '@/app/ui/primitives';
import { toast } from '@/app/ui/primitives/feedback/Toast';
import { Download, FileCode, Loader2, Copy, Eye, Variable, ExternalLink } from 'lucide-react';
import { VariableInputForm } from './VariableInputForm';
import type { VariableDefinition, VariableValidationError } from '@/lib/types/variable.types';
import { fetchDocumentVariables, generateHtml, downloadHtml, ApiError } from '@/lib/api';

interface GenerateHtmlDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback to close the dialog */
  onOpenChange: (open: boolean) => void;
  /** Document ID to generate HTML for */
  documentId: string;
  /** Document title for display */
  documentTitle: string;
}

/**
 * Dialog for generating HTML with variable inputs.
 * Allows users to fill in variables, preview, and download HTML.
 */
export function GenerateHtmlDialog({ open, onOpenChange, documentId, documentTitle }: GenerateHtmlDialogProps) {
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [definitions, setDefinitions] = useState<VariableDefinition[]>([]);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Generated HTML state
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);

  // Options
  const [includePrintStyles, setIncludePrintStyles] = useState(true);
  const [inlineStyles, setInlineStyles] = useState(false);

  // Active tab
  const [activeTab, setActiveTab] = useState('variables');

  // Load variable definitions when dialog opens
  useEffect(() => {
    async function loadVariables() {
      setIsLoading(true);
      setErrors({});
      setGeneratedHtml(null);

      try {
        const response = await fetchDocumentVariables(documentId);
        setDefinitions(response.variables);

        // Initialize values with defaults
        const initialValues: Record<string, unknown> = {};
        for (const def of response.variables) {
          if (def.defaultValue) {
            try {
              initialValues[def.name] = JSON.parse(def.defaultValue);
            } catch {
              initialValues[def.name] = def.defaultValue;
            }
          }
        }
        setValues(initialValues);
      } catch (err) {
        const message = err instanceof ApiError ? err.message : 'Failed to load variable definitions';
        toast.error('Error', { description: message });
      } finally {
        setIsLoading(false);
      }
    }

    if (open && documentId) {
      loadVariables();
    }
  }, [open, documentId]);

  const handleValueChange = useCallback((name: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
    // Clear generated HTML when values change
    setGeneratedHtml(null);
  }, []);

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setErrors({});

    try {
      const htmlContent = await generateHtml(documentId, {
        variables: values,
        includePrintStyles,
        inlineStyles,
      });

      setGeneratedHtml(htmlContent);
      setActiveTab('preview');
      toast.success('HTML Generated', { description: 'HTML has been generated successfully.' });
    } catch (err) {
      if (err instanceof ApiError && err.data) {
        const errorData = err.data as { validationErrors?: VariableValidationError[] };
        if (errorData.validationErrors) {
          const errorMap: Record<string, string> = {};
          for (const error of errorData.validationErrors) {
            errorMap[error.variableName] = error.message;
          }
          setErrors(errorMap);
          toast.error('Validation Failed', { description: 'Please correct the highlighted fields.' });
          return;
        }
      }
      const message = err instanceof ApiError ? err.message : 'Failed to generate HTML';
      toast.error('Generation Failed', { description: message });
    } finally {
      setIsGenerating(false);
    }
  }, [documentId, values, includePrintStyles, inlineStyles]);

  const handleDownload = useCallback(() => {
    if (generatedHtml) {
      downloadHtml(generatedHtml, `${documentTitle}.html`);
      toast.success('Downloaded', { description: 'HTML file has been downloaded.' });
    }
  }, [generatedHtml, documentTitle]);

  const handleCopyToClipboard = useCallback(async () => {
    if (generatedHtml) {
      try {
        await navigator.clipboard.writeText(generatedHtml);
        toast.success('Copied', { description: 'HTML copied to clipboard.' });
      } catch {
        toast.error('Failed', { description: 'Could not copy to clipboard.' });
      }
    }
  }, [generatedHtml]);

  const handleOpenInNewTab = useCallback(() => {
    if (generatedHtml) {
      const blob = new Blob([generatedHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      // Clean up the URL after a delay
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }, [generatedHtml]);

  const hasVariables = definitions.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCode className="h-5 w-5 text-primary" />
            Generate HTML
          </DialogTitle>
          <DialogDescription>Generate an HTML version of &ldquo;{documentTitle}&rdquo;</DialogDescription>
        </DialogHeader>

        <DialogBody>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
              <TabsList className="mb-4">
                <TabsTrigger value="variables" className="flex items-center gap-1.5">
                  <Variable className="h-4 w-4" />
                  Variables
                  {hasVariables && (
                    <Badge variant="outline" size="sm">
                      {definitions.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="options">Options</TabsTrigger>
                <TabsTrigger value="preview" disabled={!generatedHtml}>
                  <Eye className="mr-1.5 h-4 w-4" />
                  Preview
                </TabsTrigger>
              </TabsList>

              <TabsContent value="variables" className="max-h-[50vh] overflow-auto pr-2">
                {hasVariables ? (
                  <VariableInputForm definitions={definitions} values={values} errors={errors} onChange={handleValueChange} />
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Variable className="mb-3 h-12 w-12 text-outline-variant/50" />
                    <p className="text-sm text-on-surface-variant">This document has no variable definitions.</p>
                    <p className="mt-1 text-xs text-on-surface-variant/70">You can generate HTML directly without filling in any values.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="options" className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-outline-variant/25 p-4">
                  <div>
                    <p className="font-medium text-on-surface">Include Print Styles</p>
                    <p className="text-sm text-on-surface-variant">Add CSS styles optimized for printing the HTML document</p>
                  </div>
                  <Switch
                    checked={includePrintStyles}
                    onChange={(e) => {
                      setIncludePrintStyles(e.target.checked);
                      setGeneratedHtml(null);
                    }}
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-outline-variant/25 p-4">
                  <div>
                    <p className="font-medium text-on-surface">Inline Styles</p>
                    <p className="text-sm text-on-surface-variant">Embed all CSS directly in elements (for email compatibility)</p>
                  </div>
                  <Switch
                    checked={inlineStyles}
                    onChange={(e) => {
                      setInlineStyles(e.target.checked);
                      setGeneratedHtml(null);
                    }}
                  />
                </div>
              </TabsContent>

              <TabsContent value="preview" className="space-y-4">
                {generatedHtml && (
                  <>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={handleCopyToClipboard}>
                        <Copy className="mr-1.5 h-4 w-4" />
                        Copy HTML
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleOpenInNewTab}>
                        <ExternalLink className="mr-1.5 h-4 w-4" />
                        Open in New Tab
                      </Button>
                    </div>
                    <div className="max-h-[40vh] overflow-auto rounded-lg border border-outline-variant/25 bg-surface-container">
                      <Textarea value={generatedHtml} readOnly className="min-h-75 font-mono text-xs" rows={20} />
                    </div>
                    <p className="text-xs text-on-surface-variant">Size: {(new Blob([generatedHtml]).size / 1024).toFixed(2)} KB</p>
                  </>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogBody>

        <DialogFooter className="mt-4 flex justify-between gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button variant="tonal" onClick={handleGenerate} disabled={isGenerating || isLoading}>
              {isGenerating ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <FileCode className="mr-1.5 h-4 w-4" />}
              {isGenerating ? 'Generating...' : 'Generate HTML'}
            </Button>
            {generatedHtml && (
              <Button variant="filled" onClick={handleDownload}>
                <Download className="mr-1.5 h-4 w-4" />
                Download HTML
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
