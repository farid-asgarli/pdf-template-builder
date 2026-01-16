'use client';

import { IconButton, Tooltip } from '@/app/ui/primitives';
import { X } from 'lucide-react';
import type { Component } from '@/lib/types/document.types';
import { SelectedComponentPanel } from '@/components/pdf-builder/property-panel/components/SelectedComponentPanel';

interface PropertyPanelProps {
  selectedComponent: Component | null;
  onClose?: () => void;
}

export function PropertyPanel({ selectedComponent, onClose }: PropertyPanelProps) {
  // Don't render if no component is selected
  if (!selectedComponent) {
    return null;
  }

  return (
    <aside className="flex w-100 flex-col border-l border-outline-variant/20 bg-surface-container-lowest">
      {/* Panel Header */}
      <div className="flex items-center justify-between bg-surface-container-low px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-on-surface">Properties</h2>
          <p className="text-xs text-on-surface-variant">Edit component</p>
        </div>
        {onClose && (
          <Tooltip content="Close properties">
            <IconButton variant="ghost" size="sm" aria-label="Close properties" onClick={onClose} icon={<X className="h-4 w-4" />} />
          </Tooltip>
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        <SelectedComponentPanel component={selectedComponent} />
      </div>
    </aside>
  );
}
