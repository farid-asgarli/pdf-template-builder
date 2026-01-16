'use client';

import { useRef, useCallback, useState, useEffect, useMemo } from 'react';
import Editor, { OnMount, Monaco } from '@monaco-editor/react';
import type * as monacoEditor from 'monaco-editor';
import { Variable, ChevronDown, Plus, Type, Hash, Calendar, ToggleLeft, DollarSign, List, Braces } from 'lucide-react';
import { useDocumentStore } from '@/lib/store/documentStore';
import type { VariableDefinition, VariableType } from '@/lib/types/variable.types';

// ─────────────────────────────────────────────────────────────────────────────
// Types & Constants
// ─────────────────────────────────────────────────────────────────────────────

interface VariableTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
  maxHeight?: number;
  singleLine?: boolean;
  className?: string;
  disabled?: boolean;
  /** Hide the toolbar (tip + variable picker) - useful when embedding in a dialog */
  hideToolbar?: boolean;
}

const TYPE_ICONS: Record<VariableType, React.ComponentType<{ className?: string }>> = {
  string: Type,
  number: Hash,
  date: Calendar,
  boolean: ToggleLeft,
  currency: DollarSign,
  array: List,
  object: Braces,
};

// ─────────────────────────────────────────────────────────────────────────────
// Monaco Setup Functions
// ─────────────────────────────────────────────────────────────────────────────

function registerVariableLanguage(monaco: Monaco) {
  // Check if already registered
  const registeredLanguages = monaco.languages.getLanguages();
  if (registeredLanguages.some((lang: { id: string }) => lang.id === 'pdftemplate')) {
    return;
  }

  // Register our custom language
  monaco.languages.register({ id: 'pdftemplate' });

  // Define tokenizer for syntax highlighting
  // Note: This tokenizer handles syntax structure. Variable validity is handled via markers.
  monaco.languages.setMonarchTokensProvider('pdftemplate', {
    tokenizer: {
      root: [
        // Block control structures (must come before other patterns)
        [/\{\{#each\s+\w+\}\}/, 'keyword.control.each'],
        [/\{\{\/each\}\}/, 'keyword.control.each'],
        [/\{\{#if\s+[\w.]+\}\}/, 'keyword.control.if'],
        [/\{\{\/if\}\}/, 'keyword.control.if'],
        [/\{\{#unless\s+[\w.]+\}\}/, 'keyword.control.unless'],
        [/\{\{\/unless\}\}/, 'keyword.control.unless'],

        // Inline ternary conditional: {{condition ? "true" : "false"}} or {{condition ? trueVar : falseVar}}
        [/\{\{\s*[\w.]+\s*\?\s*(?:"[^"]*"|'[^']*'|[\w.]+)\s*:\s*(?:"[^"]*"|'[^']*'|[\w.]+)\s*\}\}/, 'expression.ternary'],

        // Elvis operator: {{value ?: "default"}} or {{value ?: defaultVar}}
        [/\{\{\s*[\w.]+\s*\?:\s*(?:"[^"]*"|'[^']*'|[\w.]+)\s*\}\}/, 'expression.elvis'],

        // Null-coalescing operator: {{value ?? "default"}} or {{value ?? defaultVar}}
        [/\{\{\s*[\w.]+\s*\?\?\s*(?:"[^"]*"|'[^']*'|[\w.]+)\s*\}\}/, 'expression.nullcoalesce'],

        // Loop context variables
        [/\{\{@(index|number|first|last)\}\}/, 'variable.loop'],

        // {{this}} and {{this.property}}
        [/\{\{this(?:\.\w+)*\}\}/, 'variable.this'],

        // Built-in variables (must come before generic variable pattern)
        [/\{\{(pageNumber|totalPages|date|year|time|datetime|today)\}\}/, 'variable.builtin'],

        // {{variableName:format}} with format specifier
        [/\{\{[\w.]+:[^}]+\}\}/, 'variable.formatted'],

        // {{variableName}} simple variables - will be validated via markers for defined/undefined
        [/\{\{[\w.]+\}\}/, 'variable'],
      ],
    },
  });

  // Define theme for our tokens
  monaco.editor.defineTheme('pdftemplate-theme', {
    base: 'vs',
    inherit: true,
    rules: [
      // Variables
      { token: 'variable', foreground: '3b82f6', fontStyle: 'bold' },
      { token: 'variable.formatted', foreground: '8b5cf6', fontStyle: 'bold' },
      { token: 'variable.builtin', foreground: '059669', fontStyle: 'bold italic' },
      { token: 'variable.loop', foreground: 'f59e0b', fontStyle: 'bold' },
      { token: 'variable.this', foreground: 'ec4899', fontStyle: 'bold' },

      // Block control structures
      { token: 'keyword.control.each', foreground: '0891b2', fontStyle: 'bold' },
      { token: 'keyword.control.if', foreground: '7c3aed', fontStyle: 'bold' },
      { token: 'keyword.control.unless', foreground: 'dc2626', fontStyle: 'bold' },

      // Inline conditional expressions
      { token: 'expression.ternary', foreground: '7c3aed', fontStyle: 'bold' },
      { token: 'expression.elvis', foreground: 'ea580c', fontStyle: 'bold' },
      { token: 'expression.nullcoalesce', foreground: '0d9488', fontStyle: 'bold' },
    ],
    colors: {
      'editor.background': '#fafafa',
      'editor.foreground': '#1f2937',
      'editor.lineHighlightBackground': '#f3f4f6',
      'editorCursor.foreground': '#3b82f6',
      'editor.selectionBackground': '#bfdbfe',
      'editorWidget.background': '#ffffff',
      'editorWidget.border': '#e5e7eb',
      'editorSuggestWidget.selectedBackground': '#eff6ff',
    },
  });

  // Dark theme variant
  monaco.editor.defineTheme('pdftemplate-theme-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      // Variables
      { token: 'variable', foreground: '60a5fa', fontStyle: 'bold' },
      { token: 'variable.formatted', foreground: 'a78bfa', fontStyle: 'bold' },
      { token: 'variable.builtin', foreground: '34d399', fontStyle: 'bold italic' },
      { token: 'variable.loop', foreground: 'fbbf24', fontStyle: 'bold' },
      { token: 'variable.this', foreground: 'f472b6', fontStyle: 'bold' },

      // Block control structures
      { token: 'keyword.control.each', foreground: '22d3ee', fontStyle: 'bold' },
      { token: 'keyword.control.if', foreground: 'a78bfa', fontStyle: 'bold' },
      { token: 'keyword.control.unless', foreground: 'f87171', fontStyle: 'bold' },

      // Inline conditional expressions
      { token: 'expression.ternary', foreground: 'a78bfa', fontStyle: 'bold' },
      { token: 'expression.elvis', foreground: 'fb923c', fontStyle: 'bold' },
      { token: 'expression.nullcoalesce', foreground: '2dd4bf', fontStyle: 'bold' },
    ],
    colors: {
      'editor.background': '#1e1e1e',
    },
  });
}

// Built-in variables that are always available
const BUILTIN_VARIABLES = new Set(['pageNumber', 'totalPages', 'date', 'year', 'time', 'datetime', 'today']);

// Loop context variables (available within {{#each}} blocks)
const LOOP_CONTEXT_VARIABLES = new Set(['@index', '@number', '@first', '@last', 'this']);

/**
 * Extract all variable names used in a template string.
 * Returns an array of { name: string, start: number, end: number } for each variable reference.
 */
function extractVariableReferences(text: string): Array<{ name: string; start: number; end: number }> {
  const references: Array<{ name: string; start: number; end: number }> = [];

  // Pattern to match all variable-like syntax within {{ }}
  // This includes simple vars, formatted vars, and vars in inline conditionals
  const variablePatterns = [
    // Simple variables: {{varName}} or {{varName.prop}}
    /\{\{([\w.]+)\}\}/g,
    // Formatted variables: {{varName:format}}
    /\{\{([\w.]+):[^}]+\}\}/g,
    // Variables in ternary: {{condition ? ... : ...}} - capture the condition
    /\{\{\s*([\w.]+)\s*\?/g,
    // Variables used as values in ternary (not strings): {{cond ? varName : varName}}
    /\?\s*(?:"[^"]*"|'[^']*'|([\w.]+))\s*:/g,
    /:\s*(?:"[^"]*"|'[^']*'|([\w.]+))\s*\}\}/g,
    // Elvis: {{varName ?: ...}}
    /\{\{\s*([\w.]+)\s*\?:/g,
    // Null-coalesce: {{varName ?? ...}}
    /\{\{\s*([\w.]+)\s*\?\?/g,
    // Block controls: {{#if varName}}, {{#unless varName}}, {{#each varName}}
    /\{\{#(?:if|unless|each)\s+([\w.]+)\s*\}\}/g,
  ];

  for (const pattern of variablePatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const varName = match[1];
      if (varName) {
        // Calculate the actual position of the variable name in the match
        const fullMatch = match[0];
        const varStartInMatch = fullMatch.indexOf(varName);
        references.push({
          name: varName,
          start: match.index + varStartInMatch,
          end: match.index + varStartInMatch + varName.length,
        });
      }
    }
  }

  return references;
}

/**
 * Validate variables in the editor and add markers for undefined ones.
 */
function validateAndMarkUndefinedVariables(
  editor: monacoEditor.editor.IStandaloneCodeEditor,
  monaco: Monaco,
  text: string,
  definedVariables: VariableDefinition[]
) {
  const model = editor.getModel();
  if (!model) return;

  const definedNames = new Set(definedVariables.map((v) => v.name));
  const references = extractVariableReferences(text);

  const markers: monacoEditor.editor.IMarkerData[] = [];

  for (const ref of references) {
    const baseName = ref.name.split('.')[0]; // Get root variable name for nested access

    // Skip built-in variables
    if (BUILTIN_VARIABLES.has(ref.name) || BUILTIN_VARIABLES.has(baseName)) {
      continue;
    }

    // Skip loop context variables (they're valid within loops)
    if (LOOP_CONTEXT_VARIABLES.has(ref.name) || ref.name.startsWith('this.')) {
      continue;
    }

    // Check if variable is defined
    if (!definedNames.has(baseName)) {
      // Convert offset to position
      const startPos = model.getPositionAt(ref.start);
      const endPos = model.getPositionAt(ref.end);

      markers.push({
        severity: monaco.MarkerSeverity.Warning,
        message: `Variable "${ref.name}" is not defined. Define it in the Variables panel or check the spelling.`,
        startLineNumber: startPos.lineNumber,
        startColumn: startPos.column,
        endLineNumber: endPos.lineNumber,
        endColumn: endPos.column,
        source: 'template-validator',
        tags: [1], // Unnecessary tag - shows as faded
      });
    }
  }

  monaco.editor.setModelMarkers(model, 'template-validator', markers);
}

function createCompletionProvider(variables: VariableDefinition[]): monacoEditor.languages.CompletionItemProvider {
  return {
    triggerCharacters: ['{', '.'],
    provideCompletionItems: (model: monacoEditor.editor.ITextModel, position: monacoEditor.Position) => {
      const textUntilPosition = model.getValueInRange({
        startLineNumber: position.lineNumber,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      });

      const suggestions: monacoEditor.languages.CompletionItem[] = [];
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: position.column,
        endColumn: position.column,
      };

      // Check if we're inside {{ }}
      const lastOpenBrace = textUntilPosition.lastIndexOf('{{');
      const lastCloseBrace = textUntilPosition.lastIndexOf('}}');
      const isInsideBraces = lastOpenBrace > lastCloseBrace;

      if (isInsideBraces || textUntilPosition.endsWith('{')) {
        // Add variable suggestions
        variables.forEach((v) => {
          suggestions.push({
            label: v.name,
            kind: 5, // Variable
            insertText: isInsideBraces ? v.name + '}}' : '{{' + v.name + '}}',
            detail: `${v.type}${v.label ? ' - ' + v.label : ''}`,
            documentation: {
              value: `**${v.label || v.name}**\n\nType: \`${v.type}\`\n\n${v.description || ''}\n\nUsage: \`{{${v.name}}}\``,
            },
            range,
            sortText: '0' + v.name, // Sort user variables first
          });

          // Add formatted version for date/number/currency
          if (v.type === 'date' || v.type === 'number' || v.type === 'currency') {
            suggestions.push({
              label: `${v.name}:format`,
              kind: 5,
              insertText: isInsideBraces ? `${v.name}:${v.format || ''}\}\}` : `{{${v.name}:${v.format || ''}}}`,
              detail: `formatted ${v.type}`,
              range,
              sortText: '1' + v.name,
            });
          }

          // Add ternary conditional for boolean variables
          if (v.type === 'boolean') {
            suggestions.push({
              label: `${v.name} ? "yes" : "no"`,
              kind: 15, // Snippet
              insertText: isInsideBraces ? `${v.name} ? "$1" : "$2"\}\}` : `{{${v.name} ? "$1" : "$2"}}`,
              insertTextRules: 4, // InsertAsSnippet
              detail: 'ternary conditional',
              documentation: {
                value: `**Inline Conditional**\n\nReturns first value if \`${v.name}\` is truthy, otherwise second value.\n\nExample: \`{{${v.name} ? "Yes" : "No"}}\``,
              },
              range,
              sortText: '1' + v.name + 'ternary',
            });
          }

          // Add elvis operator for all variables
          suggestions.push({
            label: `${v.name} ?: "default"`,
            kind: 15, // Snippet
            insertText: isInsideBraces ? `${v.name} ?: "$1"\}\}` : `{{${v.name} ?: "$1"}}`,
            insertTextRules: 4, // InsertAsSnippet
            detail: 'elvis - use if truthy',
            documentation: {
              value: `**Elvis Operator**\n\nReturns \`${v.name}\` if it has a truthy value, otherwise returns the default.\n\nExample: \`{{${v.name} ?: "N/A"}}\``,
            },
            range,
            sortText: '1' + v.name + 'elvis',
          });

          // Add null-coalesce operator for all variables
          suggestions.push({
            label: `${v.name} ?? "default"`,
            kind: 15, // Snippet
            insertText: isInsideBraces ? `${v.name} ?? "$1"\}\}` : `{{${v.name} ?? "$1"}}`,
            insertTextRules: 4, // InsertAsSnippet
            detail: 'null-coalesce - use if defined',
            documentation: {
              value: `**Null Coalescing Operator**\n\nReturns \`${v.name}\` if it is defined (even if empty), otherwise returns the default.\n\nExample: \`{{${v.name} ?? "Unknown"}}\``,
            },
            range,
            sortText: '1' + v.name + 'nullcoalesce',
          });
        });

        // Add built-in variables
        const builtins = [
          { name: 'pageNumber', desc: 'Current page number' },
          { name: 'totalPages', desc: 'Total number of pages' },
          { name: 'date', desc: 'Current date (short format)' },
          { name: 'today', desc: 'Current date (Month DD, YYYY)' },
          { name: 'year', desc: 'Current year' },
          { name: 'time', desc: 'Current time' },
          { name: 'datetime', desc: 'Current date and time' },
        ];

        builtins.forEach((b) => {
          suggestions.push({
            label: b.name,
            kind: 14, // Keyword
            insertText: isInsideBraces ? b.name + '}}' : '{{' + b.name + '}}',
            detail: `built-in - ${b.desc}`,
            range,
            sortText: '2' + b.name,
          });
        });

        // Add block control structures
        const controls = [
          { name: '#if condition', insert: '#if condition}}...{{/if', desc: 'Conditional block' },
          { name: '#unless condition', insert: '#unless condition}}...{{/unless', desc: 'Inverse conditional block' },
          { name: '#each array', insert: '#each arrayName}}...{{/each', desc: 'Loop over array' },
        ];

        controls.forEach((c) => {
          suggestions.push({
            label: c.name,
            kind: 14,
            insertText: isInsideBraces ? c.insert + '}}' : '{{' + c.insert + '}}',
            detail: `block - ${c.desc}`,
            range,
            sortText: '3' + c.name,
          });
        });

        // Add inline conditional operators (generic)
        const inlineOps = [
          {
            name: 'condition ? "yes" : "no"',
            label: '? :',
            detail: 'ternary conditional',
            insert: 'condition ? "trueValue" : "falseValue"',
            desc: 'Inline ternary - if condition is true, use first value, else second',
            doc: '**Ternary Conditional**\n\n`{{condition ? "yes" : "no"}}`\n\nReturns "yes" if condition is truthy, "no" otherwise.\n\nCan also use variables: `{{active ? status : "inactive"}}`',
          },
          {
            name: 'value ?: "default"',
            label: '?:',
            detail: 'elvis operator',
            insert: 'variable ?: "default"',
            desc: 'Elvis operator - use value if truthy, else default',
            doc: '**Elvis Operator**\n\n`{{name ?: "Anonymous"}}`\n\nReturns the value of `name` if truthy, otherwise "Anonymous".',
          },
          {
            name: 'value ?? "default"',
            label: '??',
            detail: 'null-coalesce',
            insert: 'variable ?? "default"',
            desc: 'Null-coalesce - use value if defined, else default',
            doc: '**Null Coalescing**\n\n`{{email ?? "Not provided"}}`\n\nReturns `email` if defined (even empty string), otherwise "Not provided".',
          },
        ];

        inlineOps.forEach((op) => {
          suggestions.push({
            label: op.name,
            kind: 15, // Snippet
            insertText: isInsideBraces ? op.insert + '}}' : '{{' + op.insert + '}}',
            detail: op.detail,
            documentation: { value: op.doc },
            range,
            sortText: '3z' + op.label,
          });
        });

        // Add loop context variables
        const loopVars = [
          { name: '@index', desc: 'Current index (0-based)' },
          { name: '@number', desc: 'Current number (1-based)' },
          { name: '@first', desc: 'True if first item' },
          { name: '@last', desc: 'True if last item' },
          { name: 'this', desc: 'Current item in loop' },
        ];

        loopVars.forEach((l) => {
          suggestions.push({
            label: l.name,
            kind: 14,
            insertText: isInsideBraces ? l.name + '}}' : '{{' + l.name + '}}',
            detail: `loop - ${l.desc}`,
            range,
            sortText: '4' + l.name,
          });
        });
      }

      return { suggestions };
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Variable Picker Dropdown
// ─────────────────────────────────────────────────────────────────────────────

interface VariablePickerProps {
  variables: VariableDefinition[];
  onSelect: (variable: VariableDefinition) => void;
  onManageVariables: () => void;
}

function VariablePicker({ variables, onSelect, onManageVariables }: VariablePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredVariables = useMemo(() => {
    if (!search) return variables;
    const query = search.toLowerCase();
    return variables.filter((v) => v.name.toLowerCase().includes(query) || v.label.toLowerCase().includes(query));
  }, [variables, search]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-primary bg-primary/5 hover:bg-primary/10 rounded-md transition-colors"
      >
        <Variable className="h-3.5 w-3.5" />
        Insert Variable
        <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-outline-variant/20 z-50 overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-outline-variant/10">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search variables..."
              className="w-full px-2 py-1.5 text-sm bg-surface-container rounded-md border-none focus:outline-none focus:ring-1 focus:ring-primary"
              autoFocus
            />
          </div>

          {/* Variable List */}
          <div className="max-h-48 overflow-y-auto">
            {filteredVariables.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-on-surface-variant">
                {variables.length === 0 ? 'No variables defined' : 'No matching variables'}
              </div>
            ) : (
              filteredVariables.map((v) => {
                const TypeIcon = TYPE_ICONS[v.type] || Variable;
                return (
                  <button
                    key={v.name}
                    type="button"
                    onClick={() => {
                      onSelect(v);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-surface-container transition-colors"
                  >
                    <TypeIcon className="h-4 w-4 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-on-surface truncate">{v.label || v.name}</div>
                      <div className="text-xs text-on-surface-variant truncate">{`{{${v.name}}}`}</div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-outline-variant/10 bg-surface-container/50">
            <button
              type="button"
              onClick={() => {
                onManageVariables();
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium text-primary hover:bg-primary/5 rounded-md transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Manage Variables
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Editor Component
// ─────────────────────────────────────────────────────────────────────────────

export function VariableTextEditor({
  value,
  onChange,
  placeholder = 'Enter text...',
  minHeight = 60,
  maxHeight = 200,
  singleLine = false,
  className = '',
  disabled = false,
  hideToolbar = false,
}: VariableTextEditorProps) {
  const editorRef = useRef<monacoEditor.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const disposablesRef = useRef<monacoEditor.IDisposable[]>([]);
  const [isManageVariablesOpen, setIsManageVariablesOpen] = useState(false);

  const variables = useDocumentStore((state) => state.document?.variableDefinitions) ?? [];

  // Calculate height based on content
  const calculatedHeight = useMemo(() => {
    if (singleLine) return 32;
    const lineCount = value?.split('\n').length || 1;
    const lineHeight = 20;
    const padding = 16;
    const contentHeight = lineCount * lineHeight + padding;
    return Math.min(Math.max(contentHeight, minHeight), maxHeight);
  }, [value, minHeight, maxHeight, singleLine]);

  const handleEditorDidMount: OnMount = useCallback(
    (editor, monaco) => {
      editorRef.current = editor;
      monacoRef.current = monaco;

      // Register language and theme
      registerVariableLanguage(monaco);

      // Set the theme
      monaco.editor.setTheme('pdftemplate-theme');

      // Register completion provider
      const completionProvider = monaco.languages.registerCompletionItemProvider('pdftemplate', createCompletionProvider(variables));
      disposablesRef.current.push(completionProvider);

      // Initial validation of variables
      validateAndMarkUndefinedVariables(editor, monaco, value, variables);

      // Configure editor
      editor.updateOptions({
        fontSize: 13,
        lineHeight: 20,
        fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: singleLine ? 'off' : 'on',
        lineNumbers: singleLine ? 'off' : 'on',
        glyphMargin: false,
        folding: false,
        lineDecorationsWidth: singleLine ? 0 : 10,
        lineNumbersMinChars: singleLine ? 0 : 2,
        renderLineHighlight: singleLine ? 'none' : 'line',
        scrollbar: {
          vertical: singleLine ? 'hidden' : 'auto',
          horizontal: 'hidden',
          verticalScrollbarSize: 8,
        },
        overviewRulerLanes: 0,
        hideCursorInOverviewRuler: true,
        overviewRulerBorder: false,
        automaticLayout: true,
        contextmenu: false,
        quickSuggestions: true,
        suggestOnTriggerCharacters: true,
        acceptSuggestionOnEnter: 'on',
        tabCompletion: 'on',
        wordBasedSuggestions: 'off',
        suggest: {
          showIcons: true,
          showStatusBar: false,
          preview: true,
          filterGraceful: true,
          snippetsPreventQuickSuggestions: false,
        },
        padding: {
          top: singleLine ? 6 : 8,
          bottom: singleLine ? 6 : 8,
        },
      });

      // For single line, prevent Enter key from creating new lines
      if (singleLine) {
        editor.addCommand(monaco.KeyCode.Enter, () => {
          // Do nothing - prevent new line
        });
      }
    },
    [variables, singleLine]
  );

  // Update completion provider when variables change
  useEffect(() => {
    if (!monacoRef.current) return;

    // Dispose old completion provider
    disposablesRef.current.forEach((d) => d.dispose());
    disposablesRef.current = [];

    // Register new completion provider with updated variables
    const completionProvider = monacoRef.current.languages.registerCompletionItemProvider('pdftemplate', createCompletionProvider(variables));
    disposablesRef.current.push(completionProvider);
  }, [variables]);

  // Validate variables and update markers when value or variables change
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;

    // Debounce validation to avoid excessive updates while typing
    const timeoutId = setTimeout(() => {
      if (editorRef.current && monacoRef.current) {
        validateAndMarkUndefinedVariables(editorRef.current, monacoRef.current, value, variables);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [value, variables]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disposablesRef.current.forEach((d) => d.dispose());
    };
  }, []);

  const handleInsertVariable = useCallback((variable: VariableDefinition) => {
    if (!editorRef.current) return;

    const position = editorRef.current.getPosition();
    if (!position) return;

    const text = `{{${variable.name}}}`;
    editorRef.current.executeEdits('insert-variable', [
      {
        range: {
          startLineNumber: position.lineNumber,
          startColumn: position.column,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        },
        text,
      },
    ]);

    // Move cursor after the inserted text
    const newPosition = {
      lineNumber: position.lineNumber,
      column: position.column + text.length,
    };
    editorRef.current.setPosition(newPosition);
    editorRef.current.focus();
  }, []);

  return (
    <div className={`relative ${className}`}>
      {/* Toolbar - can be hidden when embedded in dialog */}
      {!hideToolbar && (
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1">
            {!singleLine && (
              <span className="text-xs text-on-surface-variant">
                Tip: Type <code className="px-1 py-0.5 bg-surface-container rounded text-primary">{'{{'}</code> for variable suggestions
              </span>
            )}
          </div>
          <VariablePicker variables={variables} onSelect={handleInsertVariable} onManageVariables={() => setIsManageVariablesOpen(true)} />
        </div>
      )}

      {/* Editor Container */}
      <div
        className={`relative rounded-lg border border-outline-variant/30 overflow-hidden transition-colors ${
          disabled
            ? 'opacity-50 pointer-events-none'
            : 'hover:border-outline-variant/50 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20'
        }`}
        style={{ height: calculatedHeight }}
      >
        <Editor
          value={value}
          onChange={(v) => onChange(v || '')}
          language="pdftemplate"
          theme="pdftemplate-theme"
          onMount={handleEditorDidMount}
          loading={<div className="flex items-center justify-center h-full text-sm text-on-surface-variant">Loading editor...</div>}
          options={{
            readOnly: disabled,
          }}
        />

        {/* Placeholder */}
        {!value && <div className="absolute top-2 left-3 text-sm text-on-surface-variant/50 pointer-events-none">{placeholder}</div>}
      </div>

      {/* Manage Variables Dialog Trigger - We'll handle this in the parent */}
      {isManageVariablesOpen && <div className="hidden">{/* This will be handled by triggering the parent's variable manager */}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Single Line Variant
// ─────────────────────────────────────────────────────────────────────────────

interface VariableInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  disabled?: boolean;
}

export function VariableInput({ value, onChange, placeholder, label, className = '', disabled = false }: VariableInputProps) {
  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium text-on-surface mb-1.5">{label}</label>}
      <VariableTextEditor value={value} onChange={onChange} placeholder={placeholder} singleLine minHeight={32} maxHeight={32} disabled={disabled} />
    </div>
  );
}
