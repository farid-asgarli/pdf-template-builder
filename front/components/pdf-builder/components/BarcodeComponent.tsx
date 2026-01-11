'use client';

import { QrCode, Barcode } from 'lucide-react';
import type { Component, BarcodeProperties, BarcodeType } from '@/lib/types/document.types';

interface BarcodeComponentProps {
  component: Component;
}

/**
 * Checks if the barcode type is a 1D (linear) barcode.
 */
function is1DBarcode(type: BarcodeType): boolean {
  return ['ean-13', 'ean-8', 'upc-a', 'upc-e', 'code-128', 'code-39', 'code-93', 'codabar', 'itf'].includes(type);
}

/**
 * Gets a user-friendly label for the barcode type.
 */
function getBarcodeTypeLabel(type: BarcodeType): string {
  const labels: Record<BarcodeType, string> = {
    'ean-13': 'EAN-13',
    'ean-8': 'EAN-8',
    'upc-a': 'UPC-A',
    'upc-e': 'UPC-E',
    'code-128': 'Code 128',
    'code-39': 'Code 39',
    'code-93': 'Code 93',
    codabar: 'Codabar',
    itf: 'ITF',
    'qr-code': 'QR Code',
    'data-matrix': 'Data Matrix',
    aztec: 'Aztec',
    'pdf-417': 'PDF 417',
  };
  return labels[type] || type;
}

/**
 * Renders a preview representation of a barcode component on the canvas.
 * The actual barcode is generated server-side by QuestPDF/ZXing.
 * This component shows a visual placeholder that indicates the barcode type and value.
 */
export function BarcodeComponent({ component }: BarcodeComponentProps) {
  const props = component.properties as BarcodeProperties;
  const is1D = is1DBarcode(props.barcodeType);
  const hasValue = props.value.trim().length > 0;

  // If no value, show empty placeholder
  if (!hasValue) {
    return (
      <div
        className="pointer-events-none flex h-full w-full flex-col items-center justify-center rounded border border-dashed"
        style={{
          borderColor: props.foregroundColor + '40',
          backgroundColor: props.backgroundColor,
        }}
      >
        {is1D ? (
          <Barcode className="mb-1 h-6 w-6" style={{ color: props.foregroundColor + '50' }} />
        ) : (
          <QrCode className="mb-1 h-6 w-6" style={{ color: props.foregroundColor + '50' }} />
        )}
        <span className="text-[10px]" style={{ color: props.foregroundColor + '50' }}>
          {getBarcodeTypeLabel(props.barcodeType)}
        </span>
      </div>
    );
  }

  // Render a visual preview
  return (
    <div
      className="pointer-events-none flex h-full w-full flex-col items-center justify-center overflow-hidden"
      style={{
        backgroundColor: props.backgroundColor,
        padding: `${props.quietZone}px`,
      }}
    >
      {is1D ? (
        // 1D Barcode preview - vertical bars pattern
        <div className="flex h-full w-full flex-col items-center justify-center">
          <div className="flex h-3/4 w-full items-end justify-center gap-px">
            {/* Generate a simple bar pattern to simulate barcode */}
            {Array.from({ length: Math.min(40, Math.max(20, props.value.length * 3)) }).map((_, i) => {
              // Create a pseudo-random width based on index and value
              const charCode = props.value.charCodeAt(i % props.value.length) || 0;
              const width = ((charCode + i) % 3) + 1;
              const show = (charCode + i) % 4 !== 0;
              return (
                <div
                  key={i}
                  className="h-full"
                  style={{
                    width: `${width}px`,
                    backgroundColor: show ? props.foregroundColor : props.backgroundColor,
                  }}
                />
              );
            })}
          </div>
          {props.showValue && (
            <div
              className="mt-1 truncate text-center"
              style={{
                fontSize: `${Math.min(props.valueFontSize, 12)}px`,
                fontFamily: props.valueFontFamily,
                color: props.foregroundColor,
                maxWidth: '100%',
              }}
            >
              {props.value}
            </div>
          )}
        </div>
      ) : (
        // 2D Barcode preview - QR-like grid pattern
        <div className="flex h-full w-full flex-col items-center justify-center">
          <div
            className="grid aspect-square"
            style={{
              gridTemplateColumns: 'repeat(7, 1fr)',
              gridTemplateRows: 'repeat(7, 1fr)',
              gap: '1px',
              width: 'min(100%, calc(100% - 16px))',
              maxWidth: '80%',
              maxHeight: '80%',
            }}
          >
            {/* Generate QR-like pattern with finder patterns in corners */}
            {Array.from({ length: 49 }).map((_, i) => {
              const row = Math.floor(i / 7);
              const col = i % 7;

              // Finder pattern corners (top-left, top-right, bottom-left)
              const isFinderCorner = (row < 2 && col < 2) || (row < 2 && col > 4) || (row > 4 && col < 2);

              // Create pattern based on value
              const charCode = props.value.charCodeAt(i % props.value.length) || 0;
              const isFilled = isFinderCorner || (charCode + i) % 3 === 0;

              return (
                <div
                  key={i}
                  style={{
                    backgroundColor: isFilled ? props.foregroundColor : props.backgroundColor,
                    border: `0.5px solid ${props.foregroundColor}20`,
                  }}
                />
              );
            })}
          </div>
          <div
            className="mt-1 truncate text-center text-[9px]"
            style={{
              color: props.foregroundColor + '80',
              maxWidth: '100%',
            }}
          >
            {getBarcodeTypeLabel(props.barcodeType)}
          </div>
        </div>
      )}
    </div>
  );
}
