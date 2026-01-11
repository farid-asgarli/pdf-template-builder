import { Type, FormInput, PenLine, Calendar, CheckSquare, Table, Image, AlignLeft, Minus, QrCode, type LucideIcon } from 'lucide-react';
import type { ComponentType } from '@/lib/types/document.types';

export interface ComponentTypeConfig {
  type: ComponentType;
  label: string;
  icon: LucideIcon;
  description: string;
  iconBg: string;
  hoverBg: string;
}

// Component categories for organized palette display
export const COMPONENT_CATEGORIES: { name: string; types: ComponentType[] }[] = [
  {
    name: 'Text',
    types: ['text-label', 'paragraph'],
  },
  {
    name: 'Form Fields',
    types: ['text-field', 'date-field', 'checkbox'],
  },
  {
    name: 'Signatures',
    types: ['signature-box'],
  },
  {
    name: 'Layout',
    types: ['table', 'image', 'divider', 'barcode'],
  },
];

// Component type configuration for the palette with unique colors
export const COMPONENT_TYPES: ComponentTypeConfig[] = [
  {
    type: 'text-label',
    label: 'Text Label',
    icon: Type,
    description: 'Static text',
    iconBg: '#3b82f6',
    hoverBg: 'rgba(59, 130, 246, 0.08)',
  },
  {
    type: 'text-field',
    label: 'Text Field',
    icon: FormInput,
    description: 'Fillable input',
    iconBg: '#8b5cf6',
    hoverBg: 'rgba(139, 92, 246, 0.08)',
  },
  {
    type: 'signature-box',
    label: 'Signature Box',
    icon: PenLine,
    description: 'Signature area',
    iconBg: '#f59e0b',
    hoverBg: 'rgba(245, 158, 11, 0.08)',
  },
  {
    type: 'date-field',
    label: 'Date Field',
    icon: Calendar,
    description: 'Date picker',
    iconBg: '#10b981',
    hoverBg: 'rgba(16, 185, 129, 0.08)',
  },
  {
    type: 'checkbox',
    label: 'Checkbox',
    icon: CheckSquare,
    description: 'Yes/No option',
    iconBg: '#ec4899',
    hoverBg: 'rgba(236, 72, 153, 0.08)',
  },
  {
    type: 'table',
    label: 'Table',
    icon: Table,
    description: 'Data grid',
    iconBg: '#06b6d4',
    hoverBg: 'rgba(6, 182, 212, 0.08)',
  },
  {
    type: 'image',
    label: 'Image',
    icon: Image,
    description: 'Logo or graphic',
    iconBg: '#f43f5e',
    hoverBg: 'rgba(244, 63, 94, 0.08)',
  },
  {
    type: 'paragraph',
    label: 'Paragraph',
    icon: AlignLeft,
    description: 'Multi-line text',
    iconBg: '#6366f1',
    hoverBg: 'rgba(99, 102, 241, 0.08)',
  },
  {
    type: 'divider',
    label: 'Divider',
    icon: Minus,
    description: 'Horizontal line',
    iconBg: '#64748b',
    hoverBg: 'rgba(100, 116, 139, 0.08)',
  },
  {
    type: 'barcode',
    label: 'Barcode / QR',
    icon: QrCode,
    description: 'Barcodes & QR codes',
    iconBg: '#0ea5e9',
    hoverBg: 'rgba(14, 165, 233, 0.08)',
  },
];
