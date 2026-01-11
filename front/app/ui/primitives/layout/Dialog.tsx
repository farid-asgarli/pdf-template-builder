import { useEffect, type ReactNode, type HTMLAttributes, type Ref, useCallback, useSyncExternalStore, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { OverlayHeader, type OverlayHeaderVariant } from '.';
import { cn } from '@/app/ui';
import { Button, IconButton } from '../buttons';
import { DialogLabels, DEFAULT_DIALOG_LABELS } from '../types';

// Animation variants - soft fade matching View Transitions API
// 150ms ease-out for subtle, consistent feel across the app
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const dialogVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const dialogTransition = { duration: 0.15, ease: 'easeOut' as const };

// Helper for SSR-safe portal mounting
const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

function useIsMounted() {
  return useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);
}

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

// Omit React event handlers that conflict with framer-motion
type MotionSafeHTMLAttributes<T> = Omit<HTMLAttributes<T>, 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd'>;

interface DialogContentProps extends MotionSafeHTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
  size?: 'sm' | 'default' | 'lg' | 'xl' | 'full';
  showClose?: boolean;
  onClose?: () => void;
  /** Labels for i18n - pass pre-translated strings */
  labels?: DialogLabels;
}

interface DialogHeaderProps extends HTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
  /** Enable hero mode with colored background and icon */
  hero?: boolean;
  /** Icon for hero mode */
  icon?: ReactNode;
  /** Title text (used in hero mode) */
  title?: string;
  /** Description text or element (used in hero mode) */
  description?: ReactNode;
  /** Color variant for hero mode */
  variant?: OverlayHeaderVariant;
  /** Show close button in hero mode */
  showClose?: boolean;
}

interface DialogTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  ref?: Ref<HTMLHeadingElement>;
}

interface DialogDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  ref?: Ref<HTMLParagraphElement>;
}

interface DialogFooterProps extends HTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
}

// Dialog Context

const DialogContext = createContext<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
} | null>(null);

function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('Dialog components must be used within a Dialog');
  }
  return context;
}

function Dialog({ open, onOpenChange, children }: DialogProps) {
  return <DialogContext.Provider value={{ open, onOpenChange }}>{children}</DialogContext.Provider>;
}

function DialogTrigger({ children, asChild }: { children: ReactNode; asChild?: boolean }) {
  const { onOpenChange } = useDialog();

  if (asChild && children && typeof children === 'object' && 'props' in children) {
    const child = children as React.ReactElement<{ onClick?: () => void }>;
    return (
      <>
        {/* Clone and add onClick */}
        <span onClick={() => onOpenChange(true)}>{child}</span>
      </>
    );
  }

  return <Button onClick={() => onOpenChange(true)}>{children}</Button>;
}

function DialogContent({ className, children, size = 'default', showClose = true, onClose, ref, labels = {}, ...props }: DialogContentProps) {
  const mergedLabels = { ...DEFAULT_DIALOG_LABELS, ...labels };
  const { open, onOpenChange } = useDialog();
  const mounted = useIsMounted();

  const handleClose = useCallback(() => {
    onOpenChange(false);
    onClose?.();
  }, [onOpenChange, onClose]);

  // Handle escape key
  useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, handleClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!mounted) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    default: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[90vw] h-[90vh]',
  };

  return createPortal(
    <AnimatePresence mode="wait">
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop with fade animation */}
          <motion.div
            className="fixed inset-0 bg-scrim/30 backdrop-blur-sm"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={dialogTransition}
            onClick={handleClose}
          />

          {/* Dialog */}
          <motion.div
            ref={ref}
            role="dialog"
            aria-modal="true"
            variants={dialogVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={dialogTransition}
            className={cn(
              'relative z-50 w-full',
              'bg-surface rounded-3xl',
              'border border-outline-variant/30',
              'shadow-xl shadow-scrim/10',
              'max-h-[90vh] overflow-hidden flex flex-col',
              sizeClasses[size],
              className
            )}
            {...props}
          >
            {showClose && (
              <IconButton aria-label={mergedLabels.close} variant="standard" size="sm" className="absolute right-4 top-4 z-10" onClick={handleClose}>
                <X className="h-5 w-5" />
              </IconButton>
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

function DialogHeader({
  className,
  ref,
  hero = false,
  icon,
  title,
  description,
  variant = 'primary',
  showClose = false,
  children,
  ...props
}: DialogHeaderProps) {
  const { onOpenChange } = useDialog();

  // Hero mode: use OverlayHeader
  if (hero && title) {
    return (
      <OverlayHeader
        ref={ref}
        icon={icon}
        title={title}
        description={description}
        variant={variant}
        showClose={showClose}
        onClose={() => onOpenChange(false)}
        className={className}
        {...props}
      >
        {children}
      </OverlayHeader>
    );
  }

  // Standard mode: simple header container
  return (
    <div ref={ref} className={cn('flex flex-col gap-1.5 p-6 pb-2', className)} {...props}>
      {children}
    </div>
  );
}

function DialogTitle({ className, ref, ...props }: DialogTitleProps) {
  return <h2 ref={ref} className={cn('text-lg font-semibold text-on-surface', className)} {...props} />;
}

function DialogDescription({ className, ref, ...props }: DialogDescriptionProps) {
  return <p ref={ref} className={cn('text-sm text-on-surface-variant leading-relaxed', className)} {...props} />;
}

function DialogBody({ className, ref, ...props }: DialogHeaderProps) {
  return <div ref={ref} className={cn('flex-1 overflow-y-auto p-6', className)} {...props} />;
}

function DialogFooter({ className, ref, ...props }: DialogFooterProps) {
  return (
    <div
      ref={ref}
      className={cn('flex items-center justify-end gap-3 p-6 pt-4', 'border-t border-outline-variant/20 bg-surface-container-lowest/50', className)}
      {...props}
    />
  );
}

export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter };
