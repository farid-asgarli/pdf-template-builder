'use client';

import { ImageIcon, FileCode2 } from 'lucide-react';
import type { Component, ImageProperties, ImageFitMode } from '@/lib/types/document.types';

interface ImageComponentProps {
  component: Component;
}

/**
 * Maps QuestPDF fitMode values to CSS object-fit values for preview.
 */
function mapFitModeToCss(fitMode: ImageFitMode): React.CSSProperties['objectFit'] {
  switch (fitMode) {
    case 'fitWidth':
    case 'fitHeight':
    case 'fitArea':
      return 'contain';
    case 'fitUnproportionally':
      return 'fill';
    default:
      return 'contain';
  }
}

export function ImageComponent({ component }: ImageComponentProps) {
  const props = component.properties as ImageProperties;
  const isSvg = props.imageType === 'svg';

  // If no image source, show placeholder
  if (!props.src) {
    return (
      <div className="pointer-events-none flex h-full w-full flex-col items-center justify-center rounded border border-dashed border-outline-variant bg-surface-container-lowest">
        {isSvg ? (
          <FileCode2 className="mb-1 h-6 w-6 text-on-surface-variant/50" />
        ) : (
          <ImageIcon className="mb-1 h-6 w-6 text-on-surface-variant/50" />
        )}
        <span className="text-[10px] text-on-surface-variant/50">{isSvg ? 'No SVG' : 'No image'}</span>
      </div>
    );
  }

  // For SVG type with inline SVG content (starts with < or <?xml), render as SVG
  if (isSvg && (props.src.trimStart().startsWith('<') || props.src.trimStart().startsWith('<?xml'))) {
    return (
      <div
        className="pointer-events-none h-full w-full overflow-hidden [&>svg]:h-full [&>svg]:w-full"
        dangerouslySetInnerHTML={{ __html: props.src }}
      />
    );
  }

  // Render image (works for URLs, base64 data URIs, and file paths)
  return (
    <div className="pointer-events-none h-full w-full overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={props.src} alt={props.alt || 'Image'} className="h-full w-full" style={{ objectFit: mapFitModeToCss(props.fitMode) }} />
    </div>
  );
}
