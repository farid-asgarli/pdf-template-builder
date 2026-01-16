/**
 * Template Syntax Highlighter Utility
 * Parses template syntax and generates highlighted HTML spans
 */

import type { VariableDefinition } from '@/lib/types/variable.types';

export interface HighlightToken {
  type: 'text' | 'variable' | 'ternary' | 'elvis' | 'nullcoalesce' | 'block' | 'comment' | 'undefined-variable';
  value: string;
  start: number;
  end: number;
}

// Built-in variables that are always available
const BUILTIN_VARIABLES = new Set(['pageNumber', 'totalPages', 'date', 'time', 'datetime', 'documentTitle', 'author']);

// Loop context variables
const LOOP_CONTEXT_VARIABLES = new Set(['@index', '@first', '@last', '@odd', '@even', 'this', '@key', '@value']);

/**
 * Check if a variable name is defined
 */
function isVariableDefined(name: string, definedVariables: Set<string>): boolean {
  // Check built-ins
  if (BUILTIN_VARIABLES.has(name)) return true;

  // Check loop context
  if (LOOP_CONTEXT_VARIABLES.has(name)) return true;

  // Check if it starts with a defined variable (for nested access like user.name)
  const baseName = name.split('.')[0];
  if (definedVariables.has(baseName)) return true;

  // Check direct definition
  return definedVariables.has(name);
}

/**
 * Tokenize template text into highlight tokens
 */
export function tokenizeTemplate(text: string, variables: VariableDefinition[] = []): HighlightToken[] {
  const tokens: HighlightToken[] = [];
  const definedVariables = new Set(variables.map((v) => v.name));

  // Find all matches with their types
  interface Match {
    type: HighlightToken['type'];
    value: string;
    start: number;
    end: number;
  }

  const matches: Match[] = [];

  // Comments
  for (const match of text.matchAll(/\{\{!--[\s\S]*?--\}\}|\{\{![\s\S]*?\}\}/g)) {
    matches.push({
      type: 'comment',
      value: match[0],
      start: match.index!,
      end: match.index! + match[0].length,
    });
  }

  // Block controls
  for (const match of text.matchAll(/\{\{(?:#(?:if|unless|each)|\/(?:if|unless|each)|else)\b[^}]*\}\}/g)) {
    // Skip if overlaps with comment
    if (matches.some((m) => match.index! >= m.start && match.index! < m.end)) continue;
    matches.push({
      type: 'block',
      value: match[0],
      start: match.index!,
      end: match.index! + match[0].length,
    });
  }

  // Ternary - must check before simple variable
  for (const match of text.matchAll(/\{\{([^{}]+)\s*\?\s*(?:"[^"]*"|'[^']*'|[^:{}]+)\s*:\s*(?:"[^"]*"|'[^']*'|[^{}]+)\}\}/g)) {
    if (matches.some((m) => match.index! >= m.start && match.index! < m.end)) continue;
    matches.push({
      type: 'ternary',
      value: match[0],
      start: match.index!,
      end: match.index! + match[0].length,
    });
  }

  // Elvis
  for (const match of text.matchAll(/\{\{([^{}]+)\s*\?:\s*(?:"[^"]*"|'[^']*'|[^{}]+)\}\}/g)) {
    if (matches.some((m) => match.index! >= m.start && match.index! < m.end)) continue;
    matches.push({
      type: 'elvis',
      value: match[0],
      start: match.index!,
      end: match.index! + match[0].length,
    });
  }

  // Null coalesce
  for (const match of text.matchAll(/\{\{([^{}]+)\s*\?\?\s*(?:"[^"]*"|'[^']*'|[^{}]+)\}\}/g)) {
    if (matches.some((m) => match.index! >= m.start && match.index! < m.end)) continue;
    matches.push({
      type: 'nullcoalesce',
      value: match[0],
      start: match.index!,
      end: match.index! + match[0].length,
    });
  }

  // Simple variables (must be last to not override others)
  for (const match of text.matchAll(/\{\{([^{}#\/!?:|]+)(?:\s*\|[^}]*)?\}\}/g)) {
    if (matches.some((m) => match.index! >= m.start && match.index! < m.end)) continue;

    const varName = match[1].trim();
    const isDefined = isVariableDefined(varName, definedVariables);

    matches.push({
      type: isDefined ? 'variable' : 'undefined-variable',
      value: match[0],
      start: match.index!,
      end: match.index! + match[0].length,
    });
  }

  // Sort matches by position
  matches.sort((a, b) => a.start - b.start);

  // Build final token list with plain text between matches
  let lastEnd = 0;

  for (const match of matches) {
    // Add plain text before this match
    if (match.start > lastEnd) {
      tokens.push({
        type: 'text',
        value: text.slice(lastEnd, match.start),
        start: lastEnd,
        end: match.start,
      });
    }

    tokens.push(match);
    lastEnd = match.end;
  }

  // Add remaining plain text
  if (lastEnd < text.length) {
    tokens.push({
      type: 'text',
      value: text.slice(lastEnd),
      start: lastEnd,
      end: text.length,
    });
  }

  return tokens;
}

/**
 * Color scheme for syntax highlighting
 */
export const HIGHLIGHT_COLORS = {
  variable: { color: '#2563eb', fontWeight: '500' }, // Blue
  'undefined-variable': { color: '#dc2626', fontWeight: '500', textDecoration: 'wavy underline #dc2626' }, // Red with underline
  ternary: { color: '#7c3aed', fontWeight: '500' }, // Purple
  elvis: { color: '#ea580c', fontWeight: '500' }, // Orange
  nullcoalesce: { color: '#0891b2', fontWeight: '500' }, // Teal
  block: { color: '#059669', fontWeight: '600' }, // Green
  comment: { color: '#6b7280', fontStyle: 'italic' }, // Gray italic
  text: {},
} as const;

/**
 * Dark theme color scheme
 */
export const HIGHLIGHT_COLORS_DARK = {
  variable: { color: '#60a5fa', fontWeight: '500' }, // Light blue
  'undefined-variable': { color: '#f87171', fontWeight: '500', textDecoration: 'wavy underline #f87171' }, // Light red
  ternary: { color: '#a78bfa', fontWeight: '500' }, // Light purple
  elvis: { color: '#fb923c', fontWeight: '500' }, // Light orange
  nullcoalesce: { color: '#22d3ee', fontWeight: '500' }, // Light teal
  block: { color: '#34d399', fontWeight: '600' }, // Light green
  comment: { color: '#9ca3af', fontStyle: 'italic' }, // Light gray
  text: {},
} as const;

/**
 * Generate highlighted HTML string from tokens
 */
export function tokensToHtml(tokens: HighlightToken[], darkMode = false): string {
  const colors = darkMode ? HIGHLIGHT_COLORS_DARK : HIGHLIGHT_COLORS;

  return tokens
    .map((token) => {
      if (token.type === 'text') {
        return escapeHtml(token.value);
      }

      const style = colors[token.type];
      const styleStr = Object.entries(style)
        .map(([key, value]) => `${camelToKebab(key)}: ${value}`)
        .join('; ');

      return `<span style="${styleStr}">${escapeHtml(token.value)}</span>`;
    })
    .join('');
}

/**
 * Check if text contains any template syntax
 */
export function hasTemplateSyntax(text: string): boolean {
  return /\{\{.*?\}\}/.test(text);
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

/**
 * Convert camelCase to kebab-case
 */
function camelToKebab(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}
