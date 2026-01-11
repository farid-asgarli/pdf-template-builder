import { type HTMLAttributes, type Ref } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/app/ui';

const avatarVariants = cva(
  'relative flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'bg-primary-container/60 text-on-primary-container',
        secondary: 'bg-secondary-container/60 text-on-secondary-container',
        tertiary: 'bg-tertiary-container/60 text-on-tertiary-container',
        surface: 'bg-surface-container text-on-surface-variant',
      },
      size: {
        xs: 'h-7 w-7 text-[10px]',
        sm: 'h-9 w-9 text-xs',
        default: 'h-11 w-11 text-sm',
        lg: 'h-14 w-14 text-base',
        xl: 'h-18 w-18 text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

interface AvatarProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof avatarVariants> {
  ref?: Ref<HTMLDivElement>;
  src?: string;
  alt?: string;
  fallback?: string;
}

function Avatar({ className, src, alt = 'User avatar', fallback, variant, size, ref, ...props }: AvatarProps) {
  const initials = fallback
    ? fallback
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  return (
    <div ref={ref} className={cn(avatarVariants({ variant, size, className }))} {...props}>
      {src ? <img src={src} alt={alt} className="h-full w-full object-cover" /> : <span className="select-none">{initials}</span>}
    </div>
  );
}

// Avatar Group for displaying multiple avatars
interface AvatarGroupProps extends HTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
  max?: number;
  size?: 'xs' | 'sm' | 'default' | 'lg' | 'xl';
}

const groupSizeClasses = {
  xs: 'h-7 w-7 text-[10px]',
  sm: 'h-9 w-9 text-xs',
  default: 'h-11 w-11 text-sm',
  lg: 'h-14 w-14 text-base',
  xl: 'h-18 w-18 text-lg',
};

function AvatarGroup({ className, children, max = 4, size = 'default', ref, ...props }: AvatarGroupProps) {
  const childArray = Array.isArray(children) ? children : [children];
  const visibleChildren = childArray.slice(0, max);
  const remainingCount = childArray.length - max;

  return (
    <div ref={ref} className={cn('flex -space-x-3', className)} {...props}>
      {visibleChildren}
      {remainingCount > 0 && (
        <div
          className={cn(
            'relative flex shrink-0 items-center justify-center rounded-full',
            'bg-surface-container-high text-on-surface font-semibold',
            'ring-2 ring-surface',
            groupSizeClasses[size]
          )}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}

export { Avatar, AvatarGroup, avatarVariants };
