import { useState, useLayoutEffect, useEffect, useRef, useCallback, type ReactNode, type HTMLAttributes, type Ref } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/app/ui';

interface MenuProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'bottom';
  className?: string;
  /** Maximum height of the menu content area (e.g., '300px', '50vh'). Adds scrolling when content exceeds this height. */
  maxHeight?: string;
}

interface MenuItemProps extends HTMLAttributes<HTMLButtonElement> {
  ref?: Ref<HTMLButtonElement>;
  icon?: ReactNode;
  destructive?: boolean;
  disabled?: boolean;
}

interface MenuSeparatorProps extends HTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
}

function Menu({ trigger, children, align = 'start', side = 'bottom', className, maxHeight }: MenuProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [actualSide, setActualSide] = useState<'top' | 'bottom'>(side);
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Calculate menu position
  const calculatePosition = useCallback(
    (menuHeight: number = 200) => {
      if (!triggerRef.current) return null;

      const rect = triggerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const gap = 6;

      // Calculate available space above and below the trigger
      const spaceBelow = viewportHeight - rect.bottom - gap;
      const spaceAbove = rect.top - gap;

      // Determine the best side to open the menu
      let preferredSide = side;

      // If preferred side doesn't have enough space, try the other side
      if (preferredSide === 'bottom' && menuHeight > spaceBelow) {
        // Not enough space below - check if there's more space above
        if (spaceAbove > spaceBelow) {
          preferredSide = 'top';
        }
      } else if (preferredSide === 'top' && menuHeight > spaceAbove) {
        // Not enough space above - check if there's more space below
        if (spaceBelow > spaceAbove) {
          preferredSide = 'bottom';
        }
      }

      // Update actual side for animation origin
      setActualSide(preferredSide);

      // Calculate top position based on the chosen side
      let top = preferredSide === 'bottom' ? rect.bottom + gap : rect.top - menuHeight - gap;

      // Final bounds check - ensure menu stays within viewport
      if (top + menuHeight > viewportHeight) {
        top = viewportHeight - menuHeight - gap;
      }
      if (top < gap) {
        top = gap;
      }

      // Calculate left position
      let left = rect.left;

      if (align === 'center') {
        left = rect.left + rect.width / 2;
      } else if (align === 'end') {
        left = rect.right;
      }

      // Ensure menu doesn't overflow horizontally
      const menuWidth = 208; // min-w-52 = 13rem = 208px
      if (align === 'start' && left + menuWidth > viewportWidth) {
        left = viewportWidth - menuWidth - gap;
      }
      if (left < gap) {
        left = gap;
      }

      return { top, left };
    },
    [align, side]
  );

  // Calculate position synchronously when opening
  const handleToggle = () => {
    if (!open && triggerRef.current) {
      setPosition(calculatePosition());
    } else {
      setPosition(null);
    }
    setOpen(!open);
  };

  // Update position after menu renders (to get actual height)
  useLayoutEffect(() => {
    if (open && menuRef.current) {
      const menuHeight = menuRef.current.offsetHeight;
      setPosition(calculatePosition(menuHeight));
    }
  }, [open, calculatePosition]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) && triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setPosition(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Close on escape
  useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setPosition(null);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open]);

  // Dynamic origin classes based on align and actual side
  const getOriginClass = () => {
    const isTop = actualSide === 'top';
    if (align === 'start') return isTop ? 'origin-bottom-left' : 'origin-top-left';
    if (align === 'center') return isTop ? 'origin-bottom' : 'origin-top';
    if (align === 'end') return isTop ? 'origin-bottom-right' : 'origin-top-right';
    return 'origin-top-left';
  };

  const translateClass = {
    start: '',
    center: '-translate-x-1/2',
    end: '-translate-x-full',
  };

  return (
    <>
      <div ref={triggerRef} onClick={handleToggle} className="inline-flex cursor-pointer">
        {trigger}
      </div>

      {open &&
        position &&
        createPortal(
          <div
            ref={menuRef}
            className={cn(
              'fixed z-50 min-w-52 py-2 rounded-2xl',
              'bg-surface-container-lowest border border-outline-variant/20',
              'shadow-xl shadow-scrim/15',
              'animate-in fade-in zoom-in-95 duration-150',
              getOriginClass(),
              translateClass[align],
              className
            )}
            style={{
              top: position.top,
              left: position.left,
            }}
          >
            {/* Pass close function to children */}
            <div
              className={cn(maxHeight && 'overflow-y-auto')}
              style={maxHeight ? { maxHeight } : undefined}
              onClick={() => {
                setOpen(false);
                setPosition(null);
              }}
            >
              {children}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

function MenuItem({ className, icon, destructive = false, disabled = false, ref, children, ...props }: MenuItemProps) {
  return (
    <button
      type="button"
      ref={ref}
      disabled={disabled}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 mx-1.5 text-sm text-left transition-colors rounded-xl',
        'focus-visible:outline-none focus-visible:bg-surface-container-high',
        destructive ? 'text-error hover:bg-error/8' : 'text-on-surface hover:bg-surface-container-high',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      style={{ width: 'calc(100% - 12px)' }}
      {...props}
    >
      {icon && <span className="shrink-0 w-5 h-5 [&>svg]:w-5 [&>svg]:h-5">{icon}</span>}
      <span className="flex-1 font-medium">{children}</span>
    </button>
  );
}

function MenuSeparator({ className, ref, ...props }: MenuSeparatorProps) {
  return <div ref={ref} className={cn('my-2 h-px bg-outline-variant/30 mx-3', className)} {...props} />;
}

export { Menu, MenuItem, MenuSeparator };
