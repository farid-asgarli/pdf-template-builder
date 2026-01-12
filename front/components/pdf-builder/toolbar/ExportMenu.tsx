'use client';

import { Button } from '@/app/ui/primitives';
import { Menu, MenuItem, MenuSeparator, SubMenu, MenuLabel } from '@/app/ui/primitives';
import { ChevronDown, Download, FileCode, FileStack, Variable, Loader2, FileType } from 'lucide-react';

interface ExportMenuProps {
  isGeneratingPdf: boolean;
  onGeneratePdf: () => void;
  onGenerateWithVariables: () => void;
  onGenerateHtml: () => void;
  onSaveAsTemplate: () => void;
}

export function ExportMenu({ isGeneratingPdf, onGeneratePdf, onGenerateWithVariables, onGenerateHtml, onSaveAsTemplate }: ExportMenuProps) {
  return (
    <Menu
      align='end'
      trigger={
        <Button variant='outline' size='sm' className='gap-1'>
          <Download className='h-4 w-4' />
          Export
          <ChevronDown className='h-3.5 w-3.5' />
        </Button>
      }
    >
      {/* PDF Export SubMenu */}
      <SubMenu trigger='Export as PDF' icon={<FileType className='h-4 w-4' />}>
        <MenuItem
          icon={isGeneratingPdf ? <Loader2 className='h-4 w-4 animate-spin' /> : <Download className='h-4 w-4' />}
          onClick={onGeneratePdf}
          disabled={isGeneratingPdf}
        >
          {isGeneratingPdf ? 'Generating...' : 'Quick Export'}
        </MenuItem>
        <MenuItem icon={<Variable className='h-4 w-4' />} onClick={onGenerateWithVariables} disabled={isGeneratingPdf}>
          With Variables...
        </MenuItem>
      </SubMenu>

      {/* HTML Export */}
      <MenuItem icon={<FileCode className='h-4 w-4' />} onClick={onGenerateHtml}>
        Export as HTML
      </MenuItem>

      <MenuSeparator />

      {/* Template */}
      <MenuItem icon={<FileStack className='h-4 w-4' />} onClick={onSaveAsTemplate}>
        Save as Template
      </MenuItem>
    </Menu>
  );
}
