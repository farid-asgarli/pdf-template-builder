import { Select, NumberStepper, ColorPicker, Input, Switch } from '@/app/ui/primitives';
import { FieldRow } from '@/components/pdf-builder/property-panel/components';
import type { DividerProperties } from '@/lib/types/document.types';
import type { PropertyEditorProps } from '@/components/pdf-builder/property-panel/types';
import { useState, useCallback } from 'react';

// Predefined dash patterns for common line styles
const DASH_PATTERN_PRESETS = [
  { value: 'solid', label: 'Solid', pattern: undefined },
  { value: 'dashed', label: 'Dashed', pattern: [6, 4] },
  { value: 'dotted', label: 'Dotted', pattern: [2, 2] },
  { value: 'dash-dot', label: 'Dash-Dot', pattern: [8, 4, 2, 4] },
  { value: 'long-dash', label: 'Long Dash', pattern: [12, 6] },
  { value: 'custom', label: 'Custom', pattern: null }, // null means user defines
] as const;

type PresetValue = (typeof DASH_PATTERN_PRESETS)[number]['value'];

function getPresetFromPattern(pattern?: number[]): PresetValue {
  if (!pattern || pattern.length === 0) return 'solid';

  // Check against known presets
  for (const preset of DASH_PATTERN_PRESETS) {
    if (preset.value === 'custom' || preset.pattern === undefined) continue;
    if (preset.pattern && preset.pattern.length === pattern.length && preset.pattern.every((v, i) => v === pattern[i])) {
      return preset.value;
    }
  }
  return 'custom';
}

function patternToString(pattern?: number[]): string {
  if (!pattern || pattern.length === 0) return '';
  return pattern.join(', ');
}

function stringToPattern(str: string): number[] | undefined {
  if (!str.trim()) return undefined;
  const parts = str
    .split(',')
    .map((s) => parseFloat(s.trim()))
    .filter((n) => !isNaN(n) && n > 0);
  // QuestPDF requires even-length patterns
  if (parts.length < 2 || parts.length % 2 !== 0) return undefined;
  return parts;
}

export function DividerPropertyEditor({ properties, onChange }: PropertyEditorProps<DividerProperties>) {
  const orientationOptions = [
    { value: 'horizontal', label: 'Horizontal' },
    { value: 'vertical', label: 'Vertical' },
  ];

  const currentPreset = getPresetFromPattern(properties.dashPattern);
  const [showCustomPattern, setShowCustomPattern] = useState(currentPreset === 'custom');
  const [customPatternInput, setCustomPatternInput] = useState(currentPreset === 'custom' ? patternToString(properties.dashPattern) : '');
  const [useGradient, setUseGradient] = useState(properties.gradientColors !== undefined && properties.gradientColors.length >= 2);

  const handlePresetChange = useCallback(
    (presetValue: string) => {
      const preset = DASH_PATTERN_PRESETS.find((p) => p.value === presetValue);
      if (!preset) return;

      if (presetValue === 'custom') {
        setShowCustomPattern(true);
        // Don't change the pattern yet, wait for user input
      } else {
        setShowCustomPattern(false);
        setCustomPatternInput('');
        onChange('dashPattern', preset.pattern);
      }
    },
    [onChange]
  );

  const handleCustomPatternChange = useCallback(
    (value: string) => {
      setCustomPatternInput(value);
      const pattern = stringToPattern(value);
      if (pattern) {
        onChange('dashPattern', pattern);
      }
    },
    [onChange]
  );

  const handleGradientToggle = useCallback(
    (enabled: boolean) => {
      setUseGradient(enabled);
      if (!enabled) {
        onChange('gradientColors', undefined);
      } else {
        // Initialize with two colors if enabling
        onChange('gradientColors', [properties.color, '#666666']);
      }
    },
    [onChange, properties.color]
  );

  const handleGradientColorChange = useCallback(
    (index: number, color: string) => {
      const colors = [...(properties.gradientColors || [properties.color, '#666666'])];
      colors[index] = color;
      onChange('gradientColors', colors);
    },
    [onChange, properties.gradientColors, properties.color]
  );

  const addGradientColor = useCallback(() => {
    const colors = [...(properties.gradientColors || [properties.color, '#666666'])];
    colors.push('#999999');
    onChange('gradientColors', colors);
  }, [onChange, properties.gradientColors, properties.color]);

  const removeGradientColor = useCallback(
    (index: number) => {
      const colors = [...(properties.gradientColors || [])];
      if (colors.length > 2) {
        colors.splice(index, 1);
        onChange('gradientColors', colors);
      }
    },
    [onChange, properties.gradientColors]
  );

  return (
    <div className="space-y-4">
      {/* Orientation */}
      <div>
        <Select
          label="Orientation"
          options={orientationOptions}
          value={properties.orientation}
          onChange={(v) => onChange('orientation', v)}
          size="sm"
        />
      </div>

      {/* Thickness */}
      <FieldRow label="Thickness">
        <NumberStepper
          value={properties.thickness}
          onChange={(v) => onChange('thickness', v)}
          min={0.5}
          max={20}
          step={0.5}
          suffix="pt"
          size="sm"
          fullWidth
        />
      </FieldRow>

      {/* Line Style (Dash Pattern) */}
      <div>
        <Select
          label="Line Style"
          options={DASH_PATTERN_PRESETS.map((p) => ({ value: p.value, label: p.label }))}
          value={currentPreset}
          onChange={handlePresetChange}
          size="sm"
        />
      </div>

      {/* Custom Pattern Input */}
      {showCustomPattern && (
        <div>
          <Input
            label="Dash Pattern"
            value={customPatternInput}
            onChange={(e) => handleCustomPatternChange(e.target.value)}
            placeholder="e.g., 4, 4, 8, 4"
            size="sm"
            variant="filled"
            helperText="Comma-separated: dash, gap, dash, gap... (must be even count)"
          />
        </div>
      )}

      {/* Gradient Toggle */}
      <div className="border-t border-outline-variant/30 pt-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-on-surface">Use Gradient</label>
          <Switch checked={useGradient} onChange={(e) => handleGradientToggle(e.target.checked)} />
        </div>
      </div>

      {/* Color or Gradient */}
      {useGradient ? (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-on-surface">Gradient Colors</label>
          {(properties.gradientColors || [properties.color, '#666666']).map((color, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="flex-1">
                <ColorPicker
                  value={color}
                  onChange={(v) => handleGradientColorChange(index, v)}
                  showInput
                  showPresets
                  presetPalette="common"
                  size="sm"
                />
              </div>
              {(properties.gradientColors?.length || 2) > 2 && (
                <button
                  type="button"
                  onClick={() => removeGradientColor(index)}
                  className="rounded p-1 text-on-surface-variant hover:bg-surface-container-highest hover:text-error"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addGradientColor}
            className="w-full rounded-lg border border-dashed border-outline-variant py-2 text-sm text-on-surface-variant hover:border-primary hover:text-primary"
          >
            + Add Color
          </button>
        </div>
      ) : (
        <div>
          <label className="mb-2 block text-sm font-medium text-on-surface">Color</label>
          <ColorPicker value={properties.color} onChange={(v) => onChange('color', v)} showInput showPresets presetPalette="common" size="sm" />
        </div>
      )}
    </div>
  );
}
