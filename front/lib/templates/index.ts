// Built-in PDF Templates
// Central export hub for all template-related functionality

import type { Template, TemplateCategory, Component } from '@/lib/types/document.types';

// Re-export categories
export { TEMPLATE_CATEGORIES, getCategoryById, getAllCategoryIds, type CategoryInfo } from './categories';

// Re-export default property factories
export {
  DEFAULT_TEXT_LABEL_PROPERTIES,
  DEFAULT_TEXT_FIELD_PROPERTIES,
  DEFAULT_SIGNATURE_BOX_PROPERTIES,
  DEFAULT_DATE_FIELD_PROPERTIES,
  DEFAULT_CHECKBOX_PROPERTIES,
  DEFAULT_TABLE_PROPERTIES,
  DEFAULT_IMAGE_PROPERTIES,
  DEFAULT_PARAGRAPH_PROPERTIES,
  DEFAULT_DIVIDER_PROPERTIES,
  DEFAULT_BARCODE_PROPERTIES,
  DEFAULT_PLACEHOLDER_PROPERTIES,
  createTextLabelProperties,
  createTextFieldProperties,
  createSignatureBoxProperties,
  createDateFieldProperties,
  createCheckboxProperties,
  createTableProperties,
  createImageProperties,
  createParagraphProperties,
  createDividerProperties,
  createBarcodeProperties,
  createPlaceholderProperties,
} from './defaults';

// Re-export utility functions
export { generateTemplateId, generateNewId } from './utils';

// Import templates
import { BLANK_TEMPLATE } from './templates/blank';
import { AUTO_INSURANCE_BASIC } from './templates/auto-insurance';
import { NDA_BASIC } from './templates/nda';
import { INVOICE_BASIC } from './templates/invoice';

// Re-export individual templates
export { BLANK_TEMPLATE } from './templates/blank';
export { AUTO_INSURANCE_BASIC } from './templates/auto-insurance';
export { NDA_BASIC } from './templates/nda';
export { INVOICE_BASIC } from './templates/invoice';

// ============================================================================
// Export all built-in templates
// ============================================================================

export const BUILT_IN_TEMPLATES: Template[] = [BLANK_TEMPLATE, AUTO_INSURANCE_BASIC, NDA_BASIC, INVOICE_BASIC];

/**
 * Get all templates (built-in + user templates from API)
 */
export function getBuiltInTemplates(): Template[] {
  return BUILT_IN_TEMPLATES;
}

/**
 * Get a specific built-in template by ID
 */
export function getBuiltInTemplateById(id: string): Template | undefined {
  return BUILT_IN_TEMPLATES.find((t) => t.id === id);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: TemplateCategory): Template[] {
  return BUILT_IN_TEMPLATES.filter((t) => t.category === category);
}

/**
 * Deep clone a template content for creating a new document
 * Generates new unique IDs for all components and pages
 */
export function cloneTemplateContent(template: Template): Template['content'] {
  const generateCloneId = () => `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  const cloneComponents = (components: Component[]) =>
    components.map((comp) => ({
      ...comp,
      id: generateCloneId(),
      properties: { ...comp.properties },
      style: comp.style ? { ...comp.style } : undefined,
    }));

  const clonedPages = template.content.pages.map((page) => ({
    ...page,
    id: generateCloneId(),
    components: cloneComponents(page.components),
  }));

  const clonedHeaderFooter = {
    defaultHeader: {
      ...template.content.headerFooter.defaultHeader,
      components: cloneComponents(template.content.headerFooter.defaultHeader.components),
    },
    defaultFooter: {
      ...template.content.headerFooter.defaultFooter,
      components: cloneComponents(template.content.headerFooter.defaultFooter.components),
    },
    firstPageHeader: template.content.headerFooter.firstPageHeader
      ? {
          ...template.content.headerFooter.firstPageHeader,
          components: cloneComponents(template.content.headerFooter.firstPageHeader.components),
        }
      : undefined,
    firstPageFooter: template.content.headerFooter.firstPageFooter
      ? {
          ...template.content.headerFooter.firstPageFooter,
          components: cloneComponents(template.content.headerFooter.firstPageFooter.components),
        }
      : undefined,
    compactHeader: template.content.headerFooter.compactHeader
      ? {
          ...template.content.headerFooter.compactHeader,
          components: cloneComponents(template.content.headerFooter.compactHeader.components),
        }
      : undefined,
    compactFooter: template.content.headerFooter.compactFooter
      ? {
          ...template.content.headerFooter.compactFooter,
          components: cloneComponents(template.content.headerFooter.compactFooter.components),
        }
      : undefined,
  };

  return {
    pages: clonedPages,
    headerFooter: clonedHeaderFooter,
    variables: { ...template.content.variables },
  };
}
