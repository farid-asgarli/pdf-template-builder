// Template Categories
// Defines available template categories with metadata

import type { TemplateCategory } from '@/lib/types/document.types';

export interface CategoryInfo {
  id: TemplateCategory;
  name: string;
  description: string;
  icon: string; // Lucide icon name
}

export const TEMPLATE_CATEGORIES: CategoryInfo[] = [
  {
    id: 'insurance',
    name: 'Insurance',
    description: 'Auto, home, life, and health insurance documents',
    icon: 'Shield',
  },
  {
    id: 'legal',
    name: 'Legal',
    description: 'Contracts, agreements, and legal notices',
    icon: 'Scale',
  },
  {
    id: 'business',
    name: 'Business',
    description: 'Invoices, proposals, and business documents',
    icon: 'Briefcase',
  },
  {
    id: 'healthcare',
    name: 'Healthcare',
    description: 'Medical forms and patient documents',
    icon: 'Heart',
  },
  {
    id: 'financial',
    name: 'Financial',
    description: 'Financial statements and reports',
    icon: 'DollarSign',
  },
  {
    id: 'general',
    name: 'General',
    description: 'Miscellaneous document templates',
    icon: 'FileText',
  },
];

/**
 * Get category info by ID
 */
export function getCategoryById(id: TemplateCategory): CategoryInfo | undefined {
  return TEMPLATE_CATEGORIES.find((c) => c.id === id);
}

/**
 * Get all category IDs
 */
export function getAllCategoryIds(): TemplateCategory[] {
  return TEMPLATE_CATEGORIES.map((c) => c.id);
}
