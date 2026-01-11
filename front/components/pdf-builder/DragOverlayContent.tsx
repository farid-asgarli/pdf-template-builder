'use client';

import { COMPONENT_TYPES } from './constants';
import { mmToPx } from '@/lib/utils/coordinates';
import { DEFAULT_COMPONENT_SIZES } from '@/lib/types/document.types';
import type { ComponentType, Component } from '@/lib/types/document.types';

// Import component renderers
import { TextLabel } from './components/TextLabel';
import { TextField } from './components/TextField';
import { SignatureBox } from './components/SignatureBox';
import { DateField } from './components/DateField';
import { Checkbox } from './components/Checkbox';
import { TableComponent } from './components/TableComponent';
import { ImageComponent } from './components/ImageComponent';
import { Paragraph } from './components/Paragraph';
import { Divider } from './components/Divider';

interface DragOverlayContentProps {
  activeDrag: {
    type: 'new-component' | 'existing-component';
    componentType?: ComponentType;
    component?: Component;
  };
}

export function DragOverlayContent({ activeDrag }: DragOverlayContentProps) {
  if (activeDrag.type === 'new-component' && activeDrag.componentType) {
    return <NewComponentOverlay componentType={activeDrag.componentType} />;
  }

  if (activeDrag.type === 'existing-component' && activeDrag.component) {
    return <ExistingComponentOverlay component={activeDrag.component} />;
  }

  return null;
}

function NewComponentOverlay({ componentType }: { componentType: ComponentType }) {
  const config = COMPONENT_TYPES.find((c) => c.type === componentType);
  const Icon = config?.icon;
  const size = DEFAULT_COMPONENT_SIZES[componentType];

  return (
    <div
      className="pointer-events-none"
      style={{
        width: mmToPx(size.width),
        minHeight: mmToPx(size.height),
      }}
    >
      {/* Figma-style drop preview */}
      <div
        className="h-full w-full rounded-sm border-2 border-dashed p-3"
        style={{
          borderColor: '#0d99ff',
          backgroundColor: 'rgba(13, 153, 255, 0.08)',
        }}
      >
        <div className="flex items-center gap-2">
          {Icon && (
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white shadow-sm"
              style={{ backgroundColor: config?.iconBg }}
            >
              <Icon className="h-3.5 w-3.5" />
            </div>
          )}
          <span className="text-xs font-medium text-on-surface">{config?.label || componentType}</span>
        </div>
      </div>
    </div>
  );
}

function ExistingComponentOverlay({ component }: { component: Component }) {
  const width = mmToPx(component.size.width);
  const height = mmToPx(component.size.height);
  const customStyle = component.style || {};

  // Content wrapper styles
  const contentStyle: React.CSSProperties = {
    backgroundColor: customStyle.backgroundColor || 'transparent',
    borderColor: customStyle.borderWidth ? customStyle.borderColor || '#000000' : 'transparent',
    borderWidth: customStyle.borderWidth || 0,
    borderStyle: customStyle.borderWidth ? 'solid' : 'none',
    borderRadius: customStyle.borderRadius || 0,
    padding: customStyle.padding ? mmToPx(customStyle.padding) : 2,
  };

  return (
    <div className="pointer-events-none relative" style={{ width, height }}>
      {/* Figma-style drag overlay with selection indication */}
      <div
        className="absolute inset-0"
        style={{
          boxShadow: '0 0 0 1.5px #0d99ff, 0 4px 12px rgba(0, 0, 0, 0.15)',
          borderRadius: 2,
        }}
      />

      {/* Content */}
      <div
        className="h-full w-full overflow-hidden bg-white"
        style={{
          ...contentStyle,
          opacity: 0.95,
        }}
      >
        <ComponentRenderer component={component} />
      </div>
    </div>
  );
}

// Map component types to their renderer components
const COMPONENT_RENDERERS: Record<ComponentType, React.ComponentType<{ component: Component }>> = {
  'text-label': TextLabel,
  'text-field': TextField,
  'signature-box': SignatureBox,
  'date-field': DateField,
  checkbox: Checkbox,
  table: TableComponent,
  image: ImageComponent,
  paragraph: Paragraph,
  divider: Divider,
};

function ComponentRenderer({ component }: { component: Component }) {
  const Renderer = COMPONENT_RENDERERS[component.type];
  if (!Renderer) return null;
  return <Renderer component={component} />;
}
