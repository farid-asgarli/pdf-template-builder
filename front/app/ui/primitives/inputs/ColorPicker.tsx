import { useState, useRef, useEffect, type HTMLAttributes, type Ref } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/app/ui';
import { Input } from './Input';
import { Pipette, Check } from 'lucide-react';

/**
 * M3 Expressive ColorPicker
 * A styled color picker with preset swatches and hex input
 * Follows M3 design: rounded-2xl, border-2, no shadows
 */

const colorPickerVariants = cva('flex items-center gap-2', {
  variants: {
    size: {
      sm: '',
      default: '',
      lg: '',
    },
    layout: {
      inline: 'flex-row',
      stacked: 'flex-col items-stretch',
    },
  },
  defaultVariants: {
    size: 'default',
    layout: 'inline',
  },
});

const swatchVariants = cva(
  [
    'relative rounded-xl border-2 cursor-pointer transition-all duration-200',
    'hover:rounded-2xl',
    'focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 focus:ring-offset-surface',
  ].join(' '),
  {
    variants: {
      size: {
        sm: 'w-6 h-6',
        default: 'w-8 h-8',
        lg: 'w-10 h-10',
      },
      selected: {
        true: 'border-primary ring-2 ring-primary/30',
        false: 'border-outline-variant/50 hover:border-outline-variant',
      },
    },
    defaultVariants: {
      size: 'default',
      selected: false,
    },
  }
);

// Preset color palettes following M3 tonal system
const presetColors = {
  primary: ['#6750a4', '#7c5db5', '#9373c4', '#a98ad3', '#c0a2e2'],
  secondary: ['#625b71', '#7a7289', '#938ba1', '#aca4b9', '#c5bdd1'],
  tertiary: ['#7d5260', '#956879', '#ad8193', '#c59aac', '#ddb4c6'],
  error: ['#b3261e', '#c73e37', '#db5650', '#ef6f6a', '#ff8985'],
  success: ['#2aa86a', '#3fba7e', '#55cc92', '#6bdea6', '#82f0ba'],
  warning: ['#d09000', '#e0a020', '#f0b040', '#ffc060', '#ffd080'],
  neutral: ['#1c1b1f', '#49454f', '#79747e', '#aea9b4', '#e6e0e9'],
  common: ['#ffffff', '#f5f5f5', '#e0e0e0', '#9e9e9e', '#424242', '#000000'],
};

interface ColorPickerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'>, VariantProps<typeof colorPickerVariants> {
  /** Current color value (hex format) */
  value: string;
  /** Callback when color changes */
  onChange: (color: string) => void;
  /** Label for accessibility */
  label?: string;
  /** Show hex input field */
  showInput?: boolean;
  /** Show preset swatches */
  showPresets?: boolean;
  /** Preset palette to show */
  presetPalette?: keyof typeof presetColors | 'all';
  /** Disable the picker */
  disabled?: boolean;
  /** Ref for the container */
  ref?: Ref<HTMLDivElement>;
}

function ColorPicker({
  value,
  onChange,
  label,
  showInput = true,
  showPresets = false,
  presetPalette = 'common',
  size = 'default',
  layout = 'inline',
  disabled = false,
  className,
  ref,
  ...props
}: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync local value with prop
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Handle clicking outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleColorChange = (newColor: string) => {
    setLocalValue(newColor);
    onChange(newColor);
  };

  const handleInputChange = (inputValue: string) => {
    // Normalize hex input
    let normalized = inputValue.trim();
    if (!normalized.startsWith('#')) {
      normalized = '#' + normalized;
    }
    setLocalValue(normalized);

    // Only call onChange if it's a valid hex color
    if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(normalized)) {
      onChange(normalized);
    }
  };

  const handleSwatchClick = (color: string) => {
    handleColorChange(color);
  };

  // Get presets based on palette selection
  const getPresets = (): string[] => {
    if (presetPalette === 'all') {
      return Object.values(presetColors).flat();
    }
    return presetColors[presetPalette] || presetColors.common;
  };

  const presets = getPresets();
  const isSelected = (color: string) => color.toLowerCase() === localValue.toLowerCase();

  return (
    <div
      ref={(node) => {
        containerRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      }}
      className={cn('relative', colorPickerVariants({ size, layout, className }))}
      {...props}
    >
      {/* Color swatch button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(swatchVariants({ size, selected: false }), 'relative overflow-hidden', disabled && 'opacity-50 cursor-not-allowed')}
        style={{ backgroundColor: localValue }}
        aria-label={label || 'Select color'}
        aria-expanded={isOpen}
      >
        {/* Checkerboard pattern for transparency indication */}
        <div
          className="absolute inset-0 -z-10"
          style={{
            backgroundImage: `linear-gradient(45deg, #ccc 25%, transparent 25%), 
                             linear-gradient(-45deg, #ccc 25%, transparent 25%), 
                             linear-gradient(45deg, transparent 75%, #ccc 75%), 
                             linear-gradient(-45deg, transparent 75%, #ccc 75%)`,
            backgroundSize: '8px 8px',
            backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
          }}
        />
        {/* Hidden native color input */}
        <input
          ref={colorInputRef}
          type="color"
          value={localValue}
          onChange={(e) => handleColorChange(e.target.value)}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        />
      </button>

      {/* Hex input */}
      {showInput && (
        <Input
          value={localValue}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="#000000"
          size={size === 'lg' ? 'default' : 'sm'}
          disabled={disabled}
          className={cn('font-mono uppercase', size === 'sm' && 'w-20', size === 'default' && 'w-24', size === 'lg' && 'w-28')}
          maxLength={7}
          aria-label={`${label || 'Color'} hex value`}
        />
      )}

      {/* Eyedropper button */}
      {'EyeDropper' in window && (
        <button
          type="button"
          onClick={async () => {
            try {
              // @ts-expect-error EyeDropper API
              const eyeDropper = new window.EyeDropper();
              const result = await eyeDropper.open();
              handleColorChange(result.sRGBHex);
            } catch {
              // User cancelled or API not supported
            }
          }}
          disabled={disabled}
          className={cn(
            'p-2 rounded-xl border-2 border-outline-variant/50 text-on-surface-variant',
            'hover:border-outline-variant hover:bg-surface-container-high hover:text-on-surface',
            'focus:outline-none focus:ring-2 focus:ring-primary/40',
            'transition-all duration-200',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          aria-label="Pick color from screen"
        >
          <Pipette className={cn(size === 'sm' && 'h-3.5 w-3.5', size === 'default' && 'h-4 w-4', size === 'lg' && 'h-5 w-5')} />
        </button>
      )}

      {/* Preset swatches dropdown */}
      {showPresets && isOpen && (
        <div
          className={cn(
            'absolute top-full left-0 mt-2 p-3 z-50',
            'bg-surface-container rounded-2xl border-2 border-outline-variant/50',
            'animate-in fade-in-0 zoom-in-95 duration-200'
          )}
        >
          <div className="grid grid-cols-6 gap-1.5">
            {presets.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => handleSwatchClick(color)}
                className={cn(swatchVariants({ size: 'sm', selected: isSelected(color) }))}
                style={{ backgroundColor: color }}
                aria-label={`Select ${color}`}
              >
                {isSelected(color) && (
                  <Check className={cn('absolute inset-0 m-auto h-3 w-3', isLightColor(color) ? 'text-on-surface' : 'text-white')} />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper to determine if a color is light (for contrast)
function isLightColor(hex: string): boolean {
  const color = hex.replace('#', '');
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}

// Compound components for more complex use cases
interface ColorSwatchProps extends HTMLAttributes<HTMLButtonElement> {
  color: string;
  selected?: boolean;
  size?: 'sm' | 'default' | 'lg';
}

function ColorSwatch({ color, selected = false, size = 'default', className, ...props }: ColorSwatchProps) {
  return (
    <button type="button" className={cn(swatchVariants({ size, selected, className }))} style={{ backgroundColor: color }} {...props}>
      {selected && (
        <Check
          className={cn(
            'absolute inset-0 m-auto',
            size === 'sm' && 'h-3 w-3',
            size === 'default' && 'h-4 w-4',
            size === 'lg' && 'h-5 w-5',
            isLightColor(color) ? 'text-on-surface' : 'text-white'
          )}
        />
      )}
    </button>
  );
}

export { ColorPicker, ColorSwatch, presetColors };
export type { ColorPickerProps };
