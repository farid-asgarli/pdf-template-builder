// Template utility functions

/**
 * Generate a unique ID for template components
 */
export function generateTemplateId(): string {
  return `tpl-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generate a new unique ID (for cloning)
 */
export function generateNewId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
