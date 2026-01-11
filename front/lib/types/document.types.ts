// PDF Builder Document Types
// All position and size values are stored in millimeters (mm)

import type { VariableDefinition } from './variable.types';

export interface Document {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  pages: Page[];
  headerFooter: HeaderFooterConfig;
  variables: Record<string, string>;
  /** Variable definitions that describe the schema for document variables */
  variableDefinitions?: VariableDefinition[];
  settings?: GlobalDocumentSettings;
}

/**
 * Global document settings that apply to all pages unless overridden at page level.
 */
export interface GlobalDocumentSettings {
  /** Default page size preset (a3, a4, a5, letter, legal, ledger, tabloid, executive). */
  predefinedSize: PageSizePreset;
  /** Default orientation (portrait or landscape). */
  orientation: PageOrientation;
  /** Default background color for pages. */
  backgroundColor: string;
  /** Default content direction (ltr or rtl). */
  contentDirection: ContentDirection;
  /** Default margins for pages (in millimeters). */
  margins: PageMargins;
}

/**
 * Page margins in millimeters.
 */
export interface PageMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * Predefined page size options matching QuestPDF PageSizes.
 */
export type PageSizePreset = 'a3' | 'a4' | 'a5' | 'letter' | 'legal' | 'ledger' | 'tabloid' | 'executive' | 'custom';

/**
 * Page orientation options.
 */
export type PageOrientation = 'portrait' | 'landscape';

/**
 * Content direction for RTL/LTR support.
 */
export type ContentDirection = 'ltr' | 'rtl';

export interface Page {
  id: string;
  pageNumber: number;
  headerType: HeaderFooterType;
  footerType: HeaderFooterType;
  components: Component[];
  /** Page-specific settings that override global settings. */
  pageSettings?: PageSettings;
}

/**
 * Page-level settings for size, orientation, margins, etc.
 * Values are in millimeters unless otherwise specified.
 */
export interface PageSettings {
  /** Predefined page size. Takes precedence over custom width/height if set. */
  predefinedSize?: PageSizePreset;
  /** Custom page width in millimeters. Used when predefinedSize is 'custom'. */
  width?: number;
  /** Custom page height in millimeters. Used when predefinedSize is 'custom'. */
  height?: number;
  /** Page orientation. */
  orientation?: PageOrientation;
  /** Page background color (hex color code). */
  backgroundColor?: string;
  /** Content direction for RTL/LTR support. */
  contentDirection?: ContentDirection;
  /** Page margins in millimeters. */
  margins?: PageMargins;
}

export interface Component {
  id: string;
  type: ComponentType;
  position: Position;
  size: Size;
  properties: ComponentProperties;
  style?: ComponentStyle;
}

export interface Position {
  x: number; // millimeters from left
  y: number; // millimeters from top
}

export interface Size {
  width: number; // millimeters
  height: number; // millimeters
}

export type ComponentType =
  | 'text-label'
  | 'text-field'
  | 'signature-box'
  | 'date-field'
  | 'checkbox'
  | 'table'
  | 'image'
  | 'paragraph'
  | 'divider'
  | 'barcode'
  | 'placeholder';

// Placeholder variant types for different visual states
export type PlaceholderVariant = 'default' | 'error' | 'warning' | 'info';

// Union type for all component properties
export type ComponentProperties =
  | TextLabelProperties
  | TextFieldProperties
  | SignatureBoxProperties
  | DateFieldProperties
  | CheckboxProperties
  | TableProperties
  | ImageProperties
  | ParagraphProperties
  | DividerProperties
  | BarcodeProperties
  | PlaceholderProperties;

// Font weight values matching QuestPDF (100-1000)
export type FontWeight = 'thin' | 'extralight' | 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold' | 'black';

// Text decoration options
export type TextDecoration = 'none' | 'underline' | 'strikethrough' | 'overline';
export type TextDecorationStyle = 'solid' | 'double' | 'wavy' | 'dotted' | 'dashed';

// Text alignment options - includes justify for proper text block formatting
export type TextAlign = 'left' | 'center' | 'right' | 'justify';

// Individual component property types
export interface TextLabelProperties {
  content: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: FontWeight;
  italic: boolean;
  color: string;
  backgroundColor?: string;
  textAlign: TextAlign;
  letterSpacing: number; // proportional to font size (e.g., 0 = normal, 0.1 = 10% wider)
  wordSpacing: number; // proportional to font size (e.g., 0 = normal, 0.2 = 20% wider)
  lineHeight: number; // multiplier (e.g., 1 = normal, 1.5 = 150%)
  decoration: TextDecoration;
  decorationStyle: TextDecorationStyle;
  decorationColor?: string; // if not set, uses text color
  decorationThickness: number; // thickness of decoration line (default 1)
}

export interface TextFieldProperties {
  // Field identification
  label: string;
  fieldName: string;
  placeholder?: string;
  required: boolean;

  // Label styling
  labelFontSize: number;
  labelColor: string;
  labelFontWeight: FontWeight;
  labelFontFamily?: string;

  // Input styling
  fontSize: number;
  fontFamily: string;
  inputHeight: number; // height in mm
  inputPaddingVertical: number; // padding in points (top and bottom)
  inputPaddingHorizontal: number; // padding in points (left and right)
  /** @deprecated Use inputPaddingVertical and inputPaddingHorizontal instead */
  inputPadding?: number; // legacy: uniform padding in points

  // Border styling
  borderWidth: number;
  borderColor: string;
  borderRadius: number;

  // Colors
  backgroundColor?: string;
  placeholderColor: string;

  // Layout
  labelSpacing: number; // spacing between label and input in points
  fullWidth: boolean; // whether the input should take full width
}

export interface SignatureBoxProperties {
  // Signer information
  signerName: string;
  signerTitle?: string;

  // Feature toggles
  showLine: boolean;
  dateRequired: boolean;

  // Signature line styling
  lineThickness: number;
  lineColor: string;

  // Text styling
  signerNameFontSize: number;
  signerNameColor: string;
  signerNameFontWeight: FontWeight;
  signerTitleFontSize: number;
  signerTitleColor: string;

  // Date section styling
  dateLineWidth: number;
  dateLabel: string;
  dateLabelFontSize: number;
  dateLabelColor: string;

  // Spacing
  spacingBetweenElements: number;
  signatureAreaHeight: number;
}

export interface DateFieldProperties {
  // Field identification
  label: string;
  fieldName: string;
  format: string; // e.g., "MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"
  required: boolean;

  // Label styling
  labelFontSize: number;
  labelColor: string;
  labelFontWeight: FontWeight;

  // Input styling
  fontSize: number;
  inputHeight: number; // height in mm
  inputPadding: number; // padding in points

  // Border styling
  borderWidth: number;
  borderColor: string;
  borderRadius: number;

  // Colors
  backgroundColor?: string;
  placeholderColor: string;

  // Icon
  showIcon: boolean;
  iconColor: string;
}

// Checkbox size presets
export type CheckboxSize = 'small' | 'medium' | 'large';

// Checkmark style options
export type CheckmarkStyle = 'check' | 'cross' | 'circle';

export interface CheckboxProperties {
  // Content
  label: string;
  fieldName: string;
  defaultChecked: boolean;

  // Checkbox box styling
  size: CheckboxSize;
  checkedColor: string;
  uncheckedBackgroundColor: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;

  // Checkmark styling
  checkmarkStyle: CheckmarkStyle;
  checkmarkColor: string;

  // Label styling
  labelFontSize: number;
  labelColor: string;
  labelFontWeight: FontWeight;

  // Layout
  spacing: number; // gap between checkbox and label in points
}

// Column definition for tables - supports both constant (fixed width in points) and relative (proportional) columns
export interface TableColumnDefinition {
  type: 'constant' | 'relative';
  width: number; // points for constant, ratio for relative (e.g., 1, 2, 3 means 1:2:3 ratio)
  align?: 'left' | 'center' | 'right'; // text alignment for this column
}

// Border style options for tables
export type TableBorderStyle = 'all' | 'header' | 'horizontal' | 'vertical' | 'none';

// Vertical alignment options
export type VerticalAlign = 'top' | 'middle' | 'bottom';

export interface TableProperties {
  // Structure
  columnDefinitions: TableColumnDefinition[];
  headers: string[];
  data: string[][];
  showHeader: boolean;

  // Header styling
  headerBackground: string;
  headerTextColor: string;
  headerFontSize: number;
  headerFontWeight: FontWeight;
  headerPaddingVertical: number; // points
  headerPaddingHorizontal: number; // points
  headerVerticalAlign: VerticalAlign;
  // Header bottom border (when borderStyle is 'header')
  headerBorderBottom: boolean;
  headerBorderBottomWidth: number;
  headerBorderBottomColor: string;

  // Cell styling
  cellTextColor: string;
  cellFontSize: number;
  cellFontWeight: FontWeight;
  cellPaddingVertical: number; // points
  cellPaddingHorizontal: number; // points
  cellVerticalAlign: VerticalAlign;

  // Alternating row colors
  alternateRowColors: boolean;
  evenRowBackground: string;
  oddRowBackground: string;

  // Borders
  borderStyle: TableBorderStyle;
  borderWidth: number; // points (0 = no border)
  borderColor: string;
}

// Image fit mode options matching QuestPDF
export type ImageFitMode = 'fitWidth' | 'fitHeight' | 'fitArea' | 'fitUnproportionally';

// Image compression quality matching QuestPDF ImageCompressionQuality enum
export type ImageCompressionQuality = 'best' | 'veryHigh' | 'high' | 'medium' | 'low' | 'veryLow';

// Image type - raster (JPEG, PNG, BMP, WEBP) or SVG
export type ImageType = 'raster' | 'svg';

export interface ImageProperties {
  // Source
  src: string; // URL, base64 data URI, or file path
  alt: string; // Alt text for accessibility

  // Image type
  imageType: ImageType;

  // Scaling behavior (maps to QuestPDF FitWidth/FitHeight/FitArea/FitUnproportionally)
  fitMode: ImageFitMode;

  // Compression settings (only applies to raster images)
  compressionQuality: ImageCompressionQuality;

  // DPI setting - controls image resolution in PDF (only applies to raster images)
  // Higher = better quality, larger file. Default is 288 in QuestPDF.
  rasterDpi: number;

  // When true, embeds the original image without any compression or resizing
  useOriginalImage: boolean;
}

export interface ParagraphProperties {
  // Content
  content: string;

  // Typography
  fontSize: number;
  fontFamily: string;
  fontWeight: FontWeight;
  italic: boolean;
  color: string;
  backgroundColor?: string;
  textAlign: 'left' | 'center' | 'right' | 'justify';

  // Spacing
  letterSpacing: number; // proportional to font size (e.g., 0 = normal, 0.1 = 10% wider)
  wordSpacing: number; // proportional to font size (e.g., 0 = normal, 0.2 = 20% wider)
  lineHeight: number; // multiplier (e.g., 1 = normal, 1.5 = 150%)

  // Paragraph-specific settings
  paragraphSpacing: number; // vertical gap between paragraphs (points)
  firstLineIndentation: number; // horizontal offset of first line (points)

  // Line clamping (optional)
  clampLines?: number; // max visible lines, overflow truncated with ellipsis
  clampEllipsis?: string; // custom ellipsis text (default: "...")

  // Text decoration
  decoration: TextDecoration;
  decorationStyle: TextDecorationStyle;
  decorationColor?: string; // if not set, uses text color
}

export interface DividerProperties {
  orientation: 'horizontal' | 'vertical';
  thickness: number;
  color: string;
  /** Dash pattern array [dash, gap, dash, gap, ...]. Empty array or undefined = solid line. */
  dashPattern?: number[];
  /** Optional gradient colors. If provided, overrides single color. */
  gradientColors?: string[];
}

// ============================================================================
// Barcode Types
// ============================================================================

/**
 * Supported barcode types matching ZXing.Net library capabilities.
 *
 * 1D Product codes: Best for retail and inventory
 * - ean-13: European Article Number (13 digits) - most common retail barcode
 * - ean-8: Compact version (8 digits) for small products
 * - upc-a: Universal Product Code (12 digits) - US/Canada retail
 * - upc-e: Compact UPC (6 digits)
 *
 * 1D Industrial codes: For logistics and asset tracking
 * - code-128: Alphanumeric, high density - shipping labels
 * - code-39: Alphanumeric - military, healthcare
 * - code-93: Enhanced Code 39 with higher density
 * - codabar: Libraries, blood banks
 * - itf: Interleaved 2 of 5 - cartons, shipping
 *
 * 2D codes: For high data density
 * - qr-code: Most versatile - URLs, contact info, etc.
 * - data-matrix: Small parts marking, electronics
 * - aztec: Boarding passes, tickets
 * - pdf-417: IDs, driver licenses, large data
 */
export type BarcodeType =
  // 1D Product codes
  | 'ean-13'
  | 'ean-8'
  | 'upc-a'
  | 'upc-e'
  // 1D Industrial codes
  | 'code-128'
  | 'code-39'
  | 'code-93'
  | 'codabar'
  | 'itf'
  // 2D codes
  | 'qr-code'
  | 'data-matrix'
  | 'aztec'
  | 'pdf-417';

/**
 * Error correction level for 2D barcodes (QR Code, Aztec, PDF417).
 * Higher levels provide more redundancy for damaged/dirty codes.
 */
export type BarcodeErrorCorrectionLevel = 'low' | 'medium' | 'quartile' | 'high';

/**
 * Properties for barcode/QR code components.
 * Uses ZXing.Net library for generation, rendered as SVG for sharp output.
 */
export interface BarcodeProperties {
  /** The data to encode in the barcode */
  value: string;

  /** Type of barcode to generate */
  barcodeType: BarcodeType;

  /** Whether to display the value as text below 1D barcodes */
  showValue: boolean;

  /** Barcode bars/modules color (hex) */
  foregroundColor: string;

  /** Background color (hex) */
  backgroundColor: string;

  /** Error correction level for 2D codes (QR, Aztec, PDF417) */
  errorCorrectionLevel: BarcodeErrorCorrectionLevel;

  /** Quiet zone (margin) around barcode in points */
  quietZone: number;

  /** Font size for value text display (1D barcodes) */
  valueFontSize: number;

  /** Font family for value text display */
  valueFontFamily: string;
}

/**
 * Properties for placeholder components.
 * Used for unknown component types, missing content states, and prototyping.
 * Matches the QuestPDF Placeholder element behavior.
 */
export interface PlaceholderProperties {
  /** Label text to display in the placeholder */
  label: string;
  /** Visual variant for different states */
  variant: PlaceholderVariant;
  /** Whether to show an icon (default: true) */
  showIcon?: boolean;
}

export interface ComponentStyle {
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  padding?: number;
}

// Header/Footer types
export type HeaderFooterType = 'default' | 'firstPage' | 'compact' | 'none';

export interface HeaderFooterConfig {
  defaultHeader: HeaderFooterContent;
  defaultFooter: HeaderFooterContent;
  firstPageHeader?: HeaderFooterContent;
  firstPageFooter?: HeaderFooterContent;
  compactHeader?: HeaderFooterContent;
  compactFooter?: HeaderFooterContent;
}

export interface HeaderFooterContent {
  height: number; // millimeters
  components: Component[];
}

// ============================================================================
// Template Types
// ============================================================================

export interface Template {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  thumbnail?: string; // Base64 or URL to thumbnail image
  content: TemplateContent;
  isBuiltIn: boolean; // true for hardcoded templates, false for user-created
  createdAt: string;
  updatedAt: string;
}

export interface TemplateContent {
  pages: Page[];
  headerFooter: HeaderFooterConfig;
  variables: Record<string, string>;
  /** Variable definitions that describe the schema for template variables */
  variableDefinitions?: VariableDefinition[];
}

export type TemplateCategory = 'insurance' | 'legal' | 'business' | 'healthcare' | 'financial' | 'general';

export interface CreateTemplateRequest {
  name: string;
  description: string;
  category: TemplateCategory;
  content: string; // JSON stringified TemplateContent
}

export interface UpdateTemplateRequest {
  name?: string;
  description?: string;
  category?: TemplateCategory;
  content?: string;
}

export interface TemplateResponse {
  id: string;
  name: string;
  description: string;
  category: string;
  content: string; // JSON stringified TemplateContent
  isBuiltIn: boolean;
  createdAt: string;
  updatedAt: string;
}

// API request/response types
export interface CreateDocumentRequest {
  title: string;
}

export interface UpdateDocumentRequest {
  title?: string;
  content: string; // JSON stringified document content
}

export interface DocumentResponse {
  id: string;
  title: string;
  content: string; // JSON stringified document content
  createdAt: string;
  updatedAt: string;
}

// Default values for creating new components
export const DEFAULT_COMPONENT_SIZES: Record<ComponentType, Size> = {
  'text-label': { width: 80, height: 8 },
  'text-field': { width: 80, height: 16 },
  'signature-box': { width: 80, height: 25 },
  'date-field': { width: 50, height: 16 },
  checkbox: { width: 60, height: 8 },
  table: { width: 180, height: 50 },
  image: { width: 50, height: 50 },
  paragraph: { width: 170, height: 30 },
  divider: { width: 170, height: 2 },
  barcode: { width: 40, height: 40 },
  placeholder: { width: 50, height: 30 },
};

export function getDefaultProperties(type: ComponentType): ComponentProperties {
  switch (type) {
    case 'text-label':
      return {
        content: 'Text Label',
        fontSize: 12,
        fontFamily: 'Inter',
        fontWeight: 'normal',
        italic: false,
        color: '#000000',
        backgroundColor: undefined,
        textAlign: 'left',
        letterSpacing: 0,
        wordSpacing: 0,
        lineHeight: 1,
        decoration: 'none',
        decorationStyle: 'solid',
        decorationColor: undefined,
        decorationThickness: 1,
      } as TextLabelProperties;

    case 'text-field':
      return {
        // Field identification
        label: 'Field Label',
        fieldName: 'field_name',
        placeholder: '',
        required: false,
        // Label styling
        labelFontSize: 10,
        labelColor: '#666666',
        labelFontWeight: 'normal',
        labelFontFamily: undefined,
        // Input styling
        fontSize: 12,
        fontFamily: 'Inter',
        inputHeight: 8,
        inputPaddingVertical: 4,
        inputPaddingHorizontal: 6,
        // Border styling
        borderWidth: 1,
        borderColor: '#000000',
        borderRadius: 0,
        // Colors
        backgroundColor: undefined,
        placeholderColor: '#999999',
        // Layout
        labelSpacing: 2,
        fullWidth: true,
      } as TextFieldProperties;

    case 'signature-box':
      return {
        // Signer information
        signerName: 'Signer Name',
        signerTitle: '',

        // Feature toggles
        showLine: true,
        dateRequired: true,

        // Signature line styling
        lineThickness: 1,
        lineColor: '#000000',

        // Text styling
        signerNameFontSize: 10,
        signerNameColor: '#000000',
        signerNameFontWeight: 'bold',
        signerTitleFontSize: 9,
        signerTitleColor: '#666666',

        // Date section styling
        dateLineWidth: 50,
        dateLabel: 'Date',
        dateLabelFontSize: 9,
        dateLabelColor: '#666666',

        // Spacing
        spacingBetweenElements: 2,
        signatureAreaHeight: 20,
      } as SignatureBoxProperties;

    case 'date-field':
      return {
        // Field identification
        label: 'Date',
        fieldName: 'date_field',
        format: 'MM/DD/YYYY',
        required: false,

        // Label styling
        labelFontSize: 10,
        labelColor: '#666666',
        labelFontWeight: 'normal',

        // Input styling
        fontSize: 12,
        inputHeight: 8,
        inputPadding: 4,

        // Border styling
        borderWidth: 1,
        borderColor: '#000000',
        borderRadius: 0,

        // Colors
        backgroundColor: undefined,
        placeholderColor: '#999999',

        // Icon
        showIcon: true,
        iconColor: '#666666',
      } as DateFieldProperties;

    case 'checkbox':
      return {
        // Content
        label: 'Checkbox Label',
        fieldName: 'checkbox_field',
        defaultChecked: false,

        // Checkbox box styling
        size: 'medium',
        checkedColor: '#6750a4',
        uncheckedBackgroundColor: '#ffffff',
        borderColor: '#79747e',
        borderWidth: 1.5,
        borderRadius: 2,

        // Checkmark styling
        checkmarkStyle: 'check',
        checkmarkColor: '#ffffff',

        // Label styling
        labelFontSize: 11,
        labelColor: '#1c1b1f',
        labelFontWeight: 'normal',

        // Layout
        spacing: 6,
      } as CheckboxProperties;

    case 'table':
      return {
        // Structure
        columnDefinitions: [
          { type: 'relative', width: 1, align: 'left' },
          { type: 'relative', width: 1, align: 'left' },
          { type: 'relative', width: 1, align: 'left' },
        ],
        headers: ['Column 1', 'Column 2', 'Column 3'],
        data: [
          ['', '', ''],
          ['', '', ''],
        ],
        showHeader: true,

        // Header styling
        headerBackground: '#f0f0f0',
        headerTextColor: '#000000',
        headerFontSize: 10,
        headerFontWeight: 'bold',
        headerPaddingVertical: 8,
        headerPaddingHorizontal: 10,
        headerVerticalAlign: 'middle',
        headerBorderBottom: false,
        headerBorderBottomWidth: 2,
        headerBorderBottomColor: '#000000',

        // Cell styling
        cellTextColor: '#000000',
        cellFontSize: 10,
        cellFontWeight: 'normal',
        cellPaddingVertical: 5,
        cellPaddingHorizontal: 10,
        cellVerticalAlign: 'middle',

        // Alternating row colors
        alternateRowColors: false,
        evenRowBackground: '#ffffff',
        oddRowBackground: '#f9f9f9',

        // Borders
        borderStyle: 'all',
        borderWidth: 1,
        borderColor: '#000000',
      } as TableProperties;

    case 'image':
      return {
        src: '',
        alt: 'Image',
        imageType: 'raster',
        fitMode: 'fitArea',
        compressionQuality: 'high',
        rasterDpi: 288,
        useOriginalImage: false,
      } as ImageProperties;

    case 'paragraph':
      return {
        // Content
        content: 'Enter your paragraph text here...',

        // Typography
        fontSize: 11,
        fontFamily: 'Inter',
        fontWeight: 'normal',
        italic: false,
        color: '#000000',
        backgroundColor: undefined,
        textAlign: 'left',

        // Spacing
        letterSpacing: 0,
        wordSpacing: 0,
        lineHeight: 1.5,

        // Paragraph-specific
        paragraphSpacing: 10,
        firstLineIndentation: 0,

        // Line clamping
        clampLines: undefined,
        clampEllipsis: undefined,

        // Decoration
        decoration: 'none',
        decorationStyle: 'solid',
        decorationColor: undefined,
      } as ParagraphProperties;

    case 'divider':
      return {
        orientation: 'horizontal',
        thickness: 1,
        color: '#000000',
        dashPattern: undefined, // solid line
        gradientColors: undefined,
      } as DividerProperties;

    case 'barcode':
      return {
        value: '',
        barcodeType: 'qr-code',
        showValue: true,
        foregroundColor: '#000000',
        backgroundColor: '#FFFFFF',
        errorCorrectionLevel: 'medium',
        quietZone: 2,
        valueFontSize: 10,
        valueFontFamily: 'Inter',
      } as BarcodeProperties;

    case 'placeholder':
      return {
        label: 'Placeholder',
        variant: 'default',
        showIcon: true,
      } as PlaceholderProperties;

    default:
      return {} as ComponentProperties;
  }
}
