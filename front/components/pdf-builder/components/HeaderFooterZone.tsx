'use client';

import { useMemo } from 'react';
import { Settings2 } from 'lucide-react';
import { IconButton, Tooltip } from '@/app/ui/primitives';
import { mmToPx, CANVAS_WIDTH_PX } from '@/lib/utils/coordinates';
import type { HeaderFooterContent, HeaderFooterType } from '@/lib/types/document.types';

interface HeaderFooterZoneProps {
  type: 'header' | 'footer';
  content: HeaderFooterContent | null;
  headerFooterType: HeaderFooterType;
  pageNumber: number;
  totalPages: number;
  variables?: Record<string, string>;
  onEdit?: () => void;
}

// System variables that can be used in header/footer
const SYSTEM_VARIABLES: Record<string, (pageNumber: number, totalPages: number) => string> = {
  '{{pageNumber}}': (pageNumber) => String(pageNumber),
  '{{totalPages}}': (_, totalPages) => String(totalPages),
  '{{date}}': () => new Date().toLocaleDateString(),
  '{{year}}': () => String(new Date().getFullYear()),
};

/**
 * Replace variables in text with their actual values
 */
function substituteVariables(text: string, pageNumber: number, totalPages: number, customVariables?: Record<string, string>): string {
  let result = text;

  // Replace system variables
  Object.entries(SYSTEM_VARIABLES).forEach(([key, getValue]) => {
    result = result.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), getValue(pageNumber, totalPages));
  });

  // Replace custom variables
  if (customVariables) {
    Object.entries(customVariables).forEach(([key, value]) => {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    });
  }

  return result;
}

/**
 * HeaderFooterZone - Visual representation of header or footer area on the canvas
 * Displays content with variable substitution and edit controls
 */
export function HeaderFooterZone({ type, content, headerFooterType, pageNumber, totalPages, variables = {}, onEdit }: HeaderFooterZoneProps) {
  // Process text content from components - moved before early return to satisfy hooks rules
  const textContent = useMemo(() => {
    if (!content) return [];

    const textComponents = content.components.filter((c) => c.type === 'text-label' || c.type === 'paragraph');

    return textComponents.map((comp) => {
      const rawText = 'content' in comp.properties ? (comp.properties as { content?: string }).content || '' : '';
      return {
        id: comp.id,
        text: substituteVariables(rawText, pageNumber, totalPages, variables),
        properties: comp.properties,
        position: comp.position,
        size: comp.size,
      };
    });
  }, [content, pageNumber, totalPages, variables]);

  // If type is 'none', don't render anything
  if (headerFooterType === 'none' || !content) {
    return null;
  }

  const heightPx = mmToPx(content.height);

  // Determine background color based on type
  const bgColor = type === 'header' ? 'bg-primary/5' : 'bg-secondary/5';
  const borderColor = type === 'header' ? 'border-primary/20' : 'border-secondary/20';

  const isEmpty = content.components.length === 0;

  return (
    <div
      className={`relative ${bgColor} ${borderColor} border-b ${type === 'footer' ? 'border-t border-b-0' : ''}`}
      style={{
        width: CANVAS_WIDTH_PX,
        height: heightPx,
        minHeight: 30,
      }}
    >
      {/* Zone label */}
      <div className="absolute left-2 top-1 flex items-center gap-1.5">
        <span className="text-[10px] font-medium uppercase tracking-wide text-on-surface-variant/60">
          {type === 'header' ? 'Header' : 'Footer'}
          {headerFooterType !== 'default' && <span className="ml-1 text-[9px] text-primary/60">({headerFooterType})</span>}
        </span>
      </div>

      {/* Edit button */}
      {onEdit && (
        <div className="absolute right-2 top-1 z-10">
          <Tooltip content={`Edit ${type}`}>
            <IconButton
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              aria-label={`Edit ${type}`}
              icon={<Settings2 className="h-3.5 w-3.5" />}
            />
          </Tooltip>
        </div>
      )}

      {/* Content preview */}
      <div className="absolute inset-x-4 inset-y-5 flex items-center justify-center">
        {isEmpty ? (
          <span className="text-xs text-on-surface-variant/40 italic">Click to add {type} content</span>
        ) : (
          <div className="flex h-full w-full items-center">
            {textContent.map((item) => (
              <div
                key={item.id}
                className="text-sm text-on-surface"
                style={{
                  position: 'absolute',
                  left: mmToPx(item.position.x),
                  top: mmToPx(item.position.y),
                  width: mmToPx(item.size.width),
                  fontSize: 'fontSize' in item.properties ? `${item.properties.fontSize}px` : '12px',
                  textAlign: 'textAlign' in item.properties ? (item.properties.textAlign as 'left' | 'center' | 'right') : 'left',
                }}
              >
                {item.text}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Default content for empty headers/footers */}
      {isEmpty && type === 'footer' && (
        <div className="absolute inset-x-0 bottom-2 text-center text-xs text-on-surface-variant/50">
          Page {pageNumber} of {totalPages}
        </div>
      )}
    </div>
  );
}
