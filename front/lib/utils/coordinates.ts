// Coordinate conversion utilities for PDF Builder
// All internal storage uses millimeters (mm)
// Canvas display uses pixels (px) at 96 DPI

// A4 page dimensions in millimeters
export const A4_WIDTH_MM = 210;
export const A4_HEIGHT_MM = 297;

// Display DPI (standard screen resolution)
export const DISPLAY_DPI = 96;

// Conversion factors
// 1 inch = 25.4mm, so 1mm = DPI / 25.4 pixels
export const MM_TO_PX = DISPLAY_DPI / 25.4; // ~3.7795
export const PX_TO_MM = 25.4 / DISPLAY_DPI; // ~0.2646

// Canvas dimensions for A4 at 96 DPI
export const CANVAS_WIDTH_PX = Math.round(A4_WIDTH_MM * MM_TO_PX); // ~794px
export const CANVAS_HEIGHT_PX = Math.round(A4_HEIGHT_MM * MM_TO_PX); // ~1123px

// Default grid size in millimeters
export const DEFAULT_GRID_SIZE_MM = 5;
export const DEFAULT_SNAP_SIZE_MM = 1;

/**
 * Convert millimeters to pixels
 * @param mm - Value in millimeters
 * @returns Value in pixels
 */
export function mmToPx(mm: number): number {
  return mm * MM_TO_PX;
}

/**
 * Convert pixels to millimeters
 * @param px - Value in pixels
 * @returns Value in millimeters
 */
export function pxToMm(px: number): number {
  return px * PX_TO_MM;
}

/**
 * Snap a value to the nearest grid point
 * @param value - Value to snap (in mm or px depending on use)
 * @param gridSize - Grid size (default 1mm)
 * @returns Snapped value
 */
export function snapToGrid(value: number, gridSize: number = DEFAULT_SNAP_SIZE_MM): number {
  return Math.round(value / gridSize) * gridSize;
}

/**
 * Constrain a value within min/max bounds
 * @param value - Value to constrain
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Constrained value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Constrain X position within page bounds (accounting for component width)
 * @param x - X position in mm
 * @param width - Component width in mm
 * @returns Constrained X position
 */
export function clampX(x: number, width: number = 0): number {
  return clamp(x, 0, A4_WIDTH_MM - width);
}

/**
 * Constrain Y position within page bounds (accounting for component height)
 * @param y - Y position in mm
 * @param height - Component height in mm
 * @returns Constrained Y position
 */
export function clampY(y: number, height: number = 0): number {
  return clamp(y, 0, A4_HEIGHT_MM - height);
}

/**
 * Convert a position from pixels to millimeters and snap to grid
 * @param pxX - X position in pixels
 * @param pxY - Y position in pixels
 * @param gridSize - Grid size for snapping (default 1mm)
 * @returns Position in millimeters, snapped to grid
 */
export function pxPositionToMm(pxX: number, pxY: number, gridSize: number = DEFAULT_SNAP_SIZE_MM): { x: number; y: number } {
  return {
    x: snapToGrid(pxToMm(pxX), gridSize),
    y: snapToGrid(pxToMm(pxY), gridSize),
  };
}

/**
 * Convert a position from millimeters to pixels
 * @param mmX - X position in millimeters
 * @param mmY - Y position in millimeters
 * @returns Position in pixels
 */
export function mmPositionToPx(mmX: number, mmY: number): { x: number; y: number } {
  return {
    x: mmToPx(mmX),
    y: mmToPx(mmY),
  };
}

/**
 * Round a millimeter value to a reasonable precision (2 decimal places)
 * @param mm - Value in millimeters
 * @returns Rounded value
 */
export function roundMm(mm: number): number {
  return Math.round(mm * 100) / 100;
}

/**
 * Generate grid lines for canvas display
 * @param gridSizeMm - Grid size in millimeters
 * @returns Array of line positions in pixels
 */
export function generateGridLines(gridSizeMm: number = DEFAULT_GRID_SIZE_MM): {
  vertical: number[];
  horizontal: number[];
} {
  const gridSizePx = mmToPx(gridSizeMm);
  const vertical: number[] = [];
  const horizontal: number[] = [];

  // Generate vertical lines
  for (let x = gridSizePx; x < CANVAS_WIDTH_PX; x += gridSizePx) {
    vertical.push(x);
  }

  // Generate horizontal lines
  for (let y = gridSizePx; y < CANVAS_HEIGHT_PX; y += gridSizePx) {
    horizontal.push(y);
  }

  return { vertical, horizontal };
}
