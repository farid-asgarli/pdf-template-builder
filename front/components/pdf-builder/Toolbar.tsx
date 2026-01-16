'use client';

import Link from 'next/link';
import { Button, IconButton, Badge, Tooltip } from '@/app/ui/primitives';
import { FileText, Save, Undo2, Redo2, ZoomIn, ZoomOut, ChevronLeft, Loader2, Variable } from 'lucide-react';
import type { PreviewMode } from '@/lib/hooks';
import { ThemeSelector } from '@/components/ThemeSelector';
import { ViewMenu } from './toolbar/ViewMenu';
import { ExportMenu } from './toolbar/ExportMenu';

interface ToolbarProps {
  documentTitle: string;
  isDirty: boolean;
  isSaving: boolean;
  isGeneratingPdf?: boolean;
  isPreviewVisible?: boolean;
  isHistoryVisible?: boolean;
  isVariableManagerVisible?: boolean;
  previewMode?: PreviewMode;
  zoom?: number;
  showGrid?: boolean;
  variableCount?: number;
  onSave?: () => void;
  onGeneratePdf?: () => void;
  onGenerateWithVariables?: () => void;
  onGenerateHtml?: () => void;
  onTogglePreview?: () => void;
  onToggleHistory?: () => void;
  onToggleVariableManager?: () => void;
  onPreviewModeChange?: (mode: PreviewMode) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onToggleGrid?: () => void;
  onEditHeader?: () => void;
  onEditFooter?: () => void;
  onSaveAsTemplate?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export function Toolbar({
  documentTitle,
  isDirty,
  isSaving,
  isGeneratingPdf = false,
  isPreviewVisible = false,
  isHistoryVisible = false,
  isVariableManagerVisible = false,
  previewMode = 'side-by-side',
  showGrid = true,
  zoom = 100,
  variableCount = 0,
  onSave,
  onGeneratePdf,
  onGenerateWithVariables,
  onGenerateHtml,
  onTogglePreview,
  onToggleHistory,
  onToggleVariableManager,
  onPreviewModeChange,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onToggleGrid,
  onEditHeader,
  onEditFooter,
  onSaveAsTemplate,
  canUndo = false,
  canRedo = false,
}: ToolbarProps) {
  return (
    <header className='flex h-14 items-center justify-between border-b border-outline-variant/25 bg-surface px-4'>
      {/* Left section - Navigation & Document Info */}
      <div className='flex items-center gap-3'>
        <Link href='/'>
          <IconButton variant='ghost' size='sm' aria-label='Back to home' icon={<ChevronLeft className='h-5 w-5' />} />
        </Link>
        <div className='h-6 w-px bg-outline-variant/30' />
        <div className='flex items-center gap-2'>
          <FileText className='h-5 w-5 text-primary' />
          <span className='font-semibold text-on-surface'>{documentTitle}</span>
        </div>
        {isDirty && (
          <Badge variant='warning' size='sm'>
            Unsaved
          </Badge>
        )}
        {isSaving && (
          <Badge variant='info' size='sm'>
            Saving...
          </Badge>
        )}
      </div>

      {/* Center section - Edit Actions */}
      <div className='flex items-center gap-1'>
        {/* Undo/Redo */}
        <Tooltip content='Undo (⌘Z)'>
          <IconButton variant='ghost' size='sm' aria-label='Undo' disabled={!canUndo} onClick={onUndo} icon={<Undo2 className='h-4 w-4' />} />
        </Tooltip>
        <Tooltip content='Redo (⌘⇧Z)'>
          <IconButton variant='ghost' size='sm' aria-label='Redo' disabled={!canRedo} onClick={onRedo} icon={<Redo2 className='h-4 w-4' />} />
        </Tooltip>

        <div className='mx-2 h-6 w-px bg-outline-variant/30' />

        {/* View Menu - Consolidates Grid, Preview, History, Header/Footer */}
        <ViewMenu
          showGrid={showGrid}
          isPreviewVisible={isPreviewVisible}
          isHistoryVisible={isHistoryVisible}
          previewMode={previewMode}
          onToggleGrid={() => onToggleGrid?.()}
          onTogglePreview={() => onTogglePreview?.()}
          onToggleHistory={() => onToggleHistory?.()}
          onPreviewModeChange={(mode) => onPreviewModeChange?.(mode)}
          onEditHeader={() => onEditHeader?.()}
          onEditFooter={() => onEditFooter?.()}
        />

        <div className='mx-2 h-6 w-px bg-outline-variant/30' />

        {/* Variables Manager Button - Kept visible as it's frequently used */}
        <Tooltip content={isVariableManagerVisible ? 'Hide Variables' : 'Manage Variables'}>
          <Button variant={isVariableManagerVisible ? 'tonal' : 'text'} size='sm' onClick={onToggleVariableManager} className='relative'>
            <Variable className='h-4 w-4' />
            Variables
            {variableCount > 0 && (
              <span className='ml-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1 text-xs font-medium text-primary'>
                {variableCount}
              </span>
            )}
          </Button>
        </Tooltip>

        <div className='mx-2 h-6 w-px bg-outline-variant/30' />

        {/* Zoom Controls */}
        <Tooltip content='Zoom out'>
          <IconButton variant='ghost' size='sm' aria-label='Zoom out' onClick={onZoomOut} icon={<ZoomOut className='h-4 w-4' />} />
        </Tooltip>
        <span className='min-w-12 text-center text-sm text-on-surface-variant'>{zoom}%</span>
        <Tooltip content='Zoom in'>
          <IconButton variant='ghost' size='sm' aria-label='Zoom in' onClick={onZoomIn} icon={<ZoomIn className='h-4 w-4' />} />
        </Tooltip>
      </div>

      {/* Right section - Save & Export */}
      <div className='flex items-center gap-2'>
        {/* Theme selector */}
        <ThemeSelector />

        <div className='h-6 w-px bg-outline-variant/30' />

        {/* Save Button */}
        <Button variant='outline' size='sm' onClick={onSave} disabled={isSaving || !isDirty}>
          {isSaving ? <Loader2 className='h-4 w-4 animate-spin' /> : <Save className='h-4 w-4' />}
          {isSaving ? 'Saving...' : 'Save'}
        </Button>

        {/* Export Menu - Consolidates PDF, HTML, Template exports */}
        <ExportMenu
          isGeneratingPdf={isGeneratingPdf}
          onGeneratePdf={() => onGeneratePdf?.()}
          onGenerateWithVariables={() => onGenerateWithVariables?.()}
          onGenerateHtml={() => onGenerateHtml?.()}
          onSaveAsTemplate={() => onSaveAsTemplate?.()}
        />

        {/* Primary CTA - Generate PDF */}
        <Button variant='filled' size='sm' onClick={onGenerateWithVariables} disabled={isGeneratingPdf}>
          {isGeneratingPdf ? <Loader2 className='h-4 w-4 animate-spin' /> : <Variable className='h-4 w-4' />}
          Generate PDF
        </Button>
      </div>
    </header>
  );
}
