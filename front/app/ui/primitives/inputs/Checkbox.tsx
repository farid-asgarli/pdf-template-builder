import { type InputHTMLAttributes, type Ref, useId } from 'react';
import { cn } from '@/app/ui';
import { Check } from 'lucide-react';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  ref?: Ref<HTMLInputElement>;
  label?: string;
  description?: string;
}

function Checkbox({ className, label, description, ref, id, checked, defaultChecked, onChange, ...props }: CheckboxProps) {
  const generatedId = useId();
  const checkboxId = id || generatedId;

  // Determine if controlled or uncontrolled
  const isControlled = checked !== undefined;
  const isChecked = isControlled ? Boolean(checked) : false;

  // Compute classes based on checked state
  const inputClasses = cn(
    'peer h-6 w-6 cursor-pointer appearance-none rounded-lg border-2 transition-all duration-200',
    'hover:border-primary/70 hover:bg-primary/5',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
    'disabled:cursor-not-allowed disabled:opacity-50',
    isControlled
      ? isChecked
        ? 'border-primary bg-primary'
        : 'border-outline bg-transparent'
      : 'border-outline checked:border-primary checked:bg-primary',
    className
  );

  const checkIconClasses = cn(
    'pointer-events-none absolute h-4 w-4 text-on-primary transition-opacity duration-200',
    isControlled ? (isChecked ? 'opacity-100' : 'opacity-0') : 'opacity-0 peer-checked:opacity-100'
  );

  return (
    <div className="flex items-start gap-3">
      <div className="relative flex items-center justify-center">
        <input
          type="checkbox"
          id={checkboxId}
          ref={ref}
          checked={isControlled ? checked : undefined}
          defaultChecked={!isControlled ? defaultChecked : undefined}
          onChange={onChange}
          className={inputClasses}
          {...props}
        />
        <Check className={checkIconClasses} strokeWidth={3} />
      </div>
      {(label || description) && (
        <div className="flex flex-col pt-0.5">
          {label && (
            <label htmlFor={checkboxId} className="text-sm font-medium text-on-surface cursor-pointer">
              {label}
            </label>
          )}
          {description && <p className="text-sm text-on-surface-variant mt-0.5">{description}</p>}
        </div>
      )}
    </div>
  );
}

export { Checkbox };
