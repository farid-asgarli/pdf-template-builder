import { type HTMLAttributes, type Ref } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/app/ui';

// M3 Expressive Card - Clean, modern design with subtle radius animations
// No shadows, gradients, or elevation transforms - pure M3 expressive treatment
// Border radius increases on interaction: stationary 24px → hover 36px → active 48px
const cardVariants = cva(
  ['text-on-surface', 'transition-[border-radius,border-color,background-color] duration-300 ease-[cubic-bezier(0.2,0,0,1)]', 'rounded-2xl'].join(
    ' '
  ),
  {
    variants: {
      variant: {
        // M3 Expressive: Elevated - clean surface with subtle state layer
        elevated: [
          'bg-[var(--color-card-idle)]',
          'border border-[var(--color-card-border)]',
          'hover:rounded-[36px] hover:border-[var(--color-card-border-hover)]',
          'focus-within:rounded-[48px] focus-within:border-primary/40',
          'active:rounded-[48px]',
        ].join(' '),
        // M3 Expressive: Filled - subtle container background
        filled: [
          'bg-surface-container',
          'border border-transparent',
          'hover:rounded-[36px] hover:bg-surface-container-high',
          'focus-within:rounded-[48px] focus-within:bg-surface-container-highest',
          'active:rounded-[48px]',
        ].join(' '),
        // M3 Expressive: Outlined - prominent border emphasis
        outlined: [
          'bg-surface',
          'border-2 border-outline-variant/50',
          'hover:rounded-[36px] hover:border-outline-variant',
          'focus-within:rounded-[48px] focus-within:border-primary/50',
          'active:rounded-[48px]',
        ].join(' '),
        // M3 Expressive: Glass - subtle frosted appearance
        glass: [
          'bg-surface-container-lowest/60 backdrop-blur-md',
          'border border-outline-variant/20',
          'hover:rounded-[36px] hover:bg-surface-container-lowest/80 hover:border-outline-variant/35',
          'focus-within:rounded-[48px] focus-within:border-primary/30',
          'active:rounded-[48px]',
        ].join(' '),
        // M3 Expressive: Highlighted - tonal accent for emphasis
        highlighted: [
          'bg-primary-container/15',
          'border border-primary/10',
          'hover:rounded-[36px] hover:bg-primary-container/25 hover:border-primary/20',
          'focus-within:rounded-[48px] focus-within:bg-primary-container/30 focus-within:border-primary/30',
          'active:rounded-[48px]',
        ].join(' '),
        // M3 Expressive: Interactive - clickable cards with clear affordance
        interactive: [
          'bg-[var(--color-card-idle)]',
          'border border-[var(--color-card-border)]',
          'cursor-pointer',
          'hover:rounded-[36px] hover:border-[var(--color-card-border-hover)] hover:bg-[var(--color-card-focus)]',
          'focus-within:rounded-[48px] focus-within:border-primary/40 focus-within:bg-[var(--color-card-focus)]',
          'active:rounded-[48px] active:bg-[var(--color-card-focus)]',
        ].join(' '),
      },
      shape: {
        rounded: 'rounded-2xl hover:rounded-[36px] focus-within:rounded-[48px]',
        square: 'rounded-xl hover:rounded-2xl focus-within:rounded-3xl',
        pill: 'rounded-[2rem] hover:rounded-[2.5rem] focus-within:rounded-[3rem]',
        soft: 'rounded-2xl hover:rounded-3xl focus-within:rounded-[36px]',
      },
      padding: {
        none: '',
        sm: 'p-4',
        default: 'p-5',
        lg: 'p-6',
      },
    },
    defaultVariants: {
      variant: 'elevated',
      shape: 'rounded',
      padding: 'none',
    },
  }
);

interface CardProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {
  ref?: Ref<HTMLDivElement>;
}

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  ref?: Ref<HTMLHeadingElement>;
}

interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  ref?: Ref<HTMLParagraphElement>;
}

function Card({ className, variant, shape, padding, ref, ...props }: CardProps) {
  return <div ref={ref} className={cn(cardVariants({ variant, shape, padding, className }))} {...props} />;
}

function CardHeader({ className, ref, ...props }: CardProps) {
  return <div ref={ref} className={cn('flex flex-col gap-1.5 p-5 pb-3', className)} {...props} />;
}

function CardTitle({ className, ref, ...props }: CardTitleProps) {
  return <h3 ref={ref} className={cn('text-lg font-bold leading-tight tracking-tight text-on-surface', className)} {...props} />;
}

function CardDescription({ className, ref, ...props }: CardDescriptionProps) {
  return <p ref={ref} className={cn('text-sm text-on-surface-variant leading-relaxed', className)} {...props} />;
}

function CardContent({ className, ref, ...props }: CardProps) {
  return <div ref={ref} className={cn('p-5 pt-2', className)} {...props} />;
}

function CardFooter({ className, ref, ...props }: CardProps) {
  return <div ref={ref} className={cn('flex items-center gap-3 p-5 pt-3', className)} {...props} />;
}

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants };
