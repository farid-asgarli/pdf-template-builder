'use client';

import { Button } from '@/app/ui/primitives';
import { Menu, MenuItem, MenuSeparator, SubMenu } from '@/app/ui/primitives';
import { ChevronDown, Grid3X3, PanelTop, PanelBottom, History, Eye, EyeOff, PanelRightOpen, Maximize2, ExternalLink, Check } from 'lucide-react';
import type { PreviewMode } from '@/lib/hooks';

interface ViewMenuProps {
  showGrid: boolean;
  isPreviewVisible: boolean;
  isHistoryVisible: boolean;
  previewMode: PreviewMode;
  onToggleGrid: () => void;
  onTogglePreview: () => void;
  onToggleHistory: () => void;
  onPreviewModeChange: (mode: PreviewMode) => void;
  onEditHeader: () => void;
  onEditFooter: () => void;
}

export function ViewMenu({
  showGrid,
  isPreviewVisible,
  isHistoryVisible,
  previewMode,
  onToggleGrid,
  onTogglePreview,
  onToggleHistory,
  onPreviewModeChange,
  onEditHeader,
  onEditFooter,
}: ViewMenuProps) {
  return (
    <Menu
      align='start'
      trigger={
        <Button variant='text' size='sm' className='gap-1'>
          View
          <ChevronDown className='h-3.5 w-3.5' />
        </Button>
      }
    >
      {/* Grid */}
      <MenuItem icon={<Grid3X3 className='h-4 w-4' />} onClick={onToggleGrid}>
        <span className='flex items-center justify-between w-full'>
          Show Grid
          {showGrid && <Check className='h-4 w-4 text-primary' />}
        </span>
      </MenuItem>

      <MenuSeparator />

      {/* Header & Footer */}
      <MenuItem icon={<PanelTop className='h-4 w-4' />} onClick={onEditHeader}>
        Edit Header
      </MenuItem>
      <MenuItem icon={<PanelBottom className='h-4 w-4' />} onClick={onEditFooter}>
        Edit Footer
      </MenuItem>

      <MenuSeparator />

      {/* Preview */}
      <MenuItem icon={isPreviewVisible ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />} onClick={onTogglePreview}>
        <span className='flex items-center justify-between w-full'>
          {isPreviewVisible ? 'Hide Preview' : 'Show Preview'}
          {isPreviewVisible && <Check className='h-4 w-4 text-primary' />}
        </span>
      </MenuItem>

      {/* Preview Mode - Proper SubMenu */}
      <SubMenu trigger='Preview Mode' icon={<PanelRightOpen className='h-4 w-4' />}>
        <MenuItem icon={<PanelRightOpen className='h-4 w-4' />} onClick={() => onPreviewModeChange('side-by-side')}>
          <span className='flex items-center justify-between w-full'>
            Side Panel
            {previewMode === 'side-by-side' && <Check className='h-4 w-4 text-primary' />}
          </span>
        </MenuItem>
        <MenuItem icon={<Maximize2 className='h-4 w-4' />} onClick={() => onPreviewModeChange('dialog')}>
          <span className='flex items-center justify-between w-full'>
            Dialog
            {previewMode === 'dialog' && <Check className='h-4 w-4 text-primary' />}
          </span>
        </MenuItem>
        <MenuItem icon={<ExternalLink className='h-4 w-4' />} onClick={() => onPreviewModeChange('new-tab')}>
          <span className='flex items-center justify-between w-full'>
            New Tab
            {previewMode === 'new-tab' && <Check className='h-4 w-4 text-primary' />}
          </span>
        </MenuItem>
      </SubMenu>

      <MenuSeparator />

      {/* History */}
      <MenuItem icon={<History className='h-4 w-4' />} onClick={onToggleHistory}>
        <span className='flex items-center justify-between w-full'>
          Variable History
          {isHistoryVisible && <Check className='h-4 w-4 text-primary' />}
        </span>
      </MenuItem>
    </Menu>
  );
}
