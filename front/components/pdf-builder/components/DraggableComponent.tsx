'use client';

import { useState, useCallback, useRef, useEffect, memo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { mmToPx, pxToMm } from '@/lib/utils/coordinates';
import { useDocumentStore } from '@/lib/store/documentStore';
import type { Component, ComponentType as ComponentTypeEnum } from '@/lib/types/document.types';

import { TextLabel } from './TextLabel';
import { TextField } from './TextField';
import { SignatureBox } from './SignatureBox';
import { DateField } from './DateField';
import { Checkbox } from './Checkbox';
import { TableComponent } from './TableComponent';
import { ImageComponent } from './ImageComponent';
import { Paragraph } from './Paragraph';
import { Divider } from './Divider';
import { BarcodeComponent } from './BarcodeComponent';
import { PlaceholderComponent, UnknownComponentPlaceholder } from './PlaceholderComponent';
import { SelectionOverlay, RESIZE_CURSORS, type ResizeDirection } from './SelectionOverlay';

interface DraggableComponentProps {
  component: Component;
  isSelected: boolean;
  onSelect: (componentId: string) => void;
}

// Map component types to their renderer components
const COMPONENT_RENDERERS: Record<ComponentTypeEnum, React.ComponentType<{ component: Component }>> = {
  'text-label': TextLabel,
  'text-field': TextField,
  'signature-box': SignatureBox,
  'date-field': DateField,
  checkbox: Checkbox,
  table: TableComponent,
  image: ImageComponent,
  paragraph: Paragraph,
  divider: Divider,
  barcode: BarcodeComponent,
  placeholder: PlaceholderComponent,
};

// Minimum sizes in mm
const MIN_WIDTH_MM = 10;
const MIN_HEIGHT_MM = 5;

// Component types that support inline text editing
const INLINE_EDITABLE_TYPES: Set<ComponentTypeEnum> = new Set(['text-label', 'paragraph']);

export const DraggableComponent = memo(function DraggableComponent({ component, isSelected, onSelect }: DraggableComponentProps) {
  const { updateComponent } = useDocumentStore();

  // UI states
  const [isHovered, setIsHovered] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<ResizeDirection | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Resize data ref for tracking resize operation
  const resizeDataRef = useRef<{
    startMouseX: number;
    startMouseY: number;
    startWidth: number;
    startHeight: number;
    startX: number;
    startY: number;
  } | null>(null);

  // Draggable hook - disabled when resizing or editing
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: component.id,
    data: {
      type: 'existing-component',
      component,
    },
    disabled: isResizing || isEditing,
  });

  // Start resize operation
  const startResize = useCallback(
    (e: React.MouseEvent, direction: ResizeDirection) => {
      e.preventDefault();
      e.stopPropagation();

      resizeDataRef.current = {
        startMouseX: e.clientX,
        startMouseY: e.clientY,
        startWidth: component.size.width,
        startHeight: component.size.height,
        startX: component.position.x,
        startY: component.position.y,
      };

      setResizeDirection(direction);
      setIsResizing(true);
    },
    [component.size.width, component.size.height, component.position.x, component.position.y]
  );

  // Global mouse handlers for resize
  useEffect(() => {
    if (!isResizing || !resizeDirection || !resizeDataRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();

      const data = resizeDataRef.current;
      if (!data) return;

      const deltaX = pxToMm(e.clientX - data.startMouseX);
      const deltaY = pxToMm(e.clientY - data.startMouseY);

      let newWidth = data.startWidth;
      let newHeight = data.startHeight;
      let newX = data.startX;
      let newY = data.startY;

      // Handle horizontal resize
      if (resizeDirection.includes('e')) {
        newWidth = Math.max(MIN_WIDTH_MM, data.startWidth + deltaX);
      } else if (resizeDirection.includes('w')) {
        const widthDelta = Math.min(deltaX, data.startWidth - MIN_WIDTH_MM);
        newWidth = data.startWidth - widthDelta;
        newX = data.startX + widthDelta;
      }

      // Handle vertical resize
      if (resizeDirection.includes('s')) {
        newHeight = Math.max(MIN_HEIGHT_MM, data.startHeight + deltaY);
      } else if (resizeDirection.includes('n')) {
        const heightDelta = Math.min(deltaY, data.startHeight - MIN_HEIGHT_MM);
        newHeight = data.startHeight - heightDelta;
        newY = data.startY + heightDelta;
      }

      // Clamp position to prevent going negative
      if (newX < 0) {
        newWidth = newWidth + newX;
        newX = 0;
      }
      if (newY < 0) {
        newHeight = newHeight + newY;
        newY = 0;
      }

      updateComponent(component.id, {
        size: { width: Math.max(MIN_WIDTH_MM, newWidth), height: Math.max(MIN_HEIGHT_MM, newHeight) },
        position: { x: Math.max(0, newX), y: Math.max(0, newY) },
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeDirection(null);
      resizeDataRef.current = null;
    };

    // Use capture phase to intercept events
    document.addEventListener('mousemove', handleMouseMove, { capture: true });
    document.addEventListener('mouseup', handleMouseUp, { capture: true });

    // Set cursor on body during resize
    document.body.style.cursor = RESIZE_CURSORS[resizeDirection];
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove, { capture: true });
      document.removeEventListener('mouseup', handleMouseUp, { capture: true });
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, resizeDirection, component.id, updateComponent]);

  // Exit edit mode when component is deselected
  useEffect(() => {
    if (!isSelected && isEditing) {
      setIsEditing(false);
    }
  }, [isSelected, isEditing]);

  // Check if this component type supports inline editing
  const supportsInlineEditing = INLINE_EDITABLE_TYPES.has(component.type);

  // Handle double-click to enter edit mode
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (supportsInlineEditing && isSelected) {
        e.preventDefault();
        e.stopPropagation();
        setIsEditing(true);
      }
    },
    [supportsInlineEditing, isSelected]
  );

  // Handle text save from inline editor
  const handleTextSave = useCallback(
    (value: string) => {
      updateComponent(component.id, {
        properties: { ...component.properties, content: value } as typeof component.properties,
      });
      setIsEditing(false);
    },
    [component.id, component.properties, updateComponent]
  );

  // Handle edit cancel
  const handleEditCancel = useCallback(() => {
    setIsEditing(false);
  }, []);

  const Renderer = COMPONENT_RENDERERS[component.type];

  // Fallback for unknown component types - render a placeholder with the type name
  const ComponentToRender = Renderer || (() => <UnknownComponentPlaceholder typeName={component.type} />);

  // Convert mm to px for display
  const left = mmToPx(component.position.x);
  const top = mmToPx(component.position.y);
  const width = mmToPx(component.size.width);
  const height = mmToPx(component.size.height);

  // Get custom styles from component
  const customStyle = component.style || {};

  // Position style
  const positionStyle: React.CSSProperties = {
    position: 'absolute',
    left,
    top,
    width,
    height,
    transform: isResizing ? undefined : CSS.Translate.toString(transform),
    zIndex: isDragging ? 1000 : isResizing ? 1001 : isSelected ? 100 : isHovered ? 50 : 1,
    touchAction: 'none',
  };

  // Content wrapper styles with custom styling
  const contentStyle: React.CSSProperties = {
    backgroundColor: customStyle.backgroundColor || 'transparent',
    borderColor: customStyle.borderWidth ? customStyle.borderColor || '#000000' : 'transparent',
    borderWidth: customStyle.borderWidth || 0,
    borderStyle: customStyle.borderWidth ? 'solid' : 'none',
    borderRadius: customStyle.borderRadius || 0,
    padding: customStyle.padding ? mmToPx(customStyle.padding) : 2,
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isResizing && !isEditing) {
      onSelect(component.id);
    }
  };

  // Render the appropriate component with editing props if supported
  const renderComponent = () => {
    // For inline editable components, pass editing props
    if (component.type === 'text-label') {
      return <TextLabel component={component} isEditing={isEditing} onTextSave={handleTextSave} onEditCancel={handleEditCancel} />;
    }
    if (component.type === 'paragraph') {
      return <Paragraph component={component} isEditing={isEditing} onTextSave={handleTextSave} onEditCancel={handleEditCancel} />;
    }
    // For other components, render normally
    const ComponentToRender = Renderer || (() => <UnknownComponentPlaceholder typeName={component.type} />);
    return <ComponentToRender component={component} />;
  };

  return (
    <div
      ref={setNodeRef}
      style={positionStyle}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-draggable-component='true'
      data-editing={isEditing || undefined}
    >
      {/* Draggable area - the component content */}
      <div
        className='absolute inset-0'
        style={{
          cursor: isEditing ? 'text' : isDragging ? 'grabbing' : isResizing ? RESIZE_CURSORS[resizeDirection!] : 'grab',
          opacity: isDragging ? 0.9 : 1,
        }}
        {...(isResizing || isEditing ? {} : listeners)}
        {...(isResizing || isEditing ? {} : attributes)}
      >
        {/* Component content with custom styling */}
        <div
          className={`relative h-full w-full ${isEditing ? 'overflow-visible' : 'overflow-hidden'} ${isEditing ? '' : 'pointer-events-none'}`}
          style={contentStyle}
        >
          {renderComponent()}
        </div>
      </div>

      {/* Selection overlay with resize handles - hidden during editing */}
      {!isEditing && (
        <SelectionOverlay
          isSelected={isSelected}
          isHovered={isHovered}
          isDragging={isDragging}
          isResizing={isResizing}
          resizeDirection={resizeDirection}
          size={component.size}
          onResizeStart={startResize}
        />
      )}

      {/* Edit mode indicator */}
      {isEditing && <div className='absolute inset-0 ring-2 ring-primary ring-offset-1 rounded-sm pointer-events-none' />}
    </div>
  );
});
