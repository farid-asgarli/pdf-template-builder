import { type HTMLAttributes, type Ref } from 'react';
import { cn } from '@/app/ui';

// ============ Linear Progress ============
interface LinearProgressProps extends HTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
  value?: number; // 0-100
  indeterminate?: boolean;
  size?: 'sm' | 'default' | 'lg';
  /** Accessible label - pass pre-translated string */
  label?: string;
}

function LinearProgress({ className, value = 0, indeterminate = false, size = 'default', label = 'Progress', ref, ...props }: LinearProgressProps) {
  const heightClasses = {
    sm: 'h-1',
    default: 'h-1.5',
    lg: 'h-2',
  };

  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div
      ref={ref}
      role="progressbar"
      aria-valuenow={indeterminate ? undefined : clampedValue}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn('w-full overflow-hidden rounded-full bg-primary/15', heightClasses[size], className)}
      {...props}
    >
      <div
        className={cn('h-full rounded-full bg-primary transition-all duration-300', indeterminate ? 'animate-progress-indeterminate w-1/2' : '')}
        style={indeterminate ? undefined : { width: `${clampedValue}%` }}
      />
    </div>
  );
}

// ============ Circular Progress ============
interface CircularProgressProps extends HTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
  value?: number; // 0-100
  indeterminate?: boolean;
  size?: 'sm' | 'default' | 'lg';
  strokeWidth?: number;
  /** Accessible label - pass pre-translated string */
  label?: string;
}

function CircularProgress({
  className,
  value = 0,
  indeterminate = false,
  size = 'default',
  strokeWidth,
  label = 'Progress',
  ref,
  ...props
}: CircularProgressProps) {
  const sizeClasses = {
    sm: 'h-5 w-5',
    default: 'h-10 w-10',
    lg: 'h-16 w-16',
  };

  const sizeValues = {
    sm: 20,
    default: 40,
    lg: 64,
  };

  const defaultStrokeWidth = {
    sm: 2,
    default: 3,
    lg: 4,
  };

  const actualSize = sizeValues[size];
  const actualStrokeWidth = strokeWidth || defaultStrokeWidth[size];
  const radius = (actualSize - actualStrokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  const clampedCircularValue = Math.min(100, Math.max(0, value));

  return (
    <div
      ref={ref}
      role="progressbar"
      aria-valuenow={indeterminate ? undefined : clampedCircularValue}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn(sizeClasses[size], indeterminate && 'animate-spin', className)}
      {...props}
    >
      <svg className="h-full w-full -rotate-90" viewBox={`0 0 ${actualSize} ${actualSize}`}>
        {/* Background circle */}
        <circle
          className="text-surface-container-highest"
          strokeWidth={actualStrokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={actualSize / 2}
          cy={actualSize / 2}
        />
        {/* Progress circle */}
        <circle
          className="text-primary transition-all duration-300"
          strokeWidth={actualStrokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={indeterminate ? circumference * 0.75 : strokeDashoffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={actualSize / 2}
          cy={actualSize / 2}
        />
      </svg>
    </div>
  );
}

// ============ Loading Indicator (Dots) ============
interface LoadingDotsProps extends HTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
  size?: 'sm' | 'default' | 'lg';
}

function LoadingDots({ className, size = 'default', ref, ...props }: LoadingDotsProps) {
  const dotSizes = {
    sm: 'h-1.5 w-1.5',
    default: 'h-2 w-2',
    lg: 'h-3 w-3',
  };

  return (
    <div ref={ref} className={cn('flex items-center gap-1', className)} {...props}>
      {[0, 1, 2].map((i) => (
        <div key={i} className={cn('rounded-full bg-primary animate-bounce', dotSizes[size])} style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </div>
  );
}

// ============ Loading Indicator (Full-featured) ============
interface LoadingIndicatorProps extends HTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
  size?: 'sm' | 'default' | 'lg';
  label?: string;
  fullScreen?: boolean;
}

function LoadingIndicator({ className, size = 'default', label, fullScreen = false, ref, ...props }: LoadingIndicatorProps) {
  const content = (
    <div ref={ref} className={cn('flex flex-col items-center justify-center gap-3', className)} {...props}>
      <CircularProgress indeterminate size={size} />
      {label && (
        <p className={cn('text-on-surface-variant', size === 'sm' && 'text-xs', size === 'default' && 'text-sm', size === 'lg' && 'text-base')}>
          {label}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return <div className="fixed inset-0 flex items-center justify-center bg-surface/80 backdrop-blur-sm z-50">{content}</div>;
  }

  return content;
}

export { LinearProgress, CircularProgress, LoadingDots, LoadingIndicator };
