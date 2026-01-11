import { NumberStepper, Select, Checkbox, Input, ColorPicker } from '@/app/ui/primitives';
import { TableColumnDefinition, TableProperties, TableBorderStyle, VerticalAlign, FontWeight } from '@/lib/types/document.types';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

// Table Properties
export function TablePropertyEditor({
  properties,
  onChange,
  onBatchChange,
}: {
  properties: TableProperties;
  onChange: (name: string, value: unknown) => void;
  onBatchChange: (updates: Record<string, unknown>) => void;
}) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    structure: true,
    headers: false,
    cells: false,
    borders: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Get column count
  const columnCount = properties.columnDefinitions?.length || properties.headers?.length || 3;

  // Handle column count change
  const handleColumnCountChange = (newCount: number) => {
    const currentDefs = properties.columnDefinitions || [];
    const currentHeaders = properties.headers || [];
    const currentData = properties.data || [];

    // Adjust column definitions
    let newDefs: TableColumnDefinition[];
    if (newCount > currentDefs.length) {
      newDefs = [...currentDefs];
      for (let i = currentDefs.length; i < newCount; i++) {
        newDefs.push({ type: 'relative', width: 1, align: 'left' });
      }
    } else {
      newDefs = currentDefs.slice(0, newCount);
    }

    // Adjust headers
    let newHeaders: string[];
    if (newCount > currentHeaders.length) {
      newHeaders = [...currentHeaders];
      for (let i = currentHeaders.length; i < newCount; i++) {
        newHeaders.push(`Column ${i + 1}`);
      }
    } else {
      newHeaders = currentHeaders.slice(0, newCount);
    }

    // Adjust data rows
    const newData = currentData.map((row) => {
      if (newCount > row.length) {
        const newRow = [...row];
        for (let i = row.length; i < newCount; i++) {
          newRow.push('');
        }
        return newRow;
      } else {
        return row.slice(0, newCount);
      }
    });

    onBatchChange({
      columnDefinitions: newDefs,
      headers: newHeaders,
      data: newData,
    });
  };

  // Handle row count change
  const handleRowCountChange = (newRowCount: number) => {
    const currentData = properties.data || [];

    let newData: string[][];
    if (newRowCount > currentData.length) {
      newData = [...currentData];
      for (let i = currentData.length; i < newRowCount; i++) {
        newData.push(Array(columnCount).fill(''));
      }
    } else {
      newData = currentData.slice(0, newRowCount);
    }

    onChange('data', newData);
  };

  // Handle column definition change
  const handleColumnDefChange = (index: number, field: keyof TableColumnDefinition, value: string | number) => {
    const newDefs = [...(properties.columnDefinitions || [])];
    if (newDefs[index]) {
      newDefs[index] = { ...newDefs[index], [field]: value };
      onChange('columnDefinitions', newDefs);
    }
  };

  const columnTypeOptions = [
    { value: 'relative', label: 'Relative' },
    { value: 'constant', label: 'Fixed (pts)' },
  ];

  const alignOptions = [
    { value: 'left', label: 'Left' },
    { value: 'center', label: 'Center' },
    { value: 'right', label: 'Right' },
  ];

  const verticalAlignOptions: { value: VerticalAlign; label: string }[] = [
    { value: 'top', label: 'Top' },
    { value: 'middle', label: 'Middle' },
    { value: 'bottom', label: 'Bottom' },
  ];

  const fontWeightOptions: { value: FontWeight; label: string }[] = [
    { value: 'thin', label: 'Thin' },
    { value: 'light', label: 'Light' },
    { value: 'normal', label: 'Normal' },
    { value: 'medium', label: 'Medium' },
    { value: 'semibold', label: 'Semi Bold' },
    { value: 'bold', label: 'Bold' },
    { value: 'extrabold', label: 'Extra Bold' },
    { value: 'black', label: 'Black' },
  ];

  const borderStyleOptions: { value: TableBorderStyle; label: string }[] = [
    { value: 'all', label: 'All Borders' },
    { value: 'header', label: 'Header Bottom Only' },
    { value: 'horizontal', label: 'Horizontal Lines' },
    { value: 'vertical', label: 'Vertical Lines' },
    { value: 'none', label: 'No Borders' },
  ];

  return (
    <div className="space-y-4">
      {/* Structure Section */}
      <div className="rounded-lg border border-outline-variant/30 bg-surface-container-low">
        <button className="flex w-full items-center justify-between px-3 py-2 text-left" onClick={() => toggleSection('structure')} type="button">
          <span className="text-sm font-medium text-on-surface">Structure</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${expandedSections.structure ? 'rotate-180' : ''}`} />
        </button>
        {expandedSections.structure && (
          <div className="space-y-3 border-t border-outline-variant/30 p-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-on-surface-variant">Columns</label>
                <NumberStepper value={columnCount} onChange={handleColumnCountChange} min={1} max={10} step={1} size="sm" fullWidth />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-on-surface-variant">Data Rows</label>
                <NumberStepper value={properties.data?.length || 0} onChange={handleRowCountChange} min={0} max={50} step={1} size="sm" fullWidth />
              </div>
            </div>

            {/* Column Definitions */}
            <div>
              <label className="mb-2 block text-xs font-medium text-on-surface-variant">Column Settings</label>
              <div className="space-y-2">
                {properties.columnDefinitions?.map((colDef, index) => (
                  <div key={index} className="grid grid-cols-3 gap-2 rounded bg-surface-container p-2">
                    <div>
                      <label className="mb-1 block text-[10px] text-on-surface-variant">Type</label>
                      <Select options={columnTypeOptions} value={colDef.type} onChange={(v) => handleColumnDefChange(index, 'type', v)} size="sm" />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] text-on-surface-variant">{colDef.type === 'constant' ? 'Width (pt)' : 'Ratio'}</label>
                      <NumberStepper
                        value={colDef.width}
                        onChange={(v) => handleColumnDefChange(index, 'width', v)}
                        min={colDef.type === 'constant' ? 10 : 1}
                        max={colDef.type === 'constant' ? 500 : 10}
                        step={colDef.type === 'constant' ? 10 : 1}
                        size="sm"
                        fullWidth
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] text-on-surface-variant">Align</label>
                      <Select
                        options={alignOptions}
                        value={colDef.align || 'left'}
                        onChange={(v) => handleColumnDefChange(index, 'align', v)}
                        size="sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Headers Section */}
      <div className="rounded-lg border border-outline-variant/30 bg-surface-container-low">
        <button className="flex w-full items-center justify-between px-3 py-2 text-left" onClick={() => toggleSection('headers')} type="button">
          <span className="text-sm font-medium text-on-surface">Header Row</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${expandedSections.headers ? 'rotate-180' : ''}`} />
        </button>
        {expandedSections.headers && (
          <div className="space-y-3 border-t border-outline-variant/30 p-3">
            <Checkbox checked={properties.showHeader !== false} onChange={(e) => onChange('showHeader', e.target.checked)} label="Show Header Row" />

            {properties.showHeader !== false && (
              <>
                {/* Header text inputs */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-on-surface-variant">Header Labels</label>
                  <div className="space-y-1.5">
                    {properties.headers?.map((header, index) => (
                      <Input
                        key={index}
                        value={header}
                        onChange={(e) => {
                          const newHeaders = [...properties.headers];
                          newHeaders[index] = e.target.value;
                          onChange('headers', newHeaders);
                        }}
                        placeholder={`Column ${index + 1}`}
                        size="sm"
                        variant="filled"
                      />
                    ))}
                  </div>
                </div>

                {/* Typography */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-on-surface-variant">Font Size</label>
                    <NumberStepper
                      value={properties.headerFontSize || 10}
                      onChange={(v) => onChange('headerFontSize', v)}
                      min={6}
                      max={24}
                      step={1}
                      size="sm"
                      fullWidth
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-on-surface-variant">Font Weight</label>
                    <Select
                      options={fontWeightOptions}
                      value={properties.headerFontWeight || 'bold'}
                      onChange={(v) => onChange('headerFontWeight', v)}
                      size="sm"
                    />
                  </div>
                </div>

                {/* Padding */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-on-surface-variant">Padding V (pt)</label>
                    <NumberStepper
                      value={properties.headerPaddingVertical ?? 8}
                      onChange={(v) => onChange('headerPaddingVertical', v)}
                      min={0}
                      max={30}
                      step={1}
                      size="sm"
                      fullWidth
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-on-surface-variant">Padding H (pt)</label>
                    <NumberStepper
                      value={properties.headerPaddingHorizontal ?? 10}
                      onChange={(v) => onChange('headerPaddingHorizontal', v)}
                      min={0}
                      max={30}
                      step={1}
                      size="sm"
                      fullWidth
                    />
                  </div>
                </div>

                {/* Alignment */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-on-surface-variant">Vertical Align</label>
                  <Select
                    options={verticalAlignOptions}
                    value={properties.headerVerticalAlign || 'middle'}
                    onChange={(v) => onChange('headerVerticalAlign', v)}
                    size="sm"
                  />
                </div>

                {/* Colors */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-on-surface-variant">Background</label>
                    <ColorPicker
                      value={properties.headerBackground || '#f0f0f0'}
                      onChange={(v) => onChange('headerBackground', v)}
                      showInput
                      size="sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-on-surface-variant">Text Color</label>
                    <ColorPicker
                      value={properties.headerTextColor || '#000000'}
                      onChange={(v) => onChange('headerTextColor', v)}
                      showInput
                      size="sm"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Cell Styling Section */}
      <div className="rounded-lg border border-outline-variant/30 bg-surface-container-low">
        <button className="flex w-full items-center justify-between px-3 py-2 text-left" onClick={() => toggleSection('cells')} type="button">
          <span className="text-sm font-medium text-on-surface">Cell Styling</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${expandedSections.cells ? 'rotate-180' : ''}`} />
        </button>
        {expandedSections.cells && (
          <div className="space-y-3 border-t border-outline-variant/30 p-3">
            {/* Typography */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-on-surface-variant">Font Size</label>
                <NumberStepper
                  value={properties.cellFontSize || 10}
                  onChange={(v) => onChange('cellFontSize', v)}
                  min={6}
                  max={24}
                  step={1}
                  size="sm"
                  fullWidth
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-on-surface-variant">Font Weight</label>
                <Select
                  options={fontWeightOptions}
                  value={properties.cellFontWeight || 'normal'}
                  onChange={(v) => onChange('cellFontWeight', v)}
                  size="sm"
                />
              </div>
            </div>

            {/* Padding */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-on-surface-variant">Padding V (pt)</label>
                <NumberStepper
                  value={properties.cellPaddingVertical ?? 5}
                  onChange={(v) => onChange('cellPaddingVertical', v)}
                  min={0}
                  max={30}
                  step={1}
                  size="sm"
                  fullWidth
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-on-surface-variant">Padding H (pt)</label>
                <NumberStepper
                  value={properties.cellPaddingHorizontal ?? 10}
                  onChange={(v) => onChange('cellPaddingHorizontal', v)}
                  min={0}
                  max={30}
                  step={1}
                  size="sm"
                  fullWidth
                />
              </div>
            </div>

            {/* Alignment */}
            <div>
              <label className="mb-1 block text-xs font-medium text-on-surface-variant">Vertical Align</label>
              <Select
                options={verticalAlignOptions}
                value={properties.cellVerticalAlign || 'middle'}
                onChange={(v) => onChange('cellVerticalAlign', v)}
                size="sm"
              />
            </div>

            {/* Text Color */}
            <div>
              <label className="mb-1 block text-xs font-medium text-on-surface-variant">Text Color</label>
              <ColorPicker value={properties.cellTextColor || '#000000'} onChange={(v) => onChange('cellTextColor', v)} showInput size="sm" />
            </div>

            {/* Alternating Row Colors */}
            <Checkbox
              checked={properties.alternateRowColors || false}
              onChange={(e) => onChange('alternateRowColors', e.target.checked)}
              label="Alternate Row Colors"
            />

            {properties.alternateRowColors && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-on-surface-variant">Even Rows</label>
                  <ColorPicker
                    value={properties.evenRowBackground || '#ffffff'}
                    onChange={(v) => onChange('evenRowBackground', v)}
                    showInput
                    size="sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-on-surface-variant">Odd Rows</label>
                  <ColorPicker
                    value={properties.oddRowBackground || '#f9f9f9'}
                    onChange={(v) => onChange('oddRowBackground', v)}
                    showInput
                    size="sm"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Borders Section */}
      <div className="rounded-lg border border-outline-variant/30 bg-surface-container-low">
        <button className="flex w-full items-center justify-between px-3 py-2 text-left" onClick={() => toggleSection('borders')} type="button">
          <span className="text-sm font-medium text-on-surface">Borders</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${expandedSections.borders ? 'rotate-180' : ''}`} />
        </button>
        {expandedSections.borders && (
          <div className="space-y-3 border-t border-outline-variant/30 p-3">
            {/* Border Style */}
            <div>
              <label className="mb-1 block text-xs font-medium text-on-surface-variant">Border Style</label>
              <Select options={borderStyleOptions} value={properties.borderStyle || 'all'} onChange={(v) => onChange('borderStyle', v)} size="sm" />
            </div>

            {properties.borderStyle !== 'none' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-on-surface-variant">Border Width (pt)</label>
                    <NumberStepper
                      value={properties.borderWidth ?? 1}
                      onChange={(v) => onChange('borderWidth', v)}
                      min={0.5}
                      max={5}
                      step={0.5}
                      size="sm"
                      fullWidth
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-on-surface-variant">Border Color</label>
                    <ColorPicker value={properties.borderColor || '#000000'} onChange={(v) => onChange('borderColor', v)} showInput size="sm" />
                  </div>
                </div>

                {/* Header border bottom options (when style is 'header') */}
                {properties.borderStyle === 'header' && (
                  <div className="rounded bg-surface-container p-2">
                    <label className="mb-2 block text-xs font-medium text-on-surface-variant">Header Border Bottom</label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="mb-1 block text-[10px] text-on-surface-variant">Width (pt)</label>
                        <NumberStepper
                          value={properties.headerBorderBottomWidth ?? 2}
                          onChange={(v) => onChange('headerBorderBottomWidth', v)}
                          min={1}
                          max={10}
                          step={0.5}
                          size="sm"
                          fullWidth
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] text-on-surface-variant">Color</label>
                        <ColorPicker
                          value={properties.headerBorderBottomColor || '#000000'}
                          onChange={(v) => onChange('headerBorderBottomColor', v)}
                          showInput
                          size="sm"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
