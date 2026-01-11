'use client';

import { useState, useCallback } from 'react';
import { FileText, Hash, Calendar, User, Building2, Copy, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
  Button,
  Textarea,
  NumberStepper,
  Select,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Tooltip,
  IconButton,
} from '@/app/ui/primitives';
import { useDocumentStore } from '@/lib/store/documentStore';
import type { HeaderFooterContent, TextLabelProperties } from '@/lib/types/document.types';

interface HeaderFooterEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editMode: 'header' | 'footer';
}

// Available variables for header/footer
const AVAILABLE_VARIABLES = [
  { key: '{{pageNumber}}', label: 'Page Number', icon: Hash, description: 'Current page number' },
  { key: '{{totalPages}}', label: 'Total Pages', icon: FileText, description: 'Total number of pages' },
  { key: '{{date}}', label: 'Current Date', icon: Calendar, description: "Today's date" },
  { key: '{{year}}', label: 'Year', icon: Calendar, description: 'Current year' },
  { key: '{{documentTitle}}', label: 'Document Title', icon: FileText, description: 'Title of the document' },
  { key: '{{companyName}}', label: 'Company Name', icon: Building2, description: 'Company name variable' },
  { key: '{{insuredName}}', label: 'Insured Name', icon: User, description: 'Insured party name' },
  { key: '{{policyNumber}}', label: 'Policy Number', icon: Hash, description: 'Insurance policy number' },
];

// Template type options
const TEMPLATE_TYPES: { value: 'default' | 'firstPage' | 'compact'; label: string }[] = [
  { value: 'default', label: 'Default' },
  { value: 'firstPage', label: 'First Page' },
  { value: 'compact', label: 'Compact' },
];

// Helper to compute initial values from content
function getInitialValues(
  content: HeaderFooterContent | null,
  editMode: 'header' | 'footer'
): { height: number; textContent: string; textAlign: 'left' | 'center' | 'right'; fontSize: number } {
  if (content) {
    const textComponent = content.components.find((c) => c.type === 'text-label');
    if (textComponent && textComponent.properties) {
      const props = textComponent.properties as TextLabelProperties;
      // Filter textAlign to only valid header/footer values (justify not supported in headers/footers)
      const validAlign = props.textAlign === 'justify' ? 'left' : props.textAlign;
      return {
        height: content.height,
        textContent: props.content || '',
        textAlign: validAlign || 'center',
        fontSize: props.fontSize || 10,
      };
    }
    return {
      height: content.height,
      textContent: editMode === 'footer' ? 'Page {{pageNumber}} of {{totalPages}}' : '',
      textAlign: 'center',
      fontSize: 10,
    };
  }
  return {
    height: editMode === 'header' ? 25 : 15,
    textContent: editMode === 'footer' ? 'Page {{pageNumber}} of {{totalPages}}' : '',
    textAlign: 'center',
    fontSize: 10,
  };
}

/**
 * HeaderFooterEditor - Dialog for editing header or footer content
 * Allows users to configure height, text content, and insert variables
 */
export function HeaderFooterEditor({ open, onOpenChange, editMode }: HeaderFooterEditorProps) {
  // Use a key to reset the form when the dialog opens
  const [formKey, setFormKey] = useState(0);

  // Reset form when dialog opens
  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (isOpen) {
        setFormKey((k) => k + 1);
      }
      onOpenChange(isOpen);
    },
    [onOpenChange]
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent size="lg" showClose>
        <DialogHeader>
          <DialogTitle>Edit {editMode === 'header' ? 'Header' : 'Footer'}</DialogTitle>
          <DialogDescription>Configure the {editMode} content and appearance. Use variables to insert dynamic values.</DialogDescription>
        </DialogHeader>
        {open && <HeaderFooterEditorForm key={formKey} editMode={editMode} onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Inner form component that gets remounted when dialog opens
 */
function HeaderFooterEditorForm({ editMode, onClose }: { editMode: 'header' | 'footer'; onClose: () => void }) {
  const { document, updateHeader, updateFooter } = useDocumentStore();

  // Track which template type we're editing
  const [templateType, setTemplateType] = useState<'default' | 'firstPage' | 'compact'>('default');

  // Get current content based on mode and template type
  const getCurrentContent = useCallback((): HeaderFooterContent | null => {
    if (!document) return null;

    if (editMode === 'header') {
      switch (templateType) {
        case 'firstPage':
          return document.headerFooter.firstPageHeader || null;
        case 'compact':
          return document.headerFooter.compactHeader || null;
        default:
          return document.headerFooter.defaultHeader;
      }
    } else {
      switch (templateType) {
        case 'firstPage':
          return document.headerFooter.firstPageFooter || null;
        case 'compact':
          return document.headerFooter.compactFooter || null;
        default:
          return document.headerFooter.defaultFooter;
      }
    }
  }, [document, editMode, templateType]);

  // Get initial values based on current content
  const currentContent = getCurrentContent();
  const initialValues = getInitialValues(currentContent, editMode);

  // Local state for editing - initialized from current content
  const [height, setHeight] = useState(initialValues.height);
  const [textContent, setTextContent] = useState(initialValues.textContent);
  const [textAlign, setTextAlign] = useState(initialValues.textAlign);
  const [fontSize, setFontSize] = useState(initialValues.fontSize);

  // Update form when template type changes
  const handleTemplateTypeChange = (newType: 'default' | 'firstPage' | 'compact') => {
    setTemplateType(newType);
    // Reset form values for the new template type
    const newContent = (() => {
      if (!document) return null;
      if (editMode === 'header') {
        switch (newType) {
          case 'firstPage':
            return document.headerFooter.firstPageHeader || null;
          case 'compact':
            return document.headerFooter.compactHeader || null;
          default:
            return document.headerFooter.defaultHeader;
        }
      } else {
        switch (newType) {
          case 'firstPage':
            return document.headerFooter.firstPageFooter || null;
          case 'compact':
            return document.headerFooter.compactFooter || null;
          default:
            return document.headerFooter.defaultFooter;
        }
      }
    })();
    const values = getInitialValues(newContent, editMode);
    setHeight(values.height);
    setTextContent(values.textContent);
    setTextAlign(values.textAlign);
    setFontSize(values.fontSize);
  };

  // Insert variable at cursor position
  const handleInsertVariable = (variable: string) => {
    setTextContent((prev) => prev + variable);
  };

  // Copy variable to clipboard
  const handleCopyVariable = async (variable: string) => {
    try {
      await navigator.clipboard.writeText(variable);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Save changes
  const handleSave = () => {
    // Create the content structure
    const newContent: HeaderFooterContent = {
      height,
      components: textContent.trim()
        ? [
            {
              id: `${editMode}-${templateType}-text`,
              type: 'text-label',
              position: { x: 10, y: height / 2 - 3 },
              size: { width: 190, height: 10 },
              properties: {
                content: textContent,
                fontSize,
                fontFamily: 'Inter',
                fontWeight: 'normal',
                italic: false,
                color: '#000000',
                backgroundColor: undefined,
                textAlign,
                letterSpacing: 0,
                wordSpacing: 0,
                lineHeight: 1,
                decoration: 'none',
                decorationStyle: 'solid',
                decorationColor: undefined,
                decorationThickness: 1,
              } as TextLabelProperties,
            },
          ]
        : [],
    };

    // Update store
    if (editMode === 'header') {
      updateHeader(templateType, newContent);
    } else {
      updateFooter(templateType, newContent);
    }

    onClose();
  };

  // Reset to defaults
  const handleReset = () => {
    if (editMode === 'header') {
      setHeight(25);
      setTextContent('');
    } else {
      setHeight(15);
      setTextContent('Page {{pageNumber}} of {{totalPages}}');
    }
    setTextAlign('center');
    setFontSize(10);
  };

  return (
    <>
      <DialogBody className="space-y-6">
        {/* Template Type Tabs */}
        <Tabs value={templateType} onValueChange={(v) => handleTemplateTypeChange(v as 'default' | 'firstPage' | 'compact')}>
          <TabsList>
            {TEMPLATE_TYPES.map((type) => (
              <TabsTrigger key={type.value} value={type.value}>
                {type.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={templateType} className="mt-4 space-y-6">
            {/* Height Setting */}
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-on-surface w-24">Height</label>
              <NumberStepper value={height} onChange={setHeight} min={10} max={50} step={5} suffix="mm" size="sm" />
              <span className="text-xs text-on-surface-variant">Recommended: {editMode === 'header' ? '20-30mm' : '10-20mm'}</span>
            </div>

            {/* Text Content */}
            <div>
              <label className="block text-sm font-medium text-on-surface mb-2">Content</label>
              <Textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder={`Enter ${editMode} text. Use variables like {{pageNumber}}`}
                rows={3}
                className="font-mono text-sm"
              />
            </div>

            {/* Text Options Row */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-on-surface">Align</label>
                <Select
                  value={textAlign}
                  onChange={(v) => setTextAlign(v as 'left' | 'center' | 'right')}
                  options={[
                    { value: 'left', label: 'Left' },
                    { value: 'center', label: 'Center' },
                    { value: 'right', label: 'Right' },
                  ]}
                  size="sm"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-on-surface">Font Size</label>
                <NumberStepper value={fontSize} onChange={setFontSize} min={8} max={16} step={1} suffix="pt" size="sm" />
              </div>
            </div>

            {/* Available Variables */}
            <div>
              <label className="block text-sm font-medium text-on-surface mb-3">Available Variables</label>
              <div className="grid grid-cols-2 gap-2">
                {AVAILABLE_VARIABLES.map((variable) => {
                  const Icon = variable.icon;
                  return (
                    <div
                      key={variable.key}
                      className="flex items-center gap-2 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-2 hover:bg-surface-container transition-colors"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-on-surface truncate">{variable.label}</p>
                        <p className="text-xs text-on-surface-variant font-mono truncate">{variable.key}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Tooltip content="Copy to clipboard">
                          <IconButton
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyVariable(variable.key)}
                            aria-label="Copy variable"
                            icon={<Copy className="h-3.5 w-3.5" />}
                          />
                        </Tooltip>
                        <Tooltip content="Insert into content">
                          <IconButton
                            variant="ghost"
                            size="sm"
                            onClick={() => handleInsertVariable(variable.key)}
                            aria-label="Insert variable"
                            icon={<Plus className="h-3.5 w-3.5" />}
                          />
                        </Tooltip>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Preview */}
            <div>
              <label className="block text-sm font-medium text-on-surface mb-2">Preview</label>
              <div
                className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4"
                style={{
                  minHeight: `${Math.max(40, height * 1.5)}px`,
                  textAlign,
                  fontSize: `${fontSize}px`,
                }}
              >
                {textContent ? (
                  <span className="text-on-surface">
                    {textContent
                      .replace('{{pageNumber}}', '1')
                      .replace('{{totalPages}}', '5')
                      .replace('{{date}}', new Date().toLocaleDateString())
                      .replace('{{year}}', String(new Date().getFullYear()))
                      .replace('{{documentTitle}}', 'Insurance Contract')
                      .replace('{{companyName}}', 'ABC Insurance Co.')
                      .replace('{{insuredName}}', 'John Doe')
                      .replace('{{policyNumber}}', 'POL-2025-001234')}
                  </span>
                ) : (
                  <span className="text-on-surface-variant/50 italic">No content configured</span>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogBody>

      <DialogFooter>
        <Button variant="text" onClick={handleReset}>
          Reset to Default
        </Button>
        <div className="flex-1" />
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="filled" onClick={handleSave}>
          Save Changes
        </Button>
      </DialogFooter>
    </>
  );
}
