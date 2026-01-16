'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FileText, Plus, Shield, Scale, Briefcase, Heart, DollarSign, Search, Loader2, ChevronRight, Files, Sparkles, FileUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardTitle, Button, Input, Badge, PageLoading, EmptyState } from '@/app/ui/primitives';
import { ThemeSelector } from '@/components/ThemeSelector';
import { ImportDocxDialog } from '@/components/pdf-builder';
import type { Template, TemplateCategory, Document } from '@/lib/types/document.types';
import { BUILT_IN_TEMPLATES, TEMPLATE_CATEGORIES, cloneTemplateContent } from '@/lib/templates';
import { fetchTemplates, parseTemplateResponse, createDocument, updateDocument } from '@/lib/api';

// Map category to Lucide icon component
const CATEGORY_ICONS: Record<TemplateCategory, typeof FileText> = {
  insurance: Shield,
  legal: Scale,
  business: Briefcase,
  healthcare: Heart,
  financial: DollarSign,
  general: FileText,
};

// Category color schemes for visual distinction
const CATEGORY_COLORS: Record<TemplateCategory, { bg: string; text: string; border: string }> = {
  insurance: { bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' },
  legal: {
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-200 dark:border-purple-800',
  },
  business: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  healthcare: { bg: 'bg-rose-50 dark:bg-rose-950/30', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-800' },
  financial: { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800' },
  general: { bg: 'bg-slate-50 dark:bg-slate-900/30', text: 'text-slate-600 dark:text-slate-400', border: 'border-slate-200 dark:border-slate-700' },
};

interface TemplateCardProps {
  template: Template;
  onSelect: (template: Template) => void;
  isLoading: boolean;
  selectedId: string | null;
}

function TemplateCard({ template, onSelect, isLoading, selectedId }: TemplateCardProps) {
  const Icon = CATEGORY_ICONS[template.category];
  const colors = CATEGORY_COLORS[template.category];
  const isSelected = selectedId === template.id;
  const isBlank = template.id === 'blank';

  return (
    <Card
      variant='interactive'
      padding='none'
      className='group relative overflow-hidden'
      onClick={() => !isLoading && onSelect(template)}
      role='button'
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (!isLoading) onSelect(template);
        }
      }}
    >
      {/* Template Preview Area */}
      <div
        className={`relative h-40 ${
          isBlank ? 'bg-linear-to-br from-surface-container to-surface-container-high' : colors.bg
        } flex items-center justify-center overflow-hidden`}
      >
        {isBlank ? (
          <div className='flex flex-col items-center gap-3'>
            <div className='rounded-2xl bg-surface p-4 border-2 border-dashed border-outline-variant/40'>
              <Plus className='h-8 w-8 text-on-surface-variant/50' />
            </div>
            <span className='text-sm font-medium text-on-surface-variant/70'>Start Fresh</span>
          </div>
        ) : (
          <>
            {/* Template page preview mockup */}
            <div className='absolute inset-4 bg-surface rounded-lg border border-outline-variant/20 shadow-sm overflow-hidden'>
              {/* Header bar */}
              <div className={`h-6 ${colors.bg} border-b ${colors.border}`} />
              {/* Content lines */}
              <div className='p-3 space-y-2'>
                <div className='h-2 w-3/4 bg-on-surface/10 rounded' />
                <div className='h-2 w-1/2 bg-on-surface/5 rounded' />
                <div className='h-2 w-2/3 bg-on-surface/5 rounded' />
                <div className='mt-3 h-6 w-full bg-on-surface/5 rounded' />
                <div className='h-2 w-full bg-on-surface/5 rounded' />
              </div>
            </div>
            {/* Category icon overlay */}
            <div className={`absolute top-3 right-3 p-2 rounded-full bg-surface/90 backdrop-blur-sm ${colors.text}`}>
              <Icon className='h-4 w-4' />
            </div>
          </>
        )}

        {/* Loading overlay */}
        {isLoading && isSelected && (
          <div className='absolute inset-0 bg-surface/80 backdrop-blur-sm flex items-center justify-center'>
            <Loader2 className='h-6 w-6 animate-spin text-primary' />
          </div>
        )}
      </div>

      {/* Template Info */}
      <CardContent className='p-4'>
        <div className='flex items-start justify-between gap-2'>
          <div className='flex-1 min-w-0'>
            <CardTitle className='text-base font-semibold text-on-surface truncate'>{template.name}</CardTitle>
            <CardDescription className='mt-1 text-sm text-on-surface-variant line-clamp-2'>{template.description}</CardDescription>
          </div>
        </div>

        {/* Tags */}
        <div className='mt-3 flex items-center gap-2'>
          {!isBlank && (
            <Badge variant='secondary' size='sm'>
              {TEMPLATE_CATEGORIES.find((c) => c.id === template.category)?.name || template.category}
            </Badge>
          )}
          {template.isBuiltIn && !isBlank && (
            <Badge variant='info' size='sm'>
              <Sparkles className='h-3 w-3 mr-1' />
              Built-in
            </Badge>
          )}
          {!isBlank && (
            <span className='ml-auto text-xs text-on-surface-variant/60'>
              {template.content.pages.length} page{template.content.pages.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </CardContent>

      {/* Hover action hint */}
      <div className='absolute inset-x-0 bottom-0 h-0 group-hover:h-10 transition-all duration-200 bg-primary/10 backdrop-blur-sm flex items-center justify-center overflow-hidden'>
        <span className='text-sm font-medium text-primary flex items-center gap-1'>
          Use this template <ChevronRight className='h-4 w-4' />
        </span>
      </div>
    </Card>
  );
}

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
  const [error, setError] = useState<string | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  // Load templates on mount
  useEffect(() => {
    async function loadTemplates() {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch user-created templates from API
        const userTemplates = await fetchTemplates();
        const parsedUserTemplates = userTemplates.map(parseTemplateResponse);

        // Combine with built-in templates
        setTemplates([...BUILT_IN_TEMPLATES, ...parsedUserTemplates]);
      } catch (err) {
        console.error('Failed to load templates:', err);
        // Even if API fails, show built-in templates
        setTemplates(BUILT_IN_TEMPLATES);
        // Only show error if there were supposed to be user templates
        // setError('Failed to load user templates. Showing built-in templates only.');
      } finally {
        setIsLoading(false);
      }
    }

    loadTemplates();
  }, []);

  // Filter templates based on search and category
  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      // Category filter
      if (selectedCategory !== 'all' && template.category !== selectedCategory) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return template.name.toLowerCase().includes(query) || template.description.toLowerCase().includes(query);
      }

      return true;
    });
  }, [templates, searchQuery, selectedCategory]);

  // Handle template selection and document creation
  async function handleSelectTemplate(template: Template) {
    setIsCreating(true);
    setSelectedTemplateId(template.id);
    setError(null);

    try {
      // Generate a title based on template
      const title =
        template.id === 'blank' ? `Untitled Document - ${new Date().toLocaleDateString()}` : `${template.name} - ${new Date().toLocaleDateString()}`;

      // Create a new document
      const response = await createDocument(title);

      // Clone template content with new IDs
      const clonedContent = cloneTemplateContent(template);

      // Update the document with template content
      await updateDocument(response.id, {
        content: JSON.stringify(clonedContent),
      });

      // Navigate to the builder
      router.push(`/builder/${response.id}`);
    } catch (err) {
      console.error('Failed to create document from template:', err);
      setError('Failed to create document. Please try again.');
      setIsCreating(false);
      setSelectedTemplateId(null);
    }
  }

  // Handle successful DOCX import
  function handleImportSuccess(document: Document) {
    // Navigate to the builder with the imported document
    router.push(`/builder/${document.id}`);
  }

  if (isLoading) {
    return (
      <div className='min-h-screen bg-surface-container-lowest flex items-center justify-center'>
        <PageLoading message='Loading templates...' />
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-surface-container-lowest'>
      {/* Header */}
      <header className='sticky top-0 z-10 bg-surface/95 backdrop-blur-md border-b border-outline-variant/20'>
        <div className='max-w-7xl mx-auto px-6 py-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='p-2 rounded-2xl bg-primary/10'>
                <Files className='h-6 w-6 text-primary' />
              </div>
              <div>
                <h1 className='text-xl font-bold text-on-surface'>Document Templates</h1>
                <p className='text-sm text-on-surface-variant'>Choose a template to start your document</p>
              </div>
            </div>
            <div className='flex items-center gap-3'>
              <ThemeSelector />
              <div className='h-6 w-px bg-outline-variant/30' />
              <Link href='/'>
                <Button variant='outline' size='sm'>
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className='max-w-7xl mx-auto px-6 py-8'>
        {/* Search and Filters */}
        <div className='flex flex-col sm:flex-row gap-4 mb-8'>
          <div className='relative flex-1 max-w-md'>
            <Input
              type='text'
              placeholder='Search templates...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              startIcon={<Search className='h-4 w-4' />}
              variant='filled'
            />
          </div>

          {/* Category Filters */}
          <div className='flex gap-2 flex-wrap'>
            <Button variant={selectedCategory === 'all' ? 'tonal' : 'outline'} size='sm' onClick={() => setSelectedCategory('all')}>
              All
            </Button>
            {TEMPLATE_CATEGORIES.map((category) => {
              const Icon = CATEGORY_ICONS[category.id];
              return (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? 'tonal' : 'outline'}
                  size='sm'
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <Icon className='h-4 w-4 mr-1.5' />
                  {category.name}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className='mb-6 p-4 rounded-2xl bg-error-container/50 border border-error/20'>
            <p className='text-sm text-on-error-container'>{error}</p>
          </div>
        )}

        {/* Templates Grid */}
        {filteredTemplates.length === 0 ? (
          <EmptyState
            icon={<FileText className='h-12 w-12' />}
            title='No templates found'
            description={searchQuery ? 'Try adjusting your search or filter criteria' : 'No templates available in this category'}
          />
        ) : (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
            {/* Import from Word Card - Always shown first */}
            <Card
              variant='interactive'
              padding='none'
              className='group relative overflow-hidden border-2 border-dashed border-primary/30 hover:border-primary'
              onClick={() => setImportDialogOpen(true)}
              role='button'
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setImportDialogOpen(true);
                }
              }}
            >
              {/* Import Preview Area */}
              <div className='relative h-40 bg-linear-to-br from-primary/5 to-primary/10 flex items-center justify-center overflow-hidden'>
                <div className='flex flex-col items-center gap-3'>
                  <div className='rounded-2xl bg-surface p-4 border-2 border-dashed border-primary/40 group-hover:border-primary transition-colors'>
                    <FileUp className='h-8 w-8 text-primary' />
                  </div>
                  <span className='text-sm font-medium text-primary'>Import Document</span>
                </div>
              </div>

              {/* Import Info */}
              <CardContent className='p-4'>
                <div className='flex items-start justify-between gap-2'>
                  <div className='flex-1 min-w-0'>
                    <CardTitle className='text-base font-semibold text-on-surface truncate'>Import from Word</CardTitle>
                    <CardDescription className='mt-1 text-sm text-on-surface-variant line-clamp-2'>
                      Upload a .docx file to convert it into an editable document
                    </CardDescription>
                  </div>
                </div>

                {/* Tags */}
                <div className='mt-3 flex items-center gap-2'>
                  <Badge variant='default' size='sm'>
                    .docx
                  </Badge>
                  <Badge variant='secondary' size='sm'>
                    1:1 Conversion
                  </Badge>
                </div>
              </CardContent>

              {/* Hover action hint */}
              <div className='absolute inset-x-0 bottom-0 h-0 group-hover:h-10 transition-all duration-200 bg-primary/10 backdrop-blur-sm flex items-center justify-center overflow-hidden'>
                <span className='text-sm font-medium text-primary flex items-center gap-1'>
                  Select file to import <ChevronRight className='h-4 w-4' />
                </span>
              </div>
            </Card>

            {/* Template Cards */}
            {filteredTemplates.map((template) => (
              <TemplateCard key={template.id} template={template} onSelect={handleSelectTemplate} isLoading={isCreating} selectedId={selectedTemplateId} />
            ))}
          </div>
        )}

        {/* Template Count */}
        <div className='mt-8 text-center text-sm text-on-surface-variant'>
          Showing {filteredTemplates.length} of {templates.length} templates
        </div>
      </main>

      {/* Import from Word Dialog */}
      <ImportDocxDialog open={importDialogOpen} onOpenChange={setImportDialogOpen} onSuccess={handleImportSuccess} />
    </div>
  );
}
