'use client';

import { useState, useMemo } from 'react';
import { NumberStepper, Select, Checkbox, ColorPicker, Button } from '@/app/ui/primitives';
import { FieldRow } from '@/components/pdf-builder/property-panel/components';
import { ContentEditorDialog } from '@/components/pdf-builder/ContentEditorDialog';
import { Edit3, Variable } from 'lucide-react';
import {
  FONT_OPTIONS,
  FONT_WEIGHT_OPTIONS,
  TEXT_ALIGN_FULL_OPTIONS,
  TEXT_DECORATION_OPTIONS,
  TEXT_DECORATION_STYLE_OPTIONS,
} from '@/components/pdf-builder/property-panel/constants';
import { tokenizeTemplate, tokensToHtml, hasTemplateSyntax } from '@/lib/utils/templateHighlighter';
import { useDocumentStore } from '@/lib/store/documentStore';
import type { TextLabelProperties } from '@/lib/types/document.types';
import type { PropertyEditorProps } from '@/components/pdf-builder/property-panel/types';

export function TextLabelPropertyEditor({ properties, onChange }: PropertyEditorProps<TextLabelProperties>) {
  const showDecorationOptions = properties.decoration && properties.decoration !== 'none';
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const variables = useDocumentStore((state) => state.document?.variableDefinitions) ?? [];

  // Generate highlighted preview
  const previewContent = useMemo(() => {
    const content = properties.content || 'Click to edit...';
    if (hasTemplateSyntax(content)) {
      const tokens = tokenizeTemplate(content, variables);
      return tokensToHtml(tokens, false);
    }
    return null;
  }, [properties.content, variables]);

  const displayContent = properties.content || 'Click to edit...';
  const hasVariables = hasTemplateSyntax(properties.content || '');

  return (
    <div className="space-y-4">
      {/* Content Preview with Edit Button */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm font-medium text-on-surface">Content</label>
          {hasVariables && (
            <span className="flex items-center gap-1 text-xs text-primary">
              <Variable className="h-3 w-3" />
              Variables
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setIsEditorOpen(true)}
          className="w-full text-left p-3 rounded-lg border border-outline-variant/30 bg-surface-container-lowest hover:bg-surface-container-low hover:border-outline-variant/50 transition-colors group cursor-pointer"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {previewContent ? (
                <div className="text-sm text-on-surface truncate" dangerouslySetInnerHTML={{ __html: previewContent }} />
              ) : (
                <span className={`text-sm ${properties.content ? 'text-on-surface' : 'text-on-surface-variant/50'} truncate block`}>
                  {displayContent}
                </span>
              )}
            </div>
            <Edit3 className="h-4 w-4 text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5" />
          </div>
        </button>
        <p className="mt-1.5 text-xs text-on-surface-variant">Click to open editor • Double-click on canvas to edit</p>
      </div>

      {/* Content Editor Dialog */}
      <ContentEditorDialog
        open={isEditorOpen}
        onOpenChange={setIsEditorOpen}
        value={properties.content}
        onSave={(v) => onChange('content', v)}
        mode="single-line"
        title="Edit Text Label"
        placeholder="Enter text or use {{variables}}..."
      />

      {/* Typography Section */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Typography</h4>

        <FieldRow label="Font Size">
          <NumberStepper
            value={properties.fontSize}
            onChange={(v) => onChange('fontSize', v)}
            min={6}
            max={72}
            step={1}
            suffix="px"
            size="sm"
            fullWidth
          />
        </FieldRow>

        <div>
          <Select label="Font Family" options={FONT_OPTIONS} value={properties.fontFamily} onChange={(v) => onChange('fontFamily', v)} size="sm" />
        </div>

        <div>
          <Select
            label="Font Weight"
            options={FONT_WEIGHT_OPTIONS}
            value={properties.fontWeight}
            onChange={(v) => onChange('fontWeight', v)}
            size="sm"
          />
        </div>

        <div>
          <Checkbox label="Italic" checked={properties.italic ?? false} onChange={(e) => onChange('italic', e.target.checked)} />
        </div>

        <div>
          <Select
            label="Text Align"
            options={TEXT_ALIGN_FULL_OPTIONS}
            value={properties.textAlign}
            onChange={(v) => onChange('textAlign', v)}
            size="sm"
          />
        </div>
      </div>

      {/* Spacing Section */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Spacing</h4>

        <FieldRow label="Letter Spacing">
          <NumberStepper
            value={properties.letterSpacing ?? 0}
            onChange={(v) => onChange('letterSpacing', v)}
            min={-0.2}
            max={0.5}
            step={0.01}
            suffix="em"
            size="sm"
            fullWidth
          />
        </FieldRow>

        <FieldRow label="Word Spacing">
          <NumberStepper
            value={properties.wordSpacing ?? 0}
            onChange={(v) => onChange('wordSpacing', v)}
            min={-0.3}
            max={1}
            step={0.05}
            suffix="em"
            size="sm"
            fullWidth
          />
        </FieldRow>

        <FieldRow label="Line Height">
          <NumberStepper
            value={properties.lineHeight ?? 1}
            onChange={(v) => onChange('lineHeight', v)}
            min={0.5}
            max={3}
            step={0.1}
            suffix="×"
            size="sm"
            fullWidth
          />
        </FieldRow>
      </div>

      {/* Colors Section */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Colors</h4>

        <div>
          <label className="mb-2 block text-sm font-medium text-on-surface">Text Color</label>
          <ColorPicker value={properties.color} onChange={(v) => onChange('color', v)} showInput showPresets presetPalette="common" size="sm" />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-on-surface">Background Color</label>
          <ColorPicker
            value={properties.backgroundColor || ''}
            onChange={(v) => onChange('backgroundColor', v || undefined)}
            showInput
            showPresets
            presetPalette="common"
            size="sm"
          />
          <p className="mt-1 text-xs text-on-surface-variant">Leave empty for transparent</p>
        </div>
      </div>

      {/* Text Decoration Section */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Decoration</h4>

        <div>
          <Select
            label="Decoration"
            options={TEXT_DECORATION_OPTIONS}
            value={properties.decoration ?? 'none'}
            onChange={(v) => onChange('decoration', v)}
            size="sm"
          />
        </div>

        {showDecorationOptions && (
          <>
            <div>
              <Select
                label="Decoration Style"
                options={TEXT_DECORATION_STYLE_OPTIONS}
                value={properties.decorationStyle ?? 'solid'}
                onChange={(v) => onChange('decorationStyle', v)}
                size="sm"
              />
            </div>

            <FieldRow label="Decoration Thickness">
              <NumberStepper
                value={properties.decorationThickness ?? 1}
                onChange={(v) => onChange('decorationThickness', v)}
                min={0.5}
                max={5}
                step={0.5}
                suffix="px"
                size="sm"
                fullWidth
              />
            </FieldRow>

            <div>
              <label className="mb-2 block text-sm font-medium text-on-surface">Decoration Color</label>
              <ColorPicker
                value={properties.decorationColor || properties.color || '#000000'}
                onChange={(v) => onChange('decorationColor', v || undefined)}
                showInput
                showPresets
                presetPalette="common"
                size="sm"
              />
              <p className="mt-1 text-xs text-on-surface-variant">Leave empty to use text color</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
