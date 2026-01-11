'use client';

import type { Component, SignatureBoxProperties } from '@/lib/types/document.types';

interface SignatureBoxProps {
  component: Component;
}

/**
 * Maps font weight string values to CSS font-weight numeric values.
 */
function getFontWeight(weight: string): number {
  const weights: Record<string, number> = {
    thin: 100,
    extralight: 200,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  };
  return weights[weight] ?? 400;
}

export function SignatureBox({ component }: SignatureBoxProps) {
  const props = component.properties as SignatureBoxProperties;

  return (
    <div className="pointer-events-none flex h-full w-full flex-col justify-end" style={{ gap: `${props.spacingBetweenElements}px` }}>
      {/* Signature area with line */}
      {props.showLine ? (
        <div
          className="w-full"
          style={{
            minHeight: `${props.signatureAreaHeight}px`,
            display: 'flex',
            alignItems: 'flex-end',
          }}
        >
          <div
            className="w-full"
            style={{
              height: `${props.lineThickness}px`,
              backgroundColor: props.lineColor,
            }}
          />
        </div>
      ) : (
        <div style={{ minHeight: `${props.signatureAreaHeight}px` }} />
      )}

      {/* Signer info row */}
      <div className="flex items-start justify-between" style={{ paddingTop: `${props.spacingBetweenElements}px` }}>
        {/* Signer name and title column */}
        <div className="flex flex-col">
          <p
            style={{
              fontSize: `${props.signerNameFontSize}px`,
              color: props.signerNameColor,
              fontWeight: getFontWeight(props.signerNameFontWeight),
              lineHeight: 1.2,
            }}
          >
            {props.signerName || 'Signer Name'}
          </p>
          {props.signerTitle && (
            <p
              style={{
                fontSize: `${props.signerTitleFontSize}px`,
                color: props.signerTitleColor,
                lineHeight: 1.2,
              }}
            >
              {props.signerTitle}
            </p>
          )}
        </div>

        {/* Date section */}
        {props.dateRequired && (
          <div className="flex flex-col items-end">
            {/* Date line */}
            <div
              style={{
                width: `${props.dateLineWidth}px`,
                height: `${props.lineThickness}px`,
                backgroundColor: props.lineColor,
              }}
            />
            {/* Date label */}
            <p
              style={{
                fontSize: `${props.dateLabelFontSize}px`,
                color: props.dateLabelColor,
                paddingTop: `${props.spacingBetweenElements}px`,
                lineHeight: 1.2,
              }}
            >
              {props.dateLabel}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
