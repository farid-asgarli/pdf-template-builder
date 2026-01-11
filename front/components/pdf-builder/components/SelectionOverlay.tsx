'use client';

import { memo, useCallback } from 'react';

// Resize direction type
export type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'nw' | 'ne' | 'sw' | 'se';

interface SelectionOverlayProps {
  isSelected: boolean;
  isHovered: boolean;
  isDragging: boolean;
  isResizing: boolean;
  resizeDirection?: ResizeDirection | null;
  /** Size in mm - shown during resize */
  size?: { width: number; height: number };
  onResizeStart: (e: React.MouseEvent, direction: ResizeDirection) => void;
}

/**
 * Figma-style selection overlay with resize handles
 *
 * Features:
 * - Clean 1px selection border
 * - Corner resize handles (small white squares with blue border)
 * - Edge resize handles (smaller, always visible when selected)
 * - Subtle hover state
 * - Size indicator during resize
 * - Drag opacity feedback
 */
export const SelectionOverlay = memo(function SelectionOverlay({
  isSelected,
  isHovered,
  isDragging,
  isResizing,
  resizeDirection,
  size,
  onResizeStart,
}: SelectionOverlayProps) {
  return (
    <>
      {/* Selection/Hover border */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          // Figma uses a 1px blue border for selection
          boxShadow: isSelected
            ? '0 0 0 1.5px #0d99ff' // Blue selection border
            : isHovered && !isDragging
            ? '0 0 0 1px #0d99ff50' // Subtle hover border
            : 'none',
          borderRadius: 1,
          transition: isDragging ? 'none' : 'box-shadow 0.1s ease-out',
        }}
      />

      {/* Drag state overlay */}
      {isDragging && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundColor: 'rgba(13, 153, 255, 0.04)',
            borderRadius: 1,
          }}
        />
      )}

      {/* Size indicator - shows during resize */}
      {isResizing && size && <SizeIndicator width={size.width} height={size.height} direction={resizeDirection} />}

      {/* Resize handles container - only when selected and not dragging */}
      {isSelected && !isDragging && (
        <>
          {/* Corner handles - always visible when selected */}
          <CornerHandle position="nw" onResizeStart={onResizeStart} />
          <CornerHandle position="ne" onResizeStart={onResizeStart} />
          <CornerHandle position="sw" onResizeStart={onResizeStart} />
          <CornerHandle position="se" onResizeStart={onResizeStart} />

          {/* Edge handles - always visible when selected */}
          <EdgeHandle position="n" onResizeStart={onResizeStart} />
          <EdgeHandle position="s" onResizeStart={onResizeStart} />
          <EdgeHandle position="e" onResizeStart={onResizeStart} />
          <EdgeHandle position="w" onResizeStart={onResizeStart} />
        </>
      )}
    </>
  );
});

/**
 * Size indicator tooltip - appears during resize
 * Shows current dimensions in mm
 */
interface SizeIndicatorProps {
  width: number;
  height: number;
  direction?: ResizeDirection | null;
}

const SizeIndicator = memo(function SizeIndicator({ width, height, direction }: SizeIndicatorProps) {
  // Position the indicator based on resize direction
  const getPosition = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: 'absolute',
      transform: 'translateX(-50%)',
    };

    // Place indicator near the resize handle being used
    switch (direction) {
      case 'n':
      case 'nw':
      case 'ne':
        return { ...base, top: -28, left: '50%' };
      case 's':
      case 'sw':
      case 'se':
        return { ...base, bottom: -28, left: '50%' };
      case 'e':
        return { ...base, right: -60, top: '50%', transform: 'translateY(-50%)' };
      case 'w':
        return { ...base, left: -60, top: '50%', transform: 'translateY(-50%)' };
      default:
        return { ...base, bottom: -28, left: '50%' };
    }
  };

  return (
    <div className="pointer-events-none z-50" style={getPosition()}>
      <div
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: '#ffffff',
          fontSize: 11,
          fontWeight: 500,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '4px 8px',
          borderRadius: 4,
          whiteSpace: 'nowrap',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
        }}
      >
        {width.toFixed(1)} × {height.toFixed(1)} mm
      </div>
    </div>
  );
});

/**
 * Corner resize handle - Figma style
 * Small white square with blue border
 */
interface CornerHandleProps {
  position: 'nw' | 'ne' | 'sw' | 'se';
  onResizeStart: (e: React.MouseEvent, direction: ResizeDirection) => void;
}

const HANDLE_SIZE = 8;
const HANDLE_OFFSET = -HANDLE_SIZE / 2; // -4px to center on corner

const CornerHandle = memo(function CornerHandle({ position, onResizeStart }: CornerHandleProps) {
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onResizeStart(e, position);
    },
    [position, onResizeStart]
  );

  // Position handles centered on corners using negative offsets
  const positionStyles: Record<string, React.CSSProperties> = {
    nw: { top: HANDLE_OFFSET, left: HANDLE_OFFSET, cursor: 'nw-resize' },
    ne: { top: HANDLE_OFFSET, right: HANDLE_OFFSET, cursor: 'ne-resize' },
    sw: { bottom: HANDLE_OFFSET, left: HANDLE_OFFSET, cursor: 'sw-resize' },
    se: { bottom: HANDLE_OFFSET, right: HANDLE_OFFSET, cursor: 'se-resize' },
  };

  return (
    <div
      className="absolute z-20 pointer-events-auto"
      style={{
        ...positionStyles[position],
        width: HANDLE_SIZE,
        height: HANDLE_SIZE,
        backgroundColor: '#ffffff',
        border: '1.5px solid #0d99ff',
        borderRadius: 1,
        boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)',
        transition: 'transform 0.1s ease-out',
      }}
      onMouseDown={handleMouseDown}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseOver={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'scale(1.2)';
      }}
      onMouseOut={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
      }}
    />
  );
});

/**
 * Edge resize handle
 * Smaller rectangular handle for edge resizing
 */
interface EdgeHandleProps {
  position: 'n' | 's' | 'e' | 'w';
  onResizeStart: (e: React.MouseEvent, direction: ResizeDirection) => void;
}

const EDGE_HANDLE_LENGTH = 12;
const EDGE_HANDLE_THICKNESS = 6;

const EdgeHandle = memo(function EdgeHandle({ position, onResizeStart }: EdgeHandleProps) {
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onResizeStart(e, position);
    },
    [position, onResizeStart]
  );

  const isHorizontalEdge = position === 'n' || position === 's';
  const width = isHorizontalEdge ? EDGE_HANDLE_LENGTH : EDGE_HANDLE_THICKNESS;
  const height = isHorizontalEdge ? EDGE_HANDLE_THICKNESS : EDGE_HANDLE_LENGTH;

  // Position handles at edge midpoints, centered on the edge
  const positionStyles: Record<string, React.CSSProperties> = {
    n: { top: -height / 2, left: '50%', marginLeft: -width / 2, cursor: 'ns-resize' },
    s: { bottom: -height / 2, left: '50%', marginLeft: -width / 2, cursor: 'ns-resize' },
    e: { right: -width / 2, top: '50%', marginTop: -height / 2, cursor: 'ew-resize' },
    w: { left: -width / 2, top: '50%', marginTop: -height / 2, cursor: 'ew-resize' },
  };

  return (
    <div
      className="absolute z-20 pointer-events-auto"
      style={{
        ...positionStyles[position],
        width,
        height,
        backgroundColor: '#ffffff',
        border: '1.5px solid #0d99ff',
        borderRadius: 2,
        boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)',
        transition: 'transform 0.1s ease-out',
      }}
      onMouseDown={handleMouseDown}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseOver={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'scale(1.2)';
      }}
      onMouseOut={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
      }}
    />
  );
});

// Export cursor map for use during resize operations
export const RESIZE_CURSORS: Record<ResizeDirection, string> = {
  n: 'ns-resize',
  s: 'ns-resize',
  e: 'ew-resize',
  w: 'ew-resize',
  nw: 'nwse-resize',
  se: 'nwse-resize',
  ne: 'nesw-resize',
  sw: 'nesw-resize',
};
