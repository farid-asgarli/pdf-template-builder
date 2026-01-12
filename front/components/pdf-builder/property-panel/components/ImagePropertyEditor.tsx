import { Input, Select, NumberStepper, Checkbox } from '@/app/ui/primitives';
import { FieldRow } from '@/components/pdf-builder/property-panel/components';
import type { ImageProperties } from '@/lib/types/document.types';
import type { PropertyEditorProps } from '@/components/pdf-builder/property-panel/types';

const IMAGE_TYPE_OPTIONS = [
  { value: 'raster', label: 'Raster (JPEG, PNG, etc.)' },
  { value: 'svg', label: 'SVG (Vector)' },
];

const FIT_MODE_OPTIONS = [
  { value: 'fitArea', label: 'Fit Area (Contain)' },
  { value: 'fitWidth', label: 'Fit Width' },
  { value: 'fitHeight', label: 'Fit Height' },
  { value: 'fitUnproportionally', label: 'Stretch (Fill)' },
];

const COMPRESSION_QUALITY_OPTIONS = [
  { value: 'best', label: 'Best (100%)' },
  { value: 'veryHigh', label: 'Very High (90%)' },
  { value: 'high', label: 'High (75%)' },
  { value: 'medium', label: 'Medium (50%)' },
  { value: 'low', label: 'Low (25%)' },
  { value: 'veryLow', label: 'Very Low (10%)' },
];

export function ImagePropertyEditor({ properties, onChange }: PropertyEditorProps<ImageProperties>) {
  const isRasterImage = properties.imageType !== 'svg';
  const showCompressionSettings = isRasterImage && !properties.useOriginalImage;

  return (
    <div className="space-y-4">
      {/* Source Section */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Image Source</h4>

        <div>
          <Input
            label="Image URL"
            value={properties.src}
            onChange={(e) => onChange('src', e.target.value)}
            placeholder="https://... or data:image/..."
            size="sm"
            variant="filled"
          />
          <p className="mt-1 text-xs text-on-surface-variant">URL, base64 data URI, or file path</p>
        </div>

        <div>
          <Input
            label="Alt Text"
            value={properties.alt}
            onChange={(e) => onChange('alt', e.target.value)}
            placeholder="Image description..."
            size="sm"
            variant="filled"
          />
        </div>

        <div>
          <Select label="Image Type" options={IMAGE_TYPE_OPTIONS} value={properties.imageType} onChange={(v) => onChange('imageType', v)} size="sm" />
          <p className="mt-1 text-xs text-on-surface-variant">
            {isRasterImage ? 'Supports JPEG, PNG, BMP, WEBP formats' : 'Scalable vector graphics (SVG)'}
          </p>
        </div>
      </div>

      {/* Scaling Section */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Scaling</h4>

        <div>
          <Select label="Fit Mode" options={FIT_MODE_OPTIONS} value={properties.fitMode} onChange={(v) => onChange('fitMode', v)} size="sm" />
          <p className="mt-1 text-xs text-on-surface-variant">
            {properties.fitMode === 'fitArea' && 'Scale to fill available space while maintaining aspect ratio'}
            {properties.fitMode === 'fitWidth' && 'Scale to fill the full width, may overflow height'}
            {properties.fitMode === 'fitHeight' && 'Scale to fill the full height, may overflow width'}
            {properties.fitMode === 'fitUnproportionally' && 'Stretch to fill all space (may distort image)'}
          </p>
        </div>
      </div>

      {/* Quality Settings - Only for raster images */}
      {isRasterImage && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Quality Settings</h4>

          <div>
            <Checkbox
              label="Use Original Image"
              checked={properties.useOriginalImage ?? false}
              onChange={(e) => onChange('useOriginalImage', e.target.checked)}
            />
            <p className="mt-1 text-xs text-on-surface-variant">
              {properties.useOriginalImage
                ? 'Embeds the original image without any compression or resizing'
                : 'Enable to skip compression and DPI resizing'}
            </p>
          </div>

          {showCompressionSettings && (
            <>
              <div>
                <Select
                  label="Compression Quality"
                  options={COMPRESSION_QUALITY_OPTIONS}
                  value={properties.compressionQuality}
                  onChange={(v) => onChange('compressionQuality', v)}
                  size="sm"
                />
                <p className="mt-1 text-xs text-on-surface-variant">Higher quality = larger file size</p>
              </div>

              <FieldRow label="Raster DPI">
                <NumberStepper
                  value={properties.rasterDpi ?? 288}
                  onChange={(v) => onChange('rasterDpi', v)}
                  min={72}
                  max={600}
                  step={72}
                  size="sm"
                  fullWidth
                />
              </FieldRow>
              <p className="-mt-2 text-xs text-on-surface-variant">Target resolution. Higher DPI = sharper image, larger file. Default: 288</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
