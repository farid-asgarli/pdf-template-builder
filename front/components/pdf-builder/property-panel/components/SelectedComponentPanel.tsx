import { NumberStepper } from '@/app/ui/primitives';
import { COMPONENT_TYPES } from '@/components/pdf-builder/constants';
import { FieldRow, QuickActions, Section, StyleEditor, TypeSpecificProperties, ConditionalSettings } from '@/components/pdf-builder/property-panel/components';
import { useDocumentStore } from '@/lib/store/documentStore';
import type { Component, ComponentStyle } from '@/lib/types/document.types';
import { A4_WIDTH_MM, A4_HEIGHT_MM } from '@/lib/utils/coordinates';
import { FileText, Move, Maximize2, Settings2, Paintbrush, Eye } from 'lucide-react';
import { useCallback } from 'react';

export function SelectedComponentPanel({ component }: { component: Component }) {
  const { updateComponent } = useDocumentStore();

  // Get the component config for the icon and label
  const componentConfig = COMPONENT_TYPES.find((c) => c.type === component.type);
  const Icon = componentConfig?.icon || FileText;

  // Update handlers
  const handlePositionChange = useCallback(
    (axis: 'x' | 'y', value: number) => {
      updateComponent(component.id, {
        position: { ...component.position, [axis]: value },
      });
    },
    [component.id, component.position, updateComponent]
  );

  const handleSizeChange = useCallback(
    (dimension: 'width' | 'height', value: number) => {
      updateComponent(component.id, {
        size: { ...component.size, [dimension]: value },
      });
    },
    [component.id, component.size, updateComponent]
  );

  const handlePropertyChange = useCallback(
    (propertyName: string, value: unknown) => {
      updateComponent(component.id, {
        properties: { ...component.properties, [propertyName]: value },
      });
    },
    [component.id, component.properties, updateComponent]
  );

  // Batch update for multiple properties at once (used by Table)
  const handleBatchPropertyChange = useCallback(
    (updates: Record<string, unknown>) => {
      updateComponent(component.id, {
        properties: { ...component.properties, ...updates },
      });
    },
    [component.id, component.properties, updateComponent]
  );

  const handleStyleChange = useCallback(
    (styleProp: keyof ComponentStyle, value: unknown) => {
      updateComponent(component.id, {
        style: { ...component.style, [styleProp]: value },
      });
    },
    [component.id, component.style, updateComponent]
  );

  return (
    <div className='py-4'>
      {/* Component Type Header Card */}
      <div className='mx-4 mb-4 rounded-2xl bg-surface-container p-4'>
        <div className='flex items-center gap-3'>
          <div
            className='flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white'
            style={{ backgroundColor: componentConfig?.iconBg || '#6366f1' }}
          >
            <Icon className='h-6 w-6' />
          </div>
          <div className='min-w-0 flex-1'>
            <p className='text-base font-semibold text-on-surface'>{componentConfig?.label || component.type}</p>
            <p className='truncate text-sm text-on-surface-variant'>{componentConfig?.description}</p>
          </div>
        </div>
        {/* Quick Actions */}
        <QuickActions componentId={component.id} />
      </div>

      {/* Position Section */}
      <Section title='Position' icon={<Move className='h-4 w-4' />}>
        <div className='space-y-3'>
          <FieldRow label='X'>
            <NumberStepper
              value={component.position.x}
              onChange={(v) => handlePositionChange('x', v)}
              min={0}
              max={A4_WIDTH_MM - component.size.width}
              step={1}
              suffix='mm'
              size='sm'
              fullWidth
            />
          </FieldRow>
          <FieldRow label='Y'>
            <NumberStepper
              value={component.position.y}
              onChange={(v) => handlePositionChange('y', v)}
              min={0}
              max={A4_HEIGHT_MM - component.size.height}
              step={1}
              suffix='mm'
              size='sm'
              fullWidth
            />
          </FieldRow>
        </div>
      </Section>

      {/* Size Section */}
      <Section title='Size' icon={<Maximize2 className='h-4 w-4' />}>
        <div className='space-y-3'>
          <FieldRow label='Width'>
            <NumberStepper
              value={component.size.width}
              onChange={(v) => handleSizeChange('width', v)}
              min={5}
              max={A4_WIDTH_MM - component.position.x}
              step={1}
              suffix='mm'
              size='sm'
              fullWidth
            />
          </FieldRow>
          <FieldRow label='Height'>
            <NumberStepper
              value={component.size.height}
              onChange={(v) => handleSizeChange('height', v)}
              min={3}
              max={A4_HEIGHT_MM - component.position.y}
              step={1}
              suffix='mm'
              size='sm'
              fullWidth
            />
          </FieldRow>
        </div>
      </Section>

      {/* Type-Specific Properties */}
      <Section title='Properties' icon={<Settings2 className='h-4 w-4' />}>
        <TypeSpecificProperties component={component} onChange={handlePropertyChange} onBatchChange={handleBatchPropertyChange} />
      </Section>

      {/* Style Section */}
      <Section title='Style' icon={<Paintbrush className='h-4 w-4' />} defaultOpen={false}>
        <StyleEditor style={component.style} onChange={handleStyleChange} />
      </Section>

      {/* Conditional Rendering Section */}
      <Section title='Visibility' icon={<Eye className='h-4 w-4' />} defaultOpen={false}>
        <ConditionalSettings component={component} />
      </Section>
    </div>
  );
}
