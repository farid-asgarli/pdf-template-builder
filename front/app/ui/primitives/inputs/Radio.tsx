import { type InputHTMLAttributes, type Ref, useId } from 'react';
import { cn } from '@/app/ui';

interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  ref?: Ref<HTMLInputElement>;
  label?: string;
  description?: string;
}

function Radio({ className, label, description, ref, id, checked, ...props }: RadioProps) {
  const generatedId = useId();
  const radioId = id || generatedId;

  return (
    <div className="flex items-start gap-3">
      <div className="relative flex items-center justify-center">
        <input
          type="radio"
          id={radioId}
          ref={ref}
          checked={checked}
          className={cn(
            'peer h-6 w-6 cursor-pointer appearance-none rounded-full border-2 border-outline transition-all duration-200',
            'checked:border-primary',
            'hover:border-primary/70 hover:bg-primary/5',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
            'disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
          {...props}
        />
        <div
          className={cn(
            'pointer-events-none absolute h-3 w-3 rounded-full bg-primary opacity-0 scale-0 transition-all duration-200',
            'peer-checked:opacity-100 peer-checked:scale-100'
          )}
        />
      </div>
      {(label || description) && (
        <div className="flex flex-col pt-0.5">
          {label && (
            <label htmlFor={radioId} className="text-sm font-medium text-on-surface cursor-pointer">
              {label}
            </label>
          )}
          {description && <p className="text-sm text-on-surface-variant mt-0.5">{description}</p>}
        </div>
      )}
    </div>
  );
}

// Radio Group component for grouping radio buttons
interface RadioGroupProps {
  name: string;
  value?: string;
  onChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

function RadioGroup({ name, value, onChange, children, className, orientation = 'vertical' }: RadioGroupProps) {
  return (
    <div role="radiogroup" className={cn('flex', orientation === 'vertical' ? 'flex-col gap-3' : 'flex-row flex-wrap gap-4', className)}>
      {/* Clone children and inject props */}
      {Array.isArray(children)
        ? children.map((child, index) => {
            if (child && typeof child === 'object' && 'props' in child) {
              return (
                <Radio
                  key={index}
                  {...(child as React.ReactElement<RadioProps>).props}
                  name={name}
                  checked={value === (child as React.ReactElement<RadioProps>).props.value}
                  onChange={(e) => onChange?.(e.target.value)}
                />
              );
            }
            return child;
          })
        : children}
    </div>
  );
}

export { Radio, RadioGroup };
