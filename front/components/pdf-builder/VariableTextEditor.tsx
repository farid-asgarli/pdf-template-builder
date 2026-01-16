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
  monaco.languages.setMonarchTokensProvider('pdftemplate', {
    tokenizer: {
      root: [
        // Match {{#each arrayName}}...{{/each}}
        [/\{\{#each\s+\w+\}\}/, 'keyword.control.each'],
        [/\{\{\/each\}\}/, 'keyword.control.each'],
        // Match {{#if condition}}...{{/if}}
        [/\{\{#if\s+[\w.]+\}\}/, 'keyword.control.if'],
        [/\{\{\/if\}\}/, 'keyword.control.if'],
        // Match {{#unless condition}}...{{/unless}}
        [/\{\{#unless\s+[\w.]+\}\}/, 'keyword.control.unless'],
        [/\{\{\/unless\}\}/, 'keyword.control.unless'],
        // Match loop context variables
        [/\{\{@(index|number|first|last)\}\}/, 'variable.loop'],
        // Match {{this}} and {{this.property}}
        [/\{\{this(?:\.\w+)*\}\}/, 'variable.this'],
        // Match {{variableName:format}} with format specifier
        [/\{\{[\w.]+:[^}]+\}\}/, 'variable.formatted'],
        // Match {{variableName}} simple variables
        [/\{\{[\w.]+\}\}/, 'variable'],
        // Match built-in variables
        [/\{\{(pageNumber|totalPages|date|year|time|datetime|today)\}\}/, 'variable.builtin'],
      ],
    },
  });

  // Define theme for our tokens
  monaco.editor.defineTheme('pdftemplate-theme', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'variable', foreground: '3b82f6', fontStyle: 'bold' },
      { token: 'variable.formatted', foreground: '8b5cf6', fontStyle: 'bold' },
      { token: 'variable.builtin', foreground: '059669', fontStyle: 'bold italic' },
      { token: 'variable.loop', foreground: 'f59e0b', fontStyle: 'bold' },
      { token: 'variable.this', foreground: 'ec4899', fontStyle: 'bold' },
      { token: 'keyword.control.each', foreground: '0891b2', fontStyle: 'bold' },
      { token: 'keyword.control.if', foreground: '7c3aed', fontStyle: 'bold' },
      { token: 'keyword.control.unless', foreground: 'dc2626', fontStyle: 'bold' },
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
      { token: 'variable', foreground: '60a5fa', fontStyle: 'bold' },
      { token: 'variable.formatted', foreground: 'a78bfa', fontStyle: 'bold' },
      { token: 'variable.builtin', foreground: '34d399', fontStyle: 'bold italic' },
      { token: 'variable.loop', foreground: 'fbbf24', fontStyle: 'bold' },
      { token: 'variable.this', foreground: 'f472b6', fontStyle: 'bold' },
      { token: 'keyword.control.each', foreground: '22d3ee', fontStyle: 'bold' },
      { token: 'keyword.control.if', foreground: 'a78bfa', fontStyle: 'bold' },
      { token: 'keyword.control.unless', foreground: 'f87171', fontStyle: 'bold' },
    ],
    colors: {
      'editor.background': '#1e1e1e',
    },
  });
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
            label: {
              label: v.name,
              detail: ` (${v.type})`,
              description: v.label || v.description,
            },
            kind: 5, // Variable
            insertText: isInsideBraces ? v.name + '}}' : '{{' + v.name + '}}',
            detail: v.description || `${v.type} variable`,
            documentation: {
              value: `**${v.label || v.name}**\n\nType: \`${v.type}\`\n\n${v.description || ''}\n\nUsage: \`{{${v.name}}}\``,
            },
            range,
            sortText: '0' + v.name, // Sort user variables first
          });

          // Add formatted version for date/number/currency
          if (v.type === 'date' || v.type === 'number' || v.type === 'currency') {
            suggestions.push({
              label: {
                label: `${v.name}:format`,
                detail: ' (with formatting)',
              },
              kind: 5,
              insertText: isInsideBraces ? `${v.name}:${v.format || ''}\}\}` : `{{${v.name}:${v.format || ''}}}`,
              detail: `Formatted ${v.type}`,
              range,
              sortText: '1' + v.name,
            });
          }
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
            label: {
              label: b.name,
              detail: ' (built-in)',
            },
            kind: 14, // Keyword
            insertText: isInsideBraces ? b.name + '}}' : '{{' + b.name + '}}',
            detail: b.desc,
            range,
            sortText: '2' + b.name,
          });
        });

        // Add control structures
        const controls = [
          { name: '#if', insert: '#if condition}}...{{/if', desc: 'Conditional block' },
          { name: '#unless', insert: '#unless condition}}...{{/unless', desc: 'Inverse conditional block' },
          { name: '#each', insert: '#each arrayName}}...{{/each', desc: 'Loop over array' },
        ];

        controls.forEach((c) => {
          suggestions.push({
            label: {
              label: c.name,
              detail: ' (control)',
            },
            kind: 14,
            insertText: isInsideBraces ? c.insert + '}}' : '{{' + c.insert + '}}',
            detail: c.desc,
            range,
            sortText: '3' + c.name,
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
            label: {
              label: l.name,
              detail: ' (loop)',
            },
            kind: 14,
            insertText: isInsideBraces ? l.name + '}}' : '{{' + l.name + '}}',
            detail: l.desc,
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
    <div ref={dropdownRef} className='relative'>
      <button
        type='button'
        onClick={() => setIsOpen(!isOpen)}
        className='flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-primary bg-primary/5 hover:bg-primary/10 rounded-md transition-colors'
      >
        <Variable className='h-3.5 w-3.5' />
        Insert Variable
        <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className='absolute top-full right-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-outline-variant/20 z-50 overflow-hidden'>
          {/* Search */}
          <div className='p-2 border-b border-outline-variant/10'>
            <input
              type='text'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='Search variables...'
              className='w-full px-2 py-1.5 text-sm bg-surface-container rounded-md border-none focus:outline-none focus:ring-1 focus:ring-primary'
              autoFocus
            />
          </div>

          {/* Variable List */}
          <div className='max-h-48 overflow-y-auto'>
            {filteredVariables.length === 0 ? (
              <div className='px-3 py-4 text-center text-sm text-on-surface-variant'>
                {variables.length === 0 ? 'No variables defined' : 'No matching variables'}
              </div>
            ) : (
              filteredVariables.map((v) => {
                const TypeIcon = TYPE_ICONS[v.type] || Variable;
                return (
                  <button
                    key={v.name}
                    type='button'
                    onClick={() => {
                      onSelect(v);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className='w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-surface-container transition-colors'
                  >
                    <TypeIcon className='h-4 w-4 shrink-0' />
                    <div className='min-w-0 flex-1'>
                      <div className='text-sm font-medium text-on-surface truncate'>{v.label || v.name}</div>
                      <div className='text-xs text-on-surface-variant truncate'>{`{{${v.name}}}`}</div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className='p-2 border-t border-outline-variant/10 bg-surface-container/50'>
            <button
              type='button'
              onClick={() => {
                onManageVariables();
                setIsOpen(false);
              }}
              className='w-full flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium text-primary hover:bg-primary/5 rounded-md transition-colors'
            >
              <Plus className='h-3.5 w-3.5' />
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
      {/* Toolbar */}
      <div className='flex items-center justify-between mb-1.5'>
        <div className='flex items-center gap-1'>
          {!singleLine && (
            <span className='text-xs text-on-surface-variant'>
              Tip: Type <code className='px-1 py-0.5 bg-surface-container rounded text-primary'>{'{{'}</code> for variable suggestions
            </span>
          )}
        </div>
        <VariablePicker variables={variables} onSelect={handleInsertVariable} onManageVariables={() => setIsManageVariablesOpen(true)} />
      </div>

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
          language='pdftemplate'
          theme='pdftemplate-theme'
          onMount={handleEditorDidMount}
          loading={<div className='flex items-center justify-center h-full text-sm text-on-surface-variant'>Loading editor...</div>}
          options={{
            readOnly: disabled,
          }}
        />

        {/* Placeholder */}
        {!value && <div className='absolute top-2 left-3 text-sm text-on-surface-variant/50 pointer-events-none'>{placeholder}</div>}
      </div>

      {/* Manage Variables Dialog Trigger - We'll handle this in the parent */}
      {isManageVariablesOpen && <div className='hidden'>{/* This will be handled by triggering the parent's variable manager */}</div>}
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
      {label && <label className='block text-sm font-medium text-on-surface mb-1.5'>{label}</label>}
      <VariableTextEditor value={value} onChange={onChange} placeholder={placeholder} singleLine minHeight={32} maxHeight={32} disabled={disabled} />
    </div>
  );
}
