'use client';

import { useState } from 'react';
import { FileStack } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
  Textarea,
  Select,
} from '@/app/ui/primitives';
import type { TemplateCategory, Document } from '@/lib/types/document.types';
import { TEMPLATE_CATEGORIES } from '@/lib/templates';
import { createTemplate } from '@/lib/api';

interface SaveAsTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: Document | null;
  onSuccess?: () => void;
}

export function SaveAsTemplateDialog({ open, onOpenChange, document, onSuccess }: SaveAsTemplateDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TemplateCategory>('general');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens
  function handleOpenChange(isOpen: boolean) {
    if (isOpen) {
      setName(document?.title ? `${document.title} Template` : '');
      setDescription('');
      setCategory('general');
      setError(null);
    }
    onOpenChange(isOpen);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!document) {
      setError('No document to save as template');
      return;
    }

    if (!name.trim()) {
      setError('Template name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const templateContent = {
        pages: document.pages,
        headerFooter: document.headerFooter,
        variables: document.variables,
      };

      await createTemplate({
        name: name.trim(),
        description: description.trim(),
        category,
        content: JSON.stringify(templateContent),
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      console.error('Failed to save template:', err);
      setError('Failed to save template. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent size="default">
        <DialogHeader hero icon={<FileStack className="h-6 w-6" />} title="Save as Template" variant="primary">
          <DialogTitle>Save as Template</DialogTitle>
          <DialogDescription>
            Create a reusable template from this document. Templates can be used to quickly create new documents with the same structure.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 p-5">
            <Input
              label="Template Name"
              placeholder="Enter template name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              error={error && !name.trim() ? 'Name is required' : undefined}
            />

            <Textarea
              label="Description"
              placeholder="Describe what this template is used for..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />

            <div className="w-full">
              <label className="block text-sm font-semibold mb-2 text-on-surface">Category</label>
              <Select
                value={category}
                onChange={(value) => setCategory(value as TemplateCategory)}
                options={TEMPLATE_CATEGORIES.map((cat) => ({
                  value: cat.id,
                  label: cat.name,
                }))}
                placeholder="Select a category"
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-error-container/50 border border-error/20">
                <p className="text-sm text-on-error-container">{error}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="filled" loading={isSubmitting}>
              Save Template
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
