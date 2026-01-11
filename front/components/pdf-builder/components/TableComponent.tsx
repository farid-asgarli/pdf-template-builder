'use client';

import type { Component, TableProperties, VerticalAlign } from '@/lib/types/document.types';

interface TableComponentProps {
  component: Component;
}

export function TableComponent({ component }: TableComponentProps) {
  const props = component.properties as TableProperties;

  // Get column count from definitions or fallback
  const columnCount = props.columnDefinitions?.length || props.headers?.length || 3;

  // Helper to get alignment class for a column
  const getAlignmentClass = (index: number): string => {
    const align = props.columnDefinitions?.[index]?.align || 'left';
    switch (align) {
      case 'center':
        return 'text-center';
      case 'right':
        return 'text-right';
      default:
        return 'text-left';
    }
  };

  // Helper to get vertical alignment style
  const getVerticalAlignStyle = (align: VerticalAlign = 'middle'): string => {
    switch (align) {
      case 'top':
        return 'top';
      case 'bottom':
        return 'bottom';
      default:
        return 'middle';
    }
  };

  // Calculate column widths for CSS
  const getColumnWidths = (): string[] => {
    if (!props.columnDefinitions || props.columnDefinitions.length === 0) {
      // Equal width for all columns
      return Array(columnCount).fill(`${100 / columnCount}%`);
    }

    // Calculate total relative width
    const totalRelative = props.columnDefinitions.filter((col) => col.type === 'relative').reduce((sum, col) => sum + col.width, 0);

    // Calculate total constant width (assuming points, roughly estimate for preview)
    const constantCols = props.columnDefinitions.filter((col) => col.type === 'constant');
    const hasConstants = constantCols.length > 0;

    if (!hasConstants) {
      // All relative - calculate percentages
      return props.columnDefinitions.map((col) => `${(col.width / totalRelative) * 100}%`);
    }

    // Mixed - use fr units approximation
    return props.columnDefinitions.map((col) => {
      if (col.type === 'constant') {
        return `${col.width}px`;
      }
      return `${col.width}fr`;
    });
  };

  // Get border style for cells based on borderStyle property
  const getCellBorderStyle = (isHeader: boolean): React.CSSProperties => {
    const borderStyle = props.borderStyle || 'all';
    const borderWidth = props.borderWidth ?? 1;
    const borderColor = props.borderColor || '#000000';

    if (borderWidth <= 0 || borderStyle === 'none') {
      return {};
    }

    switch (borderStyle) {
      case 'all':
        return { border: `${borderWidth}px solid ${borderColor}` };
      case 'header':
        if (isHeader) {
          const headerBorderWidth = props.headerBorderBottomWidth || borderWidth;
          const headerBorderColor = props.headerBorderBottomColor || borderColor;
          return { borderBottom: `${headerBorderWidth}px solid ${headerBorderColor}` };
        }
        return {};
      case 'horizontal':
        return {
          borderTop: `${borderWidth}px solid ${borderColor}`,
          borderBottom: `${borderWidth}px solid ${borderColor}`,
        };
      case 'vertical':
        return {
          borderLeft: `${borderWidth}px solid ${borderColor}`,
          borderRight: `${borderWidth}px solid ${borderColor}`,
        };
      default:
        return {};
    }
  };

  const columnWidths = getColumnWidths();

  // Limit data rows to prevent performance issues in preview
  const maxPreviewRows = 5;
  const displayData = props.data?.slice(0, maxPreviewRows) || [];

  // Get font weight value
  const getFontWeight = (weight: string | undefined): number | string => {
    if (!weight) return 'normal';
    switch (weight) {
      case 'thin':
        return 100;
      case 'extralight':
        return 200;
      case 'light':
        return 300;
      case 'normal':
        return 400;
      case 'medium':
        return 500;
      case 'semibold':
        return 600;
      case 'bold':
        return 700;
      case 'extrabold':
        return 800;
      case 'black':
        return 900;
      default:
        return 'normal';
    }
  };

  return (
    <div className="pointer-events-none h-full w-full overflow-hidden">
      <table
        className="h-full w-full border-collapse"
        style={{
          fontSize: `${props.cellFontSize || 10}px`,
          color: props.cellTextColor || '#000000',
        }}
      >
        <colgroup>
          {columnWidths.map((width, i) => (
            <col key={i} style={{ width }} />
          ))}
        </colgroup>

        {/* Header row */}
        {props.showHeader !== false && props.headers && props.headers.length > 0 && (
          <thead>
            <tr>
              {props.headers.slice(0, columnCount).map((header, i) => (
                <th
                  key={i}
                  className={`truncate ${getAlignmentClass(i)}`}
                  style={{
                    ...getCellBorderStyle(true),
                    backgroundColor: props.headerBackground || '#f0f0f0',
                    color: props.headerTextColor || '#000000',
                    paddingTop: `${props.headerPaddingVertical ?? 8}px`,
                    paddingBottom: `${props.headerPaddingVertical ?? 8}px`,
                    paddingLeft: `${props.headerPaddingHorizontal ?? 10}px`,
                    paddingRight: `${props.headerPaddingHorizontal ?? 10}px`,
                    fontSize: `${props.headerFontSize || 10}px`,
                    fontWeight: getFontWeight(props.headerFontWeight),
                    verticalAlign: getVerticalAlignStyle(props.headerVerticalAlign),
                  }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
        )}

        {/* Data rows */}
        <tbody>
          {displayData.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: columnCount }).map((_, cellIndex) => {
                const cellValue = row[cellIndex] || '';
                const isEvenRow = rowIndex % 2 === 0;
                const backgroundColor = props.alternateRowColors
                  ? isEvenRow
                    ? props.evenRowBackground || '#ffffff'
                    : props.oddRowBackground || '#f9f9f9'
                  : undefined;

                return (
                  <td
                    key={cellIndex}
                    className={`truncate ${getAlignmentClass(cellIndex)}`}
                    style={{
                      ...getCellBorderStyle(false),
                      paddingTop: `${props.cellPaddingVertical ?? 5}px`,
                      paddingBottom: `${props.cellPaddingVertical ?? 5}px`,
                      paddingLeft: `${props.cellPaddingHorizontal ?? 10}px`,
                      paddingRight: `${props.cellPaddingHorizontal ?? 10}px`,
                      backgroundColor,
                      color: props.cellTextColor || '#000000',
                      fontWeight: getFontWeight(props.cellFontWeight),
                      verticalAlign: getVerticalAlignStyle(props.cellVerticalAlign),
                    }}
                  >
                    {cellValue || '—'}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
