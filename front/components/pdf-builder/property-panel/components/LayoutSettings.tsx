import { Switch } from '@/app/ui/primitives';
import { FieldRow } from './FieldRow';
import { useDocumentStore } from '@/lib/store/documentStore';
import { supportsAutoExpand, DEFAULT_LAYOUT_CONFIG } from '@/lib/types/document.types';
import type { Component, LayoutConfig } from '@/lib/types/document.types';
import { useCallback, useMemo, type ChangeEvent } from 'react';
import { AlertCircle, Info } from 'lucide-react';

interface LayoutSettingsProps {
  component: Component;
}

/**
 * Layout settings panel for configuring auto-expansion behavior.
 * Only shown for component types that support auto-expansion (paragraph, text-label, table).
 */
export function LayoutSettings({ component }: LayoutSettingsProps) {
  const { updateComponent, document } = useDocumentStore();

  // Check if this component type supports auto-expansion
  const isSupported = supportsAutoExpand(component.type);

  // Get current layout config with defaults
  const layout: LayoutConfig = useMemo(() => component.layout ?? DEFAULT_LAYOUT_CONFIG, [component.layout]);

  // Calculate affected components (those that would be pushed down)
  const affectedComponents = useMemo(() => {
    if (!layout.autoExpand || !layout.pushSiblings) return [];

    const currentPage = document?.pages.find((p) => p.components.some((c) => c.id === component.id));
    const allComponents = currentPage?.components ?? [];

    const componentBottom = component.position.y + component.size.height;
    const componentLeft = component.position.x;
    const componentRight = component.position.x + component.size.width;

    return allComponents.filter((other) => {
      if (other.id === component.id) return false;

      // Check if other component is below this one
      if (other.position.y < componentBottom) return false;

      // Check horizontal overlap
      const otherLeft = other.position.x;
      const otherRight = other.position.x + other.size.width;
      return componentLeft < otherRight && componentRight > otherLeft;
    });
  }, [document?.pages, component, layout.autoExpand, layout.pushSiblings]);

  const handleAutoExpandChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      updateComponent(component.id, {
        layout: {
          ...layout,
          autoExpand: e.target.checked,
        },
      });
    },
    [component.id, layout, updateComponent]
  );

  const handlePushSiblingsChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      updateComponent(component.id, {
        layout: {
          ...layout,
          pushSiblings: e.target.checked,
        },
      });
    },
    [component.id, layout, updateComponent]
  );

  if (!isSupported) {
    return (
      <div className="flex items-start gap-2 rounded-lg bg-surface-container p-3 text-sm text-on-surface-variant">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-on-surface-variant/60" />
        <p>
          Auto-expansion is not available for <span className="font-medium">{component.type}</span> components. It is supported for text labels,
          paragraphs, and tables.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Auto-expand toggle */}
      <FieldRow label="Auto-expand">
        <Switch checked={layout.autoExpand} onChange={handleAutoExpandChange} />
      </FieldRow>

      {/* Info about auto-expand */}
      {layout.autoExpand && (
        <div className="flex items-start gap-2 rounded-lg bg-primary/5 p-3 text-sm text-on-surface-variant">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p>This component will expand vertically to fit its content. The current height ({component.size.height}mm) becomes the minimum height.</p>
        </div>
      )}

      {/* Push siblings toggle - only shown when auto-expand is enabled */}
      {layout.autoExpand && (
        <>
          <FieldRow label="Push components below">
            <Switch checked={layout.pushSiblings} onChange={handlePushSiblingsChange} />
          </FieldRow>

          {/* Show affected components */}
          {layout.pushSiblings && affectedComponents.length > 0 && (
            <div className="rounded-lg border border-outline-variant/30 p-3">
              <p className="mb-2 text-xs font-medium text-on-surface-variant">Components that will be pushed down ({affectedComponents.length}):</p>
              <div className="flex flex-wrap gap-1">
                {affectedComponents.map((comp) => (
                  <span key={comp.id} className="inline-flex items-center rounded bg-surface-container px-2 py-0.5 text-xs text-on-surface-variant">
                    {comp.type}
                  </span>
                ))}
              </div>
            </div>
          )}

          {layout.pushSiblings && affectedComponents.length === 0 && (
            <div className="flex items-start gap-2 rounded-lg bg-surface-container p-3 text-sm text-on-surface-variant">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-on-surface-variant/60" />
              <p>No components are positioned below this one with horizontal overlap. When this component expands, nothing will be pushed down.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
