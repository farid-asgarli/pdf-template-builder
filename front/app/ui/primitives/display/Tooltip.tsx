import { type HTMLAttributes, type Ref, type ReactNode, useState, useRef, useCallback, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/app/ui';

type TooltipSide = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  /** Preferred side - will flip if not enough space */
  side?: TooltipSide;
  /** Delay before showing tooltip (ms) */
  delayMs?: number;
  /** Additional offset from trigger element (px) */
  offset?: number;
  className?: string;
  /** Disable the tooltip */
  disabled?: boolean;
}

interface Position {
  x: number;
  y: number;
  actualSide: TooltipSide;
}

const VIEWPORT_PADDING = 8; // Minimum distance from viewport edge
const DEFAULT_OFFSET = 8; // Gap between trigger and tooltip
const DEFAULT_DELAY = 150; // Delay before showing

/**
 * Calculate optimal tooltip position with viewport collision detection.
 * Will flip to opposite side if preferred side doesn't have enough space.
 */
function calculatePosition(triggerRect: DOMRect, tooltipRect: DOMRect, preferredSide: TooltipSide, offset: number): Position {
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight,
  };

  // Calculate available space on each side
  const space = {
    top: triggerRect.top - VIEWPORT_PADDING,
    bottom: viewport.height - triggerRect.bottom - VIEWPORT_PADDING,
    left: triggerRect.left - VIEWPORT_PADDING,
    right: viewport.width - triggerRect.right - VIEWPORT_PADDING,
  };

  // Determine actual side based on available space
  let actualSide = preferredSide;
  const tooltipWidth = tooltipRect.width;
  const tooltipHeight = tooltipRect.height;

  // Check if preferred side has enough space, flip if not
  if (preferredSide === 'top' && space.top < tooltipHeight + offset) {
    actualSide = space.bottom >= tooltipHeight + offset ? 'bottom' : 'top';
  } else if (preferredSide === 'bottom' && space.bottom < tooltipHeight + offset) {
    actualSide = space.top >= tooltipHeight + offset ? 'top' : 'bottom';
  } else if (preferredSide === 'left' && space.left < tooltipWidth + offset) {
    actualSide = space.right >= tooltipWidth + offset ? 'right' : 'left';
  } else if (preferredSide === 'right' && space.right < tooltipWidth + offset) {
    actualSide = space.left >= tooltipWidth + offset ? 'left' : 'right';
  }

  // Calculate base position
  let x: number;
  let y: number;

  switch (actualSide) {
    case 'top':
      x = triggerRect.left + triggerRect.width / 2 - tooltipWidth / 2;
      y = triggerRect.top - tooltipHeight - offset;
      break;
    case 'bottom':
      x = triggerRect.left + triggerRect.width / 2 - tooltipWidth / 2;
      y = triggerRect.bottom + offset;
      break;
    case 'left':
      x = triggerRect.left - tooltipWidth - offset;
      y = triggerRect.top + triggerRect.height / 2 - tooltipHeight / 2;
      break;
    case 'right':
      x = triggerRect.right + offset;
      y = triggerRect.top + triggerRect.height / 2 - tooltipHeight / 2;
      break;
  }

  // Clamp horizontal position to viewport
  if (actualSide === 'top' || actualSide === 'bottom') {
    const minX = VIEWPORT_PADDING;
    const maxX = viewport.width - tooltipWidth - VIEWPORT_PADDING;
    x = Math.max(minX, Math.min(maxX, x));
  }

  // Clamp vertical position to viewport
  if (actualSide === 'left' || actualSide === 'right') {
    const minY = VIEWPORT_PADDING;
    const maxY = viewport.height - tooltipHeight - VIEWPORT_PADDING;
    y = Math.max(minY, Math.min(maxY, y));
  }

  return { x, y, actualSide };
}

/**
 * Context-aware tooltip that automatically repositions to avoid viewport edges.
 * Uses portal rendering to escape overflow constraints.
 */
function Tooltip({ content, children, side = 'top', delayMs = DEFAULT_DELAY, offset = DEFAULT_OFFSET, className, disabled = false }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Calculate initial position based on estimated tooltip size
  const calculateInitialPosition = useCallback(() => {
    if (!triggerRef.current) return null;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    // Estimate tooltip size for initial positioning (will be refined after render)
    const estimatedTooltipRect = { width: 100, height: 32 } as DOMRect;
    return calculatePosition(triggerRect, estimatedTooltipRect, side, offset);
  }, [side, offset]);

  // Refine position after tooltip renders with actual dimensions
  useLayoutEffect(() => {
    if (isVisible && tooltipRef.current && triggerRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const refinedPosition = calculatePosition(triggerRect, tooltipRect, side, offset);

      // Only update if position actually changed to avoid unnecessary re-renders
      setPosition((prev) => {
        if (prev?.x !== refinedPosition.x || prev?.y !== refinedPosition.y) {
          return refinedPosition;
        }
        return prev;
      });
    }
  }, [isVisible, content, side, offset]);

  const showTooltip = useCallback(() => {
    if (disabled) return;

    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      // Calculate position BEFORE showing (like Menu/Select pattern)
      const initialPosition = calculateInitialPosition();
      if (initialPosition) {
        setPosition(initialPosition);
        setIsVisible(true);
      }
    }, delayMs);
  }, [delayMs, disabled, calculateInitialPosition]);

  const hideTooltip = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
    setPosition(null);
  }, []);

  // Cleanup timeout on unmount
  useLayoutEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Animation origin based on actual side
  const getTransformOrigin = (actualSide: TooltipSide) => {
    switch (actualSide) {
      case 'top':
        return 'bottom center';
      case 'bottom':
        return 'top center';
      case 'left':
        return 'right center';
      case 'right':
        return 'left center';
    }
  };

  return (
    <>
      <div ref={triggerRef} className="inline-flex" onMouseEnter={showTooltip} onMouseLeave={hideTooltip} onFocus={showTooltip} onBlur={hideTooltip}>
        {children}
      </div>
      {isVisible &&
        position &&
        createPortal(
          <div
            ref={tooltipRef}
            role="tooltip"
            style={{
              position: 'fixed',
              left: position.x,
              top: position.y,
              transformOrigin: getTransformOrigin(position.actualSide),
            }}
            className={cn(
              'z-9999 px-3 py-2 rounded-xl text-sm font-medium',
              'bg-inverse-surface text-inverse-on-surface border-2 border-inverse-surface',
              'pointer-events-none whitespace-nowrap',
              'animate-in fade-in-0 zoom-in-95 duration-150',
              className
            )}
          >
            {content}
          </div>,
          document.body
        )}
    </>
  );
}

// Divider component
interface DividerProps extends HTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
  orientation?: 'horizontal' | 'vertical';
}

function Divider({ className, orientation = 'horizontal', ref, ...props }: DividerProps) {
  return (
    <div
      ref={ref}
      role="separator"
      aria-orientation={orientation}
      className={cn('bg-outline-variant', orientation === 'horizontal' ? 'h-px w-full' : 'w-px h-full', className)}
      {...props}
    />
  );
}

export { Tooltip, Divider };
