'use client';

import { PanelTop, PanelBottom, FileText, Monitor, Palette } from 'lucide-react';
import { Select, NumberStepper, ColorPicker } from '@/app/ui/primitives';
import { useDocumentStore, DEFAULT_PAGE_SETTINGS } from '@/lib/store/documentStore';
import type { HeaderFooterType, PageSizePreset, PageOrientation, ContentDirection } from '@/lib/types/document.types';

const HEADER_FOOTER_OPTIONS: { value: HeaderFooterType; label: string }[] = [
  { value: 'default', label: 'Default' },
  { value: 'firstPage', label: 'First Page' },
  { value: 'compact', label: 'Compact' },
  { value: 'none', label: 'None' },
];

const PAGE_SIZE_OPTIONS: { value: PageSizePreset; label: string }[] = [
  { value: 'a3', label: 'A3 (297 × 420 mm)' },
  { value: 'a4', label: 'A4 (210 × 297 mm)' },
  { value: 'a5', label: 'A5 (148 × 210 mm)' },
  { value: 'letter', label: 'Letter (8.5 × 11 in)' },
  { value: 'legal', label: 'Legal (8.5 × 14 in)' },
  { value: 'ledger', label: 'Ledger (11 × 17 in)' },
  { value: 'tabloid', label: 'Tabloid (11 × 17 in)' },
  { value: 'executive', label: 'Executive (7.25 × 10.5 in)' },
  { value: 'custom', label: 'Custom Size' },
];

const ORIENTATION_OPTIONS: { value: PageOrientation; label: string }[] = [
  { value: 'portrait', label: 'Portrait' },
  { value: 'landscape', label: 'Landscape' },
];

const CONTENT_DIRECTION_OPTIONS: { value: ContentDirection; label: string }[] = [
  { value: 'ltr', label: 'Left to Right' },
  { value: 'rtl', label: 'Right to Left' },
];

/**
 * PageSettingsPanel - Displays and allows editing of page-level settings
 * Including page size, orientation, margins, background color, and header/footer types
 */
export function PageSettingsPanel() {
  const { document, currentPageId, updatePageHeaderFooterType, updatePageSettings } = useDocumentStore();

  if (!document || !currentPageId) {
    return null;
  }

  const currentPage = document.pages.find((p) => p.id === currentPageId);
  if (!currentPage) {
    return null;
  }

  // Get effective page settings (merge defaults with page-specific)
  const pageSettings = {
    ...DEFAULT_PAGE_SETTINGS,
    ...currentPage.pageSettings,
    margins: {
      ...DEFAULT_PAGE_SETTINGS.margins,
      ...currentPage.pageSettings?.margins,
    },
  };

  const handleHeaderTypeChange = (value: string) => {
    updatePageHeaderFooterType(currentPageId, value as HeaderFooterType, undefined);
  };

  const handleFooterTypeChange = (value: string) => {
    updatePageHeaderFooterType(currentPageId, undefined, value as HeaderFooterType);
  };

  const handlePageSizeChange = (value: string) => {
    updatePageSettings(currentPageId, { predefinedSize: value as PageSizePreset });
  };

  const handleOrientationChange = (value: string) => {
    updatePageSettings(currentPageId, { orientation: value as PageOrientation });
  };

  const handleContentDirectionChange = (value: string) => {
    updatePageSettings(currentPageId, { contentDirection: value as ContentDirection });
  };

  const handleBackgroundColorChange = (color: string) => {
    updatePageSettings(currentPageId, { backgroundColor: color });
  };

  const handleCustomWidthChange = (value: number) => {
    updatePageSettings(currentPageId, { width: value });
  };

  const handleCustomHeightChange = (value: number) => {
    updatePageSettings(currentPageId, { height: value });
  };

  const handleMarginChange = (side: 'top' | 'right' | 'bottom' | 'left', value: number) => {
    const currentMargins = pageSettings.margins || { top: 0, right: 0, bottom: 0, left: 0 };
    updatePageSettings(currentPageId, {
      margins: {
        top: currentMargins.top ?? 0,
        right: currentMargins.right ?? 0,
        bottom: currentMargins.bottom ?? 0,
        left: currentMargins.left ?? 0,
        [side]: value,
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* Page Info */}
      <div className="flex items-center gap-3 rounded-xl bg-surface-container-low p-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-on-surface">Page {currentPage.pageNumber}</p>
          <p className="text-xs text-on-surface-variant">
            {currentPage.components.length} component{currentPage.components.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Page Size & Orientation */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Monitor className="h-4 w-4 text-on-surface-variant" />
          <label className="text-sm font-medium text-on-surface">Page Layout</label>
        </div>

        <div className="space-y-2">
          <Select value={pageSettings.predefinedSize || 'a4'} onChange={handlePageSizeChange} options={PAGE_SIZE_OPTIONS} size="sm" />
        </div>

        {/* Custom Size Inputs (only show when custom is selected) */}
        {pageSettings.predefinedSize === 'custom' && (
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs text-on-surface-variant">Width (mm)</label>
              <NumberStepper value={pageSettings.width || 210} onChange={handleCustomWidthChange} min={50} max={1000} step={1} size="sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-on-surface-variant">Height (mm)</label>
              <NumberStepper value={pageSettings.height || 297} onChange={handleCustomHeightChange} min={50} max={1000} step={1} size="sm" />
            </div>
          </div>
        )}

        <Select value={pageSettings.orientation || 'portrait'} onChange={handleOrientationChange} options={ORIENTATION_OPTIONS} size="sm" />
      </div>

      {/* Background Color */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-on-surface-variant" />
          <label className="text-sm font-medium text-on-surface">Background</label>
        </div>
        <ColorPicker value={pageSettings.backgroundColor || '#FFFFFF'} onChange={handleBackgroundColorChange} size="sm" showInput />
      </div>

      {/* Content Direction */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-on-surface">Content Direction</label>
        <Select
          value={pageSettings.contentDirection || 'ltr'}
          onChange={handleContentDirectionChange}
          options={CONTENT_DIRECTION_OPTIONS}
          size="sm"
        />
      </div>

      {/* Margins */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-on-surface">Margins (mm)</label>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-xs text-on-surface-variant">Top</label>
            <NumberStepper
              value={pageSettings.margins?.top || 0}
              onChange={(v) => handleMarginChange('top', v)}
              min={0}
              max={100}
              step={1}
              size="sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-on-surface-variant">Right</label>
            <NumberStepper
              value={pageSettings.margins?.right || 0}
              onChange={(v) => handleMarginChange('right', v)}
              min={0}
              max={100}
              step={1}
              size="sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-on-surface-variant">Bottom</label>
            <NumberStepper
              value={pageSettings.margins?.bottom || 0}
              onChange={(v) => handleMarginChange('bottom', v)}
              min={0}
              max={100}
              step={1}
              size="sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-on-surface-variant">Left</label>
            <NumberStepper
              value={pageSettings.margins?.left || 0}
              onChange={(v) => handleMarginChange('left', v)}
              min={0}
              max={100}
              step={1}
              size="sm"
            />
          </div>
        </div>
      </div>

      {/* Header Type */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <PanelTop className="h-4 w-4 text-on-surface-variant" />
          <label className="text-sm font-medium text-on-surface">Header Type</label>
        </div>
        <Select value={currentPage.headerType} onChange={handleHeaderTypeChange} options={HEADER_FOOTER_OPTIONS} size="sm" />
        <p className="text-xs text-on-surface-variant/70">
          {currentPage.headerType === 'none'
            ? 'No header will be shown on this page'
            : currentPage.headerType === 'firstPage'
            ? 'Uses first page header template'
            : currentPage.headerType === 'compact'
            ? 'Uses compact header template'
            : 'Uses default header template'}
        </p>
      </div>

      {/* Footer Type */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <PanelBottom className="h-4 w-4 text-on-surface-variant" />
          <label className="text-sm font-medium text-on-surface">Footer Type</label>
        </div>
        <Select value={currentPage.footerType} onChange={handleFooterTypeChange} options={HEADER_FOOTER_OPTIONS} size="sm" />
        <p className="text-xs text-on-surface-variant/70">
          {currentPage.footerType === 'none'
            ? 'No footer will be shown on this page'
            : currentPage.footerType === 'firstPage'
            ? 'Uses first page footer template'
            : currentPage.footerType === 'compact'
            ? 'Uses compact footer template'
            : 'Uses default footer template'}
        </p>
      </div>
    </div>
  );
}
