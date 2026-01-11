import { useEffect, type ReactNode, type HTMLAttributes, type Ref, useCallback, createContext, useContext, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { OverlayHeader, type OverlayHeaderVariant } from '.';
import { IconButton } from '../buttons';
import { cn } from '@/app/ui';
import { DrawerLabels, DEFAULT_DRAWER_LABELS } from '../types';

// Animation variants - soft fade matching View Transitions API
// 150ms ease-out for subtle, consistent feel across the app
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const drawerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const drawerTransition = { duration: 0.15, ease: 'easeOut' as const };

// Simple client-side check without setState
function useIsMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

// Drawer Context
interface DrawerContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  side: 'left' | 'right' | 'top' | 'bottom';
}

const DrawerContext = createContext<DrawerContextValue | null>(null);

function useDrawer() {
  const context = useContext(DrawerContext);
  if (!context) {
    throw new Error('Drawer components must be used within a Drawer');
  }
  return context;
}

// Main Drawer Props
interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  side?: 'left' | 'right' | 'top' | 'bottom';
}

// Omit React event handlers that conflict with framer-motion
type MotionSafeHTMLAttributes<T> = Omit<HTMLAttributes<T>, 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd'>;

// Drawer Content Props
interface DrawerContentProps extends MotionSafeHTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
  showClose?: boolean;
  onClose?: () => void;
  /** Labels for i18n - pass pre-translated strings */
  labels?: DrawerLabels;
}

// Drawer Header Props
interface DrawerHeaderProps extends HTMLAttributes<HTMLDivElement> {
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

// Drawer Title Props
interface DrawerTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  ref?: Ref<HTMLHeadingElement>;
}

// Drawer Description Props
interface DrawerDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  ref?: Ref<HTMLParagraphElement>;
}

// Drawer Footer Props
interface DrawerFooterProps extends HTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
}

// Main Drawer Component
function Drawer({ open, onOpenChange, children, side = 'right' }: DrawerProps) {
  return <DrawerContext.Provider value={{ open, onOpenChange, side }}>{children}</DrawerContext.Provider>;
}

// Drawer Trigger
function DrawerTrigger({ children, asChild }: { children: ReactNode; asChild?: boolean }) {
  const { onOpenChange } = useDrawer();

  if (asChild && children && typeof children === 'object' && 'props' in children) {
    return <span onClick={() => onOpenChange(true)}>{children}</span>;
  }

  return (
    <button onClick={() => onOpenChange(true)} type="button">
      {children}
    </button>
  );
}

// Drawer Content
function DrawerContent({ className, children, showClose = true, onClose, ref, labels = {}, ...props }: DrawerContentProps) {
  const mergedLabels = { ...DEFAULT_DRAWER_LABELS, ...labels };
  const { open, onOpenChange, side } = useDrawer();
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

  // Side-specific classes (animation handled by Framer Motion)
  const sideClasses = {
    left: {
      container: 'inset-y-0 left-0',
      size: 'h-full w-full max-w-sm',
      rounded: 'rounded-r-3xl',
    },
    right: {
      container: 'inset-y-0 right-0',
      size: 'h-full w-full max-w-sm',
      rounded: 'rounded-l-3xl',
    },
    top: {
      container: 'inset-x-0 top-0',
      size: 'w-full max-h-[80vh]',
      rounded: 'rounded-b-3xl',
    },
    bottom: {
      container: 'inset-x-0 bottom-0',
      size: 'w-full max-h-[80vh]',
      rounded: 'rounded-t-3xl',
    },
  };

  const sideStyles = sideClasses[side];

  return createPortal(
    <AnimatePresence mode="wait">
      {open && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop with fade animation */}
          <motion.div
            className="absolute inset-0 bg-scrim/30 backdrop-blur-sm"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={drawerTransition}
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Drawer Panel with fade animation */}
          <motion.div
            ref={ref}
            role="dialog"
            aria-modal="true"
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={drawerTransition}
            className={cn(
              'fixed bg-surface flex flex-col border border-outline-variant/30',
              sideStyles.container,
              sideStyles.size,
              sideStyles.rounded,
              className
            )}
            {...props}
          >
            {/* Close button */}
            {showClose && (
              <div className="absolute top-4 right-4 z-10">
                <IconButton variant="standard" size="sm" onClick={handleClose} aria-label={mergedLabels.close}>
                  <X className="h-5 w-5" />
                </IconButton>
              </div>
            )}

            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

// Drawer Header
function DrawerHeader({
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
}: DrawerHeaderProps) {
  const { onOpenChange } = useDrawer();

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
    <div ref={ref} className={cn('flex flex-col gap-1.5 p-6 pb-4', className)} {...props}>
      {children}
    </div>
  );
}

// Drawer Title
function DrawerTitle({ className, ref, ...props }: DrawerTitleProps) {
  return <h2 ref={ref} className={cn('text-lg font-semibold text-on-surface', className)} {...props} />;
}

// Drawer Description
function DrawerDescription({ className, ref, ...props }: DrawerDescriptionProps) {
  return <p ref={ref} className={cn('text-sm text-on-surface-variant', className)} {...props} />;
}

// Drawer Body (scrollable content area)
function DrawerBody({ className, ref, ...props }: HTMLAttributes<HTMLDivElement> & { ref?: Ref<HTMLDivElement> }) {
  return <div ref={ref} className={cn('flex-1 overflow-y-auto px-6 py-2', className)} {...props} />;
}

// Drawer Footer
function DrawerFooter({ className, ref, ...props }: DrawerFooterProps) {
  return (
    <div
      ref={ref}
      className={cn('flex flex-col-reverse sm:flex-row sm:justify-end gap-2 p-6 pt-4 border-t border-outline-variant/20', className)}
      {...props}
    />
  );
}

// Drawer Handle (for bottom sheets - drag indicator)
function DrawerHandle({ className }: { className?: string }) {
  return (
    <div className={cn('flex justify-center pt-4 pb-2', className)}>
      <div className="w-10 h-1 rounded-full bg-on-surface-variant/20" />
    </div>
  );
}

export { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerBody, DrawerFooter, DrawerHandle };
