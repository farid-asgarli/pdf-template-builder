'use client';

import Link from 'next/link';
import { Button, IconButton, Badge, Tooltip, Select } from '@/app/ui/primitives';
import {
  FileText,
  Download,
  Save,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Grid3X3,
  ChevronLeft,
  Loader2,
  PanelTop,
  PanelBottom,
  FileStack,
  Eye,
  EyeOff,
  PanelRightOpen,
  Maximize2,
  ExternalLink,
  History,
  Variable,
  FileCode,
} from 'lucide-react';
import type { PreviewMode } from '@/lib/hooks';

const PREVIEW_MODE_OPTIONS = [
  { value: 'side-by-side', label: 'Side Panel' },
  { value: 'dialog', label: 'Dialog' },
  { value: 'new-tab', label: 'New Tab' },
];

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
  const getPreviewIcon = () => {
    if (isPreviewVisible) return <EyeOff className="h-4 w-4" />;
    switch (previewMode) {
      case 'dialog':
        return <Maximize2 className="h-4 w-4" />;
      case 'new-tab':
        return <ExternalLink className="h-4 w-4" />;
      default:
        return <PanelRightOpen className="h-4 w-4" />;
    }
  };

  const getPreviewLabel = () => {
    if (isPreviewVisible) return 'Hide Preview';
    switch (previewMode) {
      case 'dialog':
        return 'Preview Dialog';
      case 'new-tab':
        return 'Preview in Tab';
      default:
        return 'Preview';
    }
  };

  return (
    <header className="flex h-14 items-center justify-between border-b border-outline-variant/25 bg-surface px-4">
      {/* Left section */}
      <div className="flex items-center gap-3">
        <Link href="/">
          <IconButton variant="ghost" size="sm" aria-label="Back to home" icon={<ChevronLeft className="h-5 w-5" />} />
        </Link>
        <div className="h-6 w-px bg-outline-variant/30" />
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <span className="font-semibold text-on-surface">{documentTitle}</span>
        </div>
        {isDirty && (
          <Badge variant="warning" size="sm">
            Unsaved
          </Badge>
        )}
        {isSaving && (
          <Badge variant="info" size="sm">
            Saving...
          </Badge>
        )}
      </div>

      {/* Center section - Undo/Redo, Header/Footer, Zoom */}
      <div className="flex items-center gap-1">
        <Tooltip content="Undo">
          <IconButton variant="ghost" size="sm" aria-label="Undo" disabled={!canUndo} onClick={onUndo} icon={<Undo2 className="h-4 w-4" />} />
        </Tooltip>
        <Tooltip content="Redo">
          <IconButton variant="ghost" size="sm" aria-label="Redo" disabled={!canRedo} onClick={onRedo} icon={<Redo2 className="h-4 w-4" />} />
        </Tooltip>
        <div className="mx-2 h-6 w-px bg-outline-variant/30" />
        <Tooltip content="Edit header">
          <IconButton variant="ghost" size="sm" aria-label="Edit header" onClick={onEditHeader} icon={<PanelTop className="h-4 w-4" />} />
        </Tooltip>
        <Tooltip content="Edit footer">
          <IconButton variant="ghost" size="sm" aria-label="Edit footer" onClick={onEditFooter} icon={<PanelBottom className="h-4 w-4" />} />
        </Tooltip>
        <div className="mx-2 h-6 w-px bg-outline-variant/30" />
        {/* Variables Manager Button */}
        <Tooltip content={isVariableManagerVisible ? 'Hide Variables' : 'Manage Variables'}>
          <Button variant={isVariableManagerVisible ? 'tonal' : 'text'} size="sm" onClick={onToggleVariableManager} className="relative">
            <Variable className="h-4 w-4" />
            Variables
            {variableCount > 0 && (
              <span className="ml-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1 text-xs font-medium text-primary">
                {variableCount}
              </span>
            )}
          </Button>
        </Tooltip>
        <div className="mx-2 h-6 w-px bg-outline-variant/30" />
        <Tooltip content="Zoom out">
          <IconButton variant="ghost" size="sm" aria-label="Zoom out" onClick={onZoomOut} icon={<ZoomOut className="h-4 w-4" />} />
        </Tooltip>
        <span className="min-w-12 text-center text-sm text-on-surface-variant">{zoom}%</span>
        <Tooltip content="Zoom in">
          <IconButton variant="ghost" size="sm" aria-label="Zoom in" onClick={onZoomIn} icon={<ZoomIn className="h-4 w-4" />} />
        </Tooltip>
        <Tooltip content={showGrid ? 'Hide grid' : 'Show grid'}>
          <IconButton
            variant={showGrid ? 'filled-tonal' : 'ghost'}
            size="sm"
            aria-label="Toggle grid"
            onClick={onToggleGrid}
            icon={<Grid3X3 className="h-4 w-4" />}
          />
        </Tooltip>
      </div>

      {/* Right section - Actions */}
      <div className="flex items-center gap-2">
        {/* Preview mode selector */}
        <div className="flex items-center rounded-full bg-surface-container/60 p-0.5">
          <Tooltip content={isPreviewVisible ? 'Hide preview' : getPreviewLabel()}>
            <Button variant={isPreviewVisible ? 'tonal' : 'text'} size="sm" onClick={onTogglePreview}>
              {getPreviewIcon()}
              {getPreviewLabel()}
            </Button>
          </Tooltip>
          <Select
            options={PREVIEW_MODE_OPTIONS}
            value={previewMode}
            onChange={(v) => onPreviewModeChange?.(v as PreviewMode)}
            size="sm"
            className="w-28 border-0 bg-transparent [&>button]:border-0 [&>button]:bg-transparent [&>button]:shadow-none"
          />
        </div>

        {/* History toggle */}
        <Tooltip content={isHistoryVisible ? 'Hide history' : 'Show history'}>
          <IconButton
            variant={isHistoryVisible ? 'filled-tonal' : 'ghost'}
            size="sm"
            aria-label="Toggle history"
            onClick={onToggleHistory}
            icon={<History className="h-4 w-4" />}
          />
        </Tooltip>

        <Tooltip content="Save as template">
          <Button variant="text" size="sm" onClick={onSaveAsTemplate}>
            <FileStack className="h-4 w-4" />
            Save as Template
          </Button>
        </Tooltip>
        <div className="h-6 w-px bg-outline-variant/30" />
        <Button variant="outline" size="sm" onClick={onSave} disabled={isSaving || !isDirty}>
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isSaving ? 'Saving...' : 'Save'}
        </Button>

        {/* Export buttons */}
        <div className="flex items-center gap-1">
          <Tooltip content="Export as HTML">
            <Button variant="outline" size="sm" onClick={onGenerateHtml}>
              <FileCode className="h-4 w-4" />
              HTML
            </Button>
          </Tooltip>
          <Button variant="filled" size="sm" onClick={onGenerateWithVariables} disabled={isGeneratingPdf}>
            {isGeneratingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Variable className="h-4 w-4" />}
            {isGeneratingPdf ? 'Generating...' : 'Generate PDF'}
          </Button>
        </div>
      </div>
    </header>
  );
}
