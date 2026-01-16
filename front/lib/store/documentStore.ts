import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { temporal, TemporalState } from 'zundo';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import {
  Document,
  Page,
  Component,
  Position,
  ComponentType,
  HeaderFooterContent,
  HeaderFooterType,
  GlobalDocumentSettings,
  PageSettings,
  LayoutConfig,
  getDefaultProperties,
  getDefaultLayoutConfig,
  DEFAULT_COMPONENT_SIZES,
} from '@/lib/types/document.types';
import type { VariableDefinition } from '@/lib/types/variable.types';

// State that should be tracked for undo/redo (only document content)
interface TrackedState {
  document: Document | null;
}

// State that should NOT be tracked for undo/redo (UI state)
interface UntrackedState {
  currentPageId: string | null;
  selectedComponentId: string | null;
  isDirty: boolean;
  isLoading: boolean;
  isSaving: boolean;
}

interface DocumentStoreActions {
  // Document actions
  loadDocument: (document: Document) => void;
  updateDocument: (updates: Partial<Document>) => void;
  updateDocumentSettings: (settings: Partial<GlobalDocumentSettings>) => void;
  setDirty: (isDirty: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setSaving: (isSaving: boolean) => void;

  // Page actions
  setCurrentPage: (pageId: string) => void;
  addPage: () => void;
  deletePage: (pageId: string) => void;
  duplicatePage: (pageId: string) => void;
  reorderPages: (fromIndex: number, toIndex: number) => void;
  updatePageHeaderFooterType: (pageId: string, headerType?: HeaderFooterType, footerType?: HeaderFooterType) => void;
  updatePageSettings: (pageId: string, settings: Partial<PageSettings>) => void;

  // Component actions
  selectComponent: (componentId: string | null) => void;
  addComponent: (type: ComponentType, position: Position) => void;
  updateComponent: (
    componentId: string,
    updates: Partial<Pick<Component, 'position' | 'size' | 'properties' | 'style' | 'condition' | 'layout'>>
  ) => void;
  deleteComponent: (componentId: string) => void;
  duplicateComponent: (componentId: string) => void;

  // Header/Footer actions
  updateHeader: (type: 'default' | 'firstPage' | 'compact', content: HeaderFooterContent) => void;
  updateFooter: (type: 'default' | 'firstPage' | 'compact', content: HeaderFooterContent) => void;

  // Variable definition actions
  addVariableDefinition: (variable: VariableDefinition) => void;
  updateVariableDefinition: (name: string, updates: Partial<VariableDefinition>) => void;
  deleteVariableDefinition: (name: string) => void;
  reorderVariableDefinitions: (fromIndex: number, toIndex: number) => void;
  getVariableDefinitions: () => VariableDefinition[];

  // Utility
  getCurrentPage: () => Page | null;
  getSelectedComponent: () => Component | null;
  reset: () => void;
}

interface DocumentStore extends TrackedState, UntrackedState, DocumentStoreActions {}

// Generate unique IDs
const generateId = () => `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

// Default global document settings
export const DEFAULT_DOCUMENT_SETTINGS: GlobalDocumentSettings = {
  predefinedSize: 'a4',
  orientation: 'portrait',
  backgroundColor: '#FFFFFF',
  contentDirection: 'ltr',
  margins: { top: 0, right: 0, bottom: 0, left: 0 },
};

// Default page settings
export const DEFAULT_PAGE_SETTINGS: PageSettings = {
  predefinedSize: 'a4',
  orientation: 'portrait',
  backgroundColor: '#FFFFFF',
  contentDirection: 'ltr',
  margins: { top: 0, right: 0, bottom: 0, left: 0 },
};

// Create empty document with default structure
export function createEmptyDocument(id: string, title: string): Document {
  return {
    id,
    title,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    pages: [
      {
        id: generateId(),
        pageNumber: 1,
        headerType: 'default',
        footerType: 'default',
        components: [],
        pageSettings: { ...DEFAULT_PAGE_SETTINGS },
      },
    ],
    headerFooter: {
      defaultHeader: { height: 25, components: [] },
      defaultFooter: { height: 15, components: [] },
    },
    variables: {},
    variableDefinitions: [],
    settings: { ...DEFAULT_DOCUMENT_SETTINGS },
  };
}

export const useDocumentStore = create<DocumentStore>()(
  devtools(
    temporal(
      (set, get) => ({
        // Initial state - tracked
        document: null,

        // Initial state - untracked
        currentPageId: null,
        selectedComponentId: null,
        isDirty: false,
        isLoading: false,
        isSaving: false,

        // Document actions
        loadDocument: (document) =>
          set({
            document,
            currentPageId: document.pages[0]?.id || null,
            selectedComponentId: null,
            isDirty: false,
          }),

        updateDocument: (updates) =>
          set((state) => ({
            document: state.document ? { ...state.document, ...updates, updatedAt: new Date().toISOString() } : null,
            isDirty: true,
          })),

        updateDocumentSettings: (settings) =>
          set((state) => {
            if (!state.document) return state;
            return {
              document: {
                ...state.document,
                settings: {
                  ...DEFAULT_DOCUMENT_SETTINGS,
                  ...state.document.settings,
                  ...settings,
                },
                updatedAt: new Date().toISOString(),
              },
              isDirty: true,
            };
          }),

        setDirty: (isDirty) => set({ isDirty }),
        setLoading: (isLoading) => set({ isLoading }),
        setSaving: (isSaving) => set({ isSaving }),

        // Page actions
        setCurrentPage: (pageId) =>
          set({
            currentPageId: pageId,
            selectedComponentId: null,
          }),

        addPage: () =>
          set((state) => {
            if (!state.document) return state;

            const newPage: Page = {
              id: generateId(),
              pageNumber: state.document.pages.length + 1,
              headerType: 'default',
              footerType: 'default',
              components: [],
              pageSettings: { ...DEFAULT_PAGE_SETTINGS },
            };

            return {
              document: {
                ...state.document,
                pages: [...state.document.pages, newPage],
                updatedAt: new Date().toISOString(),
              },
              currentPageId: newPage.id,
              selectedComponentId: null,
              isDirty: true,
            };
          }),

        deletePage: (pageId) =>
          set((state) => {
            if (!state.document || state.document.pages.length <= 1) return state;

            const filteredPages = state.document.pages.filter((p) => p.id !== pageId);
            // Renumber pages
            const renumberedPages = filteredPages.map((p, index) => ({
              ...p,
              pageNumber: index + 1,
            }));

            // Determine new current page
            let newCurrentPageId = state.currentPageId;
            if (state.currentPageId === pageId) {
              const deletedIndex = state.document.pages.findIndex((p) => p.id === pageId);
              newCurrentPageId = renumberedPages[Math.min(deletedIndex, renumberedPages.length - 1)]?.id || null;
            }

            return {
              document: {
                ...state.document,
                pages: renumberedPages,
                updatedAt: new Date().toISOString(),
              },
              currentPageId: newCurrentPageId,
              selectedComponentId: null,
              isDirty: true,
            };
          }),

        duplicatePage: (pageId) =>
          set((state) => {
            if (!state.document) return state;

            const pageIndex = state.document.pages.findIndex((p) => p.id === pageId);
            if (pageIndex === -1) return state;

            const originalPage = state.document.pages[pageIndex];

            // Deep clone components with new IDs
            const clonedComponents: Component[] = originalPage.components.map((comp) => ({
              ...comp,
              id: generateId(),
              position: { ...comp.position },
              size: { ...comp.size },
              properties: { ...comp.properties },
              style: comp.style ? { ...comp.style } : undefined,
              condition: comp.condition ? { ...comp.condition, rules: [...comp.condition.rules] } : undefined,
              layout: comp.layout ? { ...comp.layout } : undefined,
            }));

            const newPage: Page = {
              id: generateId(),
              pageNumber: pageIndex + 2, // Insert after original
              headerType: originalPage.headerType,
              footerType: originalPage.footerType,
              components: clonedComponents,
            };

            // Insert new page after the original and renumber
            const newPages = [...state.document.pages];
            newPages.splice(pageIndex + 1, 0, newPage);
            const renumberedPages = newPages.map((p, index) => ({
              ...p,
              pageNumber: index + 1,
            }));

            return {
              document: {
                ...state.document,
                pages: renumberedPages,
                updatedAt: new Date().toISOString(),
              },
              currentPageId: newPage.id,
              selectedComponentId: null,
              isDirty: true,
            };
          }),

        reorderPages: (fromIndex, toIndex) =>
          set((state) => {
            if (!state.document) return state;

            const newPages = [...state.document.pages];
            const [removed] = newPages.splice(fromIndex, 1);
            newPages.splice(toIndex, 0, removed);

            // Renumber pages
            const renumberedPages = newPages.map((p, index) => ({
              ...p,
              pageNumber: index + 1,
            }));

            return {
              document: {
                ...state.document,
                pages: renumberedPages,
                updatedAt: new Date().toISOString(),
              },
              isDirty: true,
            };
          }),

        updatePageHeaderFooterType: (pageId, headerType, footerType) =>
          set((state) => {
            if (!state.document) return state;

            const updatedPages = state.document.pages.map((page) => {
              if (page.id === pageId) {
                return {
                  ...page,
                  headerType: headerType !== undefined ? headerType : page.headerType,
                  footerType: footerType !== undefined ? footerType : page.footerType,
                };
              }
              return page;
            });

            return {
              document: {
                ...state.document,
                pages: updatedPages,
                updatedAt: new Date().toISOString(),
              },
              isDirty: true,
            };
          }),

        updatePageSettings: (pageId, settings) =>
          set((state) => {
            if (!state.document) return state;

            const updatedPages = state.document.pages.map((page) => {
              if (page.id === pageId) {
                return {
                  ...page,
                  pageSettings: {
                    ...DEFAULT_PAGE_SETTINGS,
                    ...page.pageSettings,
                    ...settings,
                  },
                };
              }
              return page;
            });

            return {
              document: {
                ...state.document,
                pages: updatedPages,
                updatedAt: new Date().toISOString(),
              },
              isDirty: true,
            };
          }),

        // Component actions
        selectComponent: (componentId) => set({ selectedComponentId: componentId }),

        addComponent: (type, position) =>
          set((state) => {
            if (!state.document || !state.currentPageId) return state;

            const newComponent: Component = {
              id: generateId(),
              type,
              position,
              size: { ...DEFAULT_COMPONENT_SIZES[type] },
              properties: getDefaultProperties(type),
              layout: getDefaultLayoutConfig(type),
            };

            const updatedPages = state.document.pages.map((page) => {
              if (page.id === state.currentPageId) {
                return {
                  ...page,
                  components: [...page.components, newComponent],
                };
              }
              return page;
            });

            return {
              document: {
                ...state.document,
                pages: updatedPages,
                updatedAt: new Date().toISOString(),
              },
              selectedComponentId: newComponent.id,
              isDirty: true,
            };
          }),

        updateComponent: (componentId, updates) =>
          set((state) => {
            if (!state.document || !state.currentPageId) return state;

            const updatedPages = state.document.pages.map((page) => {
              if (page.id === state.currentPageId) {
                return {
                  ...page,
                  components: page.components.map((comp) => {
                    if (comp.id === componentId) {
                      return {
                        ...comp,
                        position: updates.position ?? comp.position,
                        size: updates.size ?? comp.size,
                        properties: updates.properties ? { ...comp.properties, ...updates.properties } : comp.properties,
                        style: updates.style ? { ...comp.style, ...updates.style } : comp.style,
                        condition: updates.condition !== undefined ? updates.condition : comp.condition,
                        layout: updates.layout !== undefined ? updates.layout : comp.layout,
                      };
                    }
                    return comp;
                  }),
                };
              }
              return page;
            });

            return {
              document: {
                ...state.document,
                pages: updatedPages,
                updatedAt: new Date().toISOString(),
              },
              isDirty: true,
            };
          }),

        deleteComponent: (componentId) =>
          set((state) => {
            if (!state.document || !state.currentPageId) return state;

            const updatedPages = state.document.pages.map((page) => {
              if (page.id === state.currentPageId) {
                return {
                  ...page,
                  components: page.components.filter((comp) => comp.id !== componentId),
                };
              }
              return page;
            });

            return {
              document: {
                ...state.document,
                pages: updatedPages,
                updatedAt: new Date().toISOString(),
              },
              selectedComponentId: state.selectedComponentId === componentId ? null : state.selectedComponentId,
              isDirty: true,
            };
          }),

        duplicateComponent: (componentId) =>
          set((state) => {
            if (!state.document || !state.currentPageId) return state;

            const currentPage = state.document.pages.find((p) => p.id === state.currentPageId);
            const componentToDuplicate = currentPage?.components.find((c) => c.id === componentId);

            if (!componentToDuplicate) return state;

            // Create a deep copy with a new ID and offset position
            const duplicatedComponent: Component = {
              ...componentToDuplicate,
              id: generateId(),
              position: {
                x: componentToDuplicate.position.x + 5, // Offset by 5mm
                y: componentToDuplicate.position.y + 5,
              },
              size: { ...componentToDuplicate.size },
              properties: { ...componentToDuplicate.properties },
              style: componentToDuplicate.style ? { ...componentToDuplicate.style } : undefined,
              condition: componentToDuplicate.condition
                ? { ...componentToDuplicate.condition, rules: [...componentToDuplicate.condition.rules] }
                : undefined,
              layout: componentToDuplicate.layout ? { ...componentToDuplicate.layout } : undefined,
            };

            const updatedPages = state.document.pages.map((page) => {
              if (page.id === state.currentPageId) {
                return {
                  ...page,
                  components: [...page.components, duplicatedComponent],
                };
              }
              return page;
            });

            return {
              document: {
                ...state.document,
                pages: updatedPages,
                updatedAt: new Date().toISOString(),
              },
              selectedComponentId: duplicatedComponent.id, // Select the new component
              isDirty: true,
            };
          }),

        // Header/Footer actions
        updateHeader: (type, content) =>
          set((state) => {
            if (!state.document) return state;

            const headerKey = type === 'default' ? 'defaultHeader' : type === 'firstPage' ? 'firstPageHeader' : 'compactHeader';

            return {
              document: {
                ...state.document,
                headerFooter: {
                  ...state.document.headerFooter,
                  [headerKey]: content,
                },
                updatedAt: new Date().toISOString(),
              },
              isDirty: true,
            };
          }),

        updateFooter: (type, content) =>
          set((state) => {
            if (!state.document) return state;

            const footerKey = type === 'default' ? 'defaultFooter' : type === 'firstPage' ? 'firstPageFooter' : 'compactFooter';

            return {
              document: {
                ...state.document,
                headerFooter: {
                  ...state.document.headerFooter,
                  [footerKey]: content,
                },
                updatedAt: new Date().toISOString(),
              },
              isDirty: true,
            };
          }),

        // Variable definition actions
        addVariableDefinition: (variable) =>
          set((state) => {
            if (!state.document) return state;

            // Check if variable with same name already exists
            const existingVars = state.document.variableDefinitions || [];
            if (existingVars.some((v) => v.name === variable.name)) {
              return state; // Don't add duplicate
            }

            return {
              document: {
                ...state.document,
                variableDefinitions: [...existingVars, { ...variable, order: existingVars.length }],
                updatedAt: new Date().toISOString(),
              },
              isDirty: true,
            };
          }),

        updateVariableDefinition: (name, updates) =>
          set((state) => {
            if (!state.document) return state;

            const existingVars = state.document.variableDefinitions || [];
            const updatedVars = existingVars.map((v) => (v.name === name ? { ...v, ...updates } : v));

            return {
              document: {
                ...state.document,
                variableDefinitions: updatedVars,
                updatedAt: new Date().toISOString(),
              },
              isDirty: true,
            };
          }),

        deleteVariableDefinition: (name) =>
          set((state) => {
            if (!state.document) return state;

            const existingVars = state.document.variableDefinitions || [];
            const filteredVars = existingVars.filter((v) => v.name !== name);
            // Reorder remaining variables
            const reorderedVars = filteredVars.map((v, index) => ({ ...v, order: index }));

            return {
              document: {
                ...state.document,
                variableDefinitions: reorderedVars,
                updatedAt: new Date().toISOString(),
              },
              isDirty: true,
            };
          }),

        reorderVariableDefinitions: (fromIndex, toIndex) =>
          set((state) => {
            if (!state.document) return state;

            const existingVars = [...(state.document.variableDefinitions || [])];
            const [removed] = existingVars.splice(fromIndex, 1);
            existingVars.splice(toIndex, 0, removed);
            // Update order values
            const reorderedVars = existingVars.map((v, index) => ({ ...v, order: index }));

            return {
              document: {
                ...state.document,
                variableDefinitions: reorderedVars,
                updatedAt: new Date().toISOString(),
              },
              isDirty: true,
            };
          }),

        getVariableDefinitions: () => {
          const state = get();
          return state.document?.variableDefinitions || [];
        },

        // Utility
        getCurrentPage: () => {
          const state = get();
          if (!state.document || !state.currentPageId) return null;
          return state.document.pages.find((p) => p.id === state.currentPageId) || null;
        },

        getSelectedComponent: () => {
          const state = get();
          const currentPage = state.getCurrentPage();
          if (!currentPage || !state.selectedComponentId) return null;
          return currentPage.components.find((c) => c.id === state.selectedComponentId) || null;
        },

        reset: () =>
          set({
            document: null,
            currentPageId: null,
            selectedComponentId: null,
            isDirty: false,
            isLoading: false,
            isSaving: false,
          }),
      }),
      {
        // Only track changes to 'document' for undo/redo, not UI state
        partialize: (state) => ({
          document: state.document,
        }),
        // Limit history to 50 items
        limit: 50,
        // Equality check to avoid unnecessary history entries
        equality: (pastState, currentState) => JSON.stringify(pastState.document) === JSON.stringify(currentState.document),
      }
    ),
    { name: 'document-store' }
  )
);

// ============================================================================
// Temporal Store Hooks (for Undo/Redo)
// ============================================================================

// Individual primitive selectors - these return stable references
const selectUndo = (state: TemporalState<TrackedState>) => state.undo;
const selectRedo = (state: TemporalState<TrackedState>) => state.redo;
const selectPastStates = (state: TemporalState<TrackedState>) => state.pastStates;
const selectFutureStates = (state: TemporalState<TrackedState>) => state.futureStates;

// Export individual hooks for temporal state - avoids object creation issues
export const useUndo = () => useStore(useDocumentStore.temporal, selectUndo);
export const useRedo = () => useStore(useDocumentStore.temporal, selectRedo);
export const usePastStates = () => useStore(useDocumentStore.temporal, selectPastStates);
export const useFutureStates = () => useStore(useDocumentStore.temporal, selectFutureStates);

// Convenience hook that returns all undo/redo state using shallow comparison
export function useUndoRedo() {
  const temporal = useDocumentStore.temporal;

  return useStore(
    temporal,
    useShallow((state) => ({
      undo: state.undo,
      redo: state.redo,
      canUndo: state.pastStates.length > 0,
      canRedo: state.futureStates.length > 0,
    }))
  );
}
