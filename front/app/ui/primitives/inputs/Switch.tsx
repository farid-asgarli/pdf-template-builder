import { type InputHTMLAttributes, type Ref, useId } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/app/ui';

interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  ref?: Ref<HTMLInputElement>;
  label?: string;
  description?: string;
  size?: 'default' | 'sm';
}

function Switch({ className, label, description, size = 'default', ref, id, checked, ...props }: SwitchProps) {
  const generatedId = useId();
  const switchId = id || generatedId;

  // M3 Switch dimensions
  const isSmall = size === 'sm';
  const trackWidth = isSmall ? 'w-11' : 'w-13';
  const trackHeight = isSmall ? 'h-6' : 'h-8';
  const iconSize = isSmall ? 'h-3 w-3' : 'h-4 w-4';

  return (
    <div className={cn('flex items-center justify-between gap-3', className)}>
      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <label htmlFor={switchId} className="text-sm font-medium text-on-surface cursor-pointer">
              {label}
            </label>
          )}
          {description && <p className="text-sm text-on-surface-variant mt-0.5 leading-relaxed">{description}</p>}
        </div>
      )}
      <label htmlFor={switchId} className="relative flex items-center cursor-pointer group/switch">
        <input
          type="checkbox"
          role="switch"
          id={switchId}
          ref={ref}
          checked={checked}
          className="peer sr-only disabled:cursor-not-allowed"
          {...props}
        />
        {/* Track - M3 Style: outlined when off, filled when on */}
        <div
          className={cn(
            'rounded-full transition-all duration-200',
            // Unchecked: outlined track with surface fill
            'bg-surface-container border-2 border-outline',
            // Checked: filled primary track
            'peer-checked:bg-primary peer-checked:border-primary',
            // Focus ring
            'peer-focus-visible:ring-2 peer-focus-visible:ring-primary/30 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface',
            // Disabled state
            'peer-disabled:opacity-50 peer-disabled:cursor-not-allowed',
            trackWidth,
            trackHeight
          )}
        />
        {/* Thumb - M3 Style: small when off, larger with icon when on */}
        <div
          className={cn(
            'absolute rounded-full transition-all duration-200 flex items-center justify-center pointer-events-none',
            // Unchecked: small, outline color
            'bg-outline',
            // Checked: larger, on-primary color (white)
            'peer-checked:bg-on-primary',
            // Disabled
            'peer-disabled:opacity-50',
            // Size - unchecked
            isSmall ? 'h-3.5 w-3.5' : 'h-4 w-4',
            // Size - checked (grows)
            isSmall ? 'peer-checked:h-5 peer-checked:w-5' : 'peer-checked:h-6 peer-checked:w-6',
            // Position - start position
            isSmall ? 'left-1.5' : 'left-1.5',
            // Position - translate when checked
            isSmall ? 'peer-checked:translate-x-4' : 'peer-checked:translate-x-5'
          )}
        >
          {/* Checkmark icon - only visible when checked */}
          <Check
            className={cn(
              iconSize,
              'text-primary opacity-0 scale-0 transition-all duration-200',
              // Use has-[:checked] to detect checked state from parent
              'group-has-checked/switch:opacity-100 group-has-checked/switch:scale-100'
            )}
          />
        </div>
      </label>
    </div>
  );
}

export { Switch };
