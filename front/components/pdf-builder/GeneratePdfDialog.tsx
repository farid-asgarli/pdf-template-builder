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
  Input,
  Switch,
  Textarea,
  Badge,
  PageLoading,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/app/ui/primitives';
import { toast } from '@/app/ui/primitives/feedback/Toast';
import { Download, FileText, History, AlertTriangle, Loader2, Info, Variable } from 'lucide-react';
import { VariableInputForm } from './VariableInputForm';
import type { VariableDefinition, VariableValidationError } from '@/lib/types/variable.types';
import { fetchDocumentVariables, validateDocumentVariables, generatePdfWithVariables, downloadBlob, ApiError } from '@/lib/utils/api';

interface GeneratePdfDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback to close the dialog */
  onOpenChange: (open: boolean) => void;
  /** Document ID to generate PDF for */
  documentId: string;
  /** Document title for display */
  documentTitle: string;
}

/**
 * Dialog for generating a PDF with variable inputs.
 * Fetches variable definitions, allows filling in values,
 * validates, and generates with optional history tracking.
 */
export function GeneratePdfDialog({ open, onOpenChange, documentId, documentTitle }: GeneratePdfDialogProps) {
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [definitions, setDefinitions] = useState<VariableDefinition[]>([]);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [validationErrors, setValidationErrors] = useState<VariableValidationError[]>([]);

  // History tracking options
  const [saveToHistory, setSaveToHistory] = useState(false);
  const [generatedBy, setGeneratedBy] = useState('');
  const [notes, setNotes] = useState('');

  // Active tab
  const [activeTab, setActiveTab] = useState('variables');

  // Load variable definitions when dialog opens
  useEffect(() => {
    async function loadVariables() {
      setIsLoading(true);
      setErrors({});
      setValidationErrors([]);

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
    // Clear error for this field when value changes
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  }, []);

  const validateAndGenerate = async () => {
    setIsGenerating(true);
    setErrors({});
    setValidationErrors([]);

    try {
      // First validate on the server
      const validation = await validateDocumentVariables(documentId, values);

      if (!validation.isValid) {
        // Convert validation errors to field errors
        const fieldErrors: Record<string, string> = {};
        for (const err of validation.errors) {
          fieldErrors[err.variableName] = err.message;
        }
        setErrors(fieldErrors);
        setValidationErrors(validation.errors);
        toast.error('Validation Failed', {
          description: `${validation.errors.length} error(s) found`,
        });
        setIsGenerating(false);
        return;
      }

      // Generate PDF
      const blob = await generatePdfWithVariables(documentId, {
        variables: values,
        saveToHistory,
        generatedBy: generatedBy || undefined,
        notes: notes || undefined,
      });

      // Download the PDF
      const filename = `${documentTitle || 'document'}.pdf`;
      downloadBlob(blob, filename);

      toast.success('PDF Generated', {
        description: saveToHistory ? 'PDF downloaded and saved to history' : 'PDF downloaded successfully',
      });

      // Close dialog on success
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to generate PDF';
      toast.error('Generation Failed', { description: message });
    } finally {
      setIsGenerating(false);
    }
  };

  const hasVariables = definitions.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Generate PDF
          </DialogTitle>
          <DialogDescription>
            {hasVariables ? 'Fill in the variable values below to generate your PDF.' : 'Generate a PDF from your document.'}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <PageLoading message="Loading variables..." />
          </div>
        ) : (
          <>
            {hasVariables ? (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                <TabsList className="mx-0">
                  <TabsTrigger value="variables" className="gap-2">
                    <Variable className="h-4 w-4" />
                    Variables
                    {Object.keys(errors).length > 0 && (
                      <Badge variant="error" size="sm">
                        {Object.keys(errors).length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="options" className="gap-2">
                    <History className="h-4 w-4" />
                    Options
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="variables" className="flex-1 overflow-y-auto pr-2 mt-4">
                  {validationErrors.length > 0 && (
                    <div className="mb-4 p-3 bg-error/10 border border-error/20 rounded-lg">
                      <div className="flex items-center gap-2 text-error font-medium mb-2">
                        <AlertTriangle className="h-4 w-4" />
                        Validation Errors
                      </div>
                      <ul className="text-sm text-error/90 space-y-1">
                        {validationErrors.map((err, i) => (
                          <li key={i}>
                            <strong>{err.variableName}:</strong> {err.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <VariableInputForm
                    definitions={definitions}
                    values={values}
                    onChange={handleValueChange}
                    errors={errors}
                    disabled={isGenerating}
                    showComputed={false}
                  />
                </TabsContent>

                <TabsContent value="options" className="flex-1 overflow-y-auto pr-2 mt-4">
                  <div className="space-y-6">
                    {/* History Tracking */}
                    <div className="p-4 border border-outline-variant/30 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-medium text-on-surface">Save to History</h4>
                          <p className="text-sm text-on-surface-variant">Keep a record of this generation for auditing</p>
                        </div>
                        <Switch checked={saveToHistory} onChange={(e) => setSaveToHistory(e.target.checked)} disabled={isGenerating} />
                      </div>

                      {saveToHistory && (
                        <div className="space-y-4 pt-4 border-t border-outline-variant/20">
                          <div>
                            <label className="block text-sm font-medium text-on-surface mb-1">Generated By</label>
                            <Input
                              value={generatedBy}
                              onChange={(e) => setGeneratedBy(e.target.value)}
                              placeholder="Your name or identifier"
                              disabled={isGenerating}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-on-surface mb-1">Notes</label>
                            <Textarea
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              placeholder="Optional notes about this generation"
                              rows={3}
                              disabled={isGenerating}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Info about computed variables */}
                    {definitions.some((d) => d.isComputed) && (
                      <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/10 rounded-lg">
                        <Info className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <h4 className="font-medium text-on-surface">Computed Variables</h4>
                          <p className="text-sm text-on-surface-variant">
                            Some variables are automatically calculated based on other values. They will be computed during PDF generation.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-medium text-on-surface mb-2">Ready to Generate</h3>
                <p className="text-sm text-on-surface-variant max-w-sm">
                  This document has no variable placeholders. Click generate to create your PDF.
                </p>

                {/* Show history option even without variables */}
                <div className="mt-6 p-4 border border-outline-variant/30 rounded-lg w-full max-w-sm">
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <h4 className="font-medium text-on-surface text-sm">Save to History</h4>
                      <p className="text-xs text-on-surface-variant">Track this generation</p>
                    </div>
                    <Switch checked={saveToHistory} onChange={(e) => setSaveToHistory(e.target.checked)} disabled={isGenerating} />
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        <DialogFooter>
          <Button variant="text" onClick={() => onOpenChange(false)} disabled={isGenerating}>
            Cancel
          </Button>
          <Button onClick={validateAndGenerate} disabled={isLoading || isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Generate PDF
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
