'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { PanelLeftClose, PanelLeft } from 'lucide-react';
import { IconButton, Tooltip } from '@/app/ui/primitives';
import { COMPONENT_TYPES, ComponentTypeConfig, COMPONENT_CATEGORIES } from './constants';
import type { ComponentType } from '@/lib/types/document.types';

interface ComponentPaletteProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function ComponentPalette({ isCollapsed = false, onToggleCollapse }: ComponentPaletteProps) {
  if (isCollapsed) {
    return (
      <aside className="flex w-12 flex-col items-center border-r border-outline-variant/25 bg-surface py-3">
        <Tooltip content="Show components" side="right">
          <IconButton variant="ghost" size="sm" aria-label="Show components" onClick={onToggleCollapse} icon={<PanelLeft className="h-4 w-4" />} />
        </Tooltip>
      </aside>
    );
  }

  return (
    <aside className="flex w-56 flex-col border-r border-outline-variant/25 bg-surface">
      <div className="flex items-center justify-between border-b border-outline-variant/20 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-on-surface">Components</h2>
          <p className="text-xs text-on-surface-variant">Drag to canvas</p>
        </div>
        {onToggleCollapse && (
          <Tooltip content="Hide components">
            <IconButton
              variant="ghost"
              size="sm"
              aria-label="Hide components"
              onClick={onToggleCollapse}
              icon={<PanelLeftClose className="h-4 w-4" />}
            />
          </Tooltip>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <div className="flex flex-col gap-4">
          {COMPONENT_CATEGORIES.map((category) => (
            <ComponentCategory key={category.name} category={category} />
          ))}
        </div>
      </div>
    </aside>
  );
}

interface ComponentCategoryProps {
  category: {
    name: string;
    types: ComponentType[];
  };
}

function ComponentCategory({ category }: ComponentCategoryProps) {
  const categoryComponents = COMPONENT_TYPES.filter((c) => category.types.includes(c.type));

  return (
    <div>
      <h3 className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant/70">{category.name}</h3>
      <div className="flex flex-col gap-1">
        {categoryComponents.map((config) => (
          <PaletteItem key={config.type} config={config} />
        ))}
      </div>
    </div>
  );
}

interface PaletteItemProps {
  config: ComponentTypeConfig;
}

function PaletteItem({ config }: PaletteItemProps) {
  const { type, label, icon: Icon, iconBg, hoverBg } = config;

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-${type}`,
    data: {
      type: 'new-component',
      componentType: type as ComponentType,
    },
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="group flex select-none items-center gap-3 rounded-xl px-2 py-2 transition-all duration-200 active:scale-[0.98]"
      onMouseEnter={(e) => {
        if (!isDragging) {
          e.currentTarget.style.backgroundColor = hoverBg;
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white transition-transform duration-200 group-hover:scale-105"
        style={{ backgroundColor: iconBg }}
      >
        <Icon className="h-4 w-4" />
      </div>
      <span className="text-sm font-medium text-on-surface-variant group-hover:text-on-surface">{label}</span>
    </div>
  );
}
