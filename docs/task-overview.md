# PDF Builder for Insurance Contracts - Task Document

## Project Overview

Build a drag-and-drop PDF builder for creating insurance contracts, addendums, and related legal documents. The system allows users to visually design documents that generate pixel-accurate PDFs.

**Key Requirements:**

- Visual drag-and-drop document builder
- Multi-page support with page management
- Customizable header/footer system
- Component-based approach (not free-form positioning)
- Real PDF generation matching visual design (95-98% accuracy)
- Template system for reusable document structures

---

## Architecture Decisions

### Technology Stack

**Frontend:**

- React 18+ with TypeScript
- Next.js 14+ (App Router)
- `@dnd-kit` for drag-and-drop functionality
- Zustand for state management
- Existing `ui-primitives` (M3 Expressive) for general app UI
- Custom components for PDF builder canvas
- Tailwind CSS for styling

**Backend:**

- .NET 8 Minimal API
- QuestPDF for PDF generation
- PostgreSQL for document/template storage
- Entity Framework Core (Code-First)
- No layered architecture initially (direct controller → service → data access)
- No authentication initially (add later)

**Why These Choices:**

- `@dnd-kit` - Modern, accessible, performant drag-and-drop
- QuestPDF - Precise PDF generation with C# API
- Minimal API - Fast development, easy to refactor later
- Component-based approach - Ensures consistency and precision

---

## Core Concepts

### 1. Document Structure

```
Document
├── Metadata (title, version, created date)
├── Global Header/Footer Templates
├── Pages[]
│   ├── Page 1
│   │   ├── Header (reference or override)
│   │   ├── Components[] (text fields, signatures, etc.)
│   │   └── Footer (reference or override)
│   ├── Page 2
│   └── Page N
└── Variables ({{policyNumber}}, {{insuredName}}, etc.)
```

### 2. Coordinate System

- **Storage:** All positions stored in millimeters (mm) from document origin
- **Canvas:** Display at fixed scale (A4 page dimensions in pixels)
- **Conversion:** 1mm = 3.7795px at 96 DPI
- **Origin:** Top-left (0, 0) for both canvas and PDF
- **Page Size:** A4 (210mm x 297mm) default

### 3. Component Library

Pre-defined, draggable components:

- **Text Label** - Static text with formatting
- **Text Field** - Input area (becomes fillable PDF field)
- **Signature Box** - Dedicated signature area
- **Date Field** - Date input/display
- **Checkbox** - Single checkbox with label
- **Table** - Structured data grid
- **Image** - Logo/graphic placement
- **Paragraph** - Multi-line text block
- **Divider** - Horizontal/vertical line

### 4. Header/Footer System

**Types:**

- **Global** - Applies to all pages by default
- **First Page** - Special header/footer for page 1
- **Compact** - Minimal header for content pages
- **None** - No header/footer (e.g., signature pages)

**Features:**

- Variable substitution: `{{pageNumber}}`, `{{totalPages}}`, `{{date}}`, etc.
- Per-page override capability
- Visual editor for header/footer content

---

## Data Models

### Document (JSON Structure for Frontend State)

```typescript
interface Document {
  id: string;
  title: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  pageSize: 'A4' | 'Letter';
  currentPageId: string;

  headerFooter: {
    header: {
      default: HeaderFooterContent;
      firstPage?: HeaderFooterContent;
      compact?: HeaderFooterContent;
    };
    footer: {
      default: HeaderFooterContent;
      noPageNumber?: HeaderFooterContent;
    };
  };

  pages: Page[];
  variables: Record<string, string>;
}

interface Page {
  id: string;
  pageNumber: number;
  templateId?: string;
  headerType: 'default' | 'firstPage' | 'compact' | null;
  footerType: 'default' | 'noPageNumber' | null;
  components: Component[];
}

interface Component {
  id: string;
  type: ComponentType;
  position: Position;
  size: Size;
  properties: ComponentProperties;
  style?: ComponentStyle;
}

interface Position {
  x: number; // millimeters
  y: number; // millimeters
}

interface Size {
  width: number; // millimeters
  height: number; // millimeters
}

type ComponentType = 'text-label' | 'text-field' | 'signature-box' | 'date-field' | 'checkbox' | 'table' | 'image' | 'paragraph' | 'divider';

interface ComponentProperties {
  // Varies by type
  label?: string;
  content?: string;
  required?: boolean;
  fieldName?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: 'normal' | 'bold';
  alignment?: 'left' | 'center' | 'right';
  color?: string;
  // ... more properties
}

interface HeaderFooterContent {
  height: number; // millimeters
  components: Component[];
}
```

### Backend Database Schema

```sql
-- Documents table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    page_size VARCHAR(20) DEFAULT 'A4',
    content JSONB NOT NULL, -- Stores full document structure
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Templates table (for reusable document structures)
CREATE TABLE templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    content JSONB NOT NULL,
    thumbnail_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Generated PDFs table (cache/history)
CREATE TABLE generated_pdfs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id),
    file_path VARCHAR(500),
    file_size_bytes BIGINT,
    generated_at TIMESTAMP DEFAULT NOW()
);
```

---

## Implementation Roadmap

## Phase 1: Foundation & Core Canvas (Week 1-2)

### Backend Setup

**1.1 Project Initialization**

```bash
dotnet new webapi -n PdfBuilder.Api
cd PdfBuilder.Api
dotnet add package QuestPDF
dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL
dotnet add package Microsoft.EntityFrameworkCore.Design
```

**1.2 Database Context**

```csharp
// Data/AppDbContext.cs
public class AppDbContext : DbContext
{
    public DbSet<Document> Documents { get; set; }
    public DbSet<Template> Templates { get; set; }
    public DbSet<GeneratedPdf> GeneratedPdfs { get; set; }
}

// Models/Document.cs
public class Document
{
    public Guid Id { get; set; }
    public string Title { get; set; }
    public string Version { get; set; }
    public string PageSize { get; set; }
    public string Content { get; set; } // JSON
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
```

**1.3 Core API Endpoints**

```csharp
// Program.cs - Minimal API
app.MapGet("/api/documents", async (AppDbContext db) =>
    await db.Documents.ToListAsync());

app.MapGet("/api/documents/{id}", async (Guid id, AppDbContext db) =>
    await db.Documents.FindAsync(id));

app.MapPost("/api/documents", async (CreateDocumentRequest req, AppDbContext db) =>
{
    var doc = new Document { Title = req.Title, Content = "{}" };
    db.Documents.Add(doc);
    await db.SaveChangesAsync();
    return Results.Created($"/api/documents/{doc.Id}", doc);
});

app.MapPut("/api/documents/{id}", async (Guid id, UpdateDocumentRequest req, AppDbContext db) =>
{
    var doc = await db.Documents.FindAsync(id);
    if (doc == null) return Results.NotFound();
    doc.Content = req.Content;
    doc.UpdatedAt = DateTime.UtcNow;
    await db.SaveChangesAsync();
    return Results.Ok(doc);
});

app.MapPost("/api/documents/{id}/generate-pdf", async (Guid id, AppDbContext db) =>
{
    var doc = await db.Documents.FindAsync(id);
    if (doc == null) return Results.NotFound();

    // Parse JSON content
    var documentData = JsonSerializer.Deserialize<DocumentData>(doc.Content);

    // Generate PDF using QuestPDF
    var pdfBytes = PdfGenerator.Generate(documentData);

    return Results.File(pdfBytes, "application/pdf", $"{doc.Title}.pdf");
});
```

**1.4 QuestPDF Generator Service**

```csharp
// Services/PdfGenerator.cs
public static class PdfGenerator
{
    public static byte[] Generate(DocumentData data)
    {
        var document = Document.Create(container =>
        {
            foreach (var page in data.Pages)
            {
                container.Page(pageConfig =>
                {
                    pageConfig.Size(PageSizes.A4);
                    pageConfig.Margin(0);

                    // Render components
                    pageConfig.Content().Column(column =>
                    {
                        foreach (var component in page.Components)
                        {
                            RenderComponent(column, component);
                        }
                    });
                });
            }
        });

        return document.GeneratePdf();
    }

    private static void RenderComponent(ColumnDescriptor column, Component component)
    {
        // Position absolutely
        column.Item().PaddingLeft(component.Position.X, Unit.Millimetre)
                     .PaddingTop(component.Position.Y, Unit.Millimetre)
                     .Width(component.Size.Width, Unit.Millimetre)
                     .Height(component.Size.Height, Unit.Millimetre)
                     .Element(container =>
                     {
                         switch (component.Type)
                         {
                             case "text-label":
                                 RenderTextLabel(container, component);
                                 break;
                             case "text-field":
                                 RenderTextField(container, component);
                                 break;
                             // ... other types
                         }
                     });
    }

    private static void RenderTextLabel(IContainer container, Component component)
    {
        container.Text(component.Properties.Content)
                 .FontSize(component.Properties.FontSize ?? 12)
                 .FontFamily(component.Properties.FontFamily ?? "Arial");
    }

    private static void RenderTextField(IContainer container, Component component)
    {
        container.Border(1).BorderColor(Colors.Grey.Lighten2)
                 .Padding(2, Unit.Millimetre)
                 .AlignMiddle()
                 .Text(component.Properties.Label ?? "");
    }
}
```

### Frontend Setup

**1.5 Next.js Project Structure**

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx (dashboard)
│   └── builder/
│       └── [id]/
│           └── page.tsx (PDF builder)
├── components/
│   ├── ui-primitives/ (existing M3 components)
│   └── pdf-builder/
│       ├── Canvas.tsx
│       ├── ComponentPalette.tsx
│       ├── PropertyPanel.tsx
│       ├── PageThumbnails.tsx
│       ├── Toolbar.tsx
│       └── components/
│           ├── DraggableComponent.tsx
│           ├── TextLabel.tsx
│           ├── TextField.tsx
│           ├── SignatureBox.tsx
│           └── ... (other component types)
├── lib/
│   ├── store/
│   │   └── documentStore.ts (Zustand)
│   ├── types/
│   │   └── document.types.ts
│   └── utils/
│       ├── coordinates.ts (mm ↔ px conversion)
│       └── api.ts
└── styles/
    └── pdf-builder.css
```

**1.6 Document Store (Zustand)**

```typescript
// lib/store/documentStore.ts
import { create } from 'zustand';

interface DocumentStore {
  document: Document | null;
  selectedComponentId: string | null;

  // Actions
  loadDocument: (doc: Document) => void;
  updateDocument: (updates: Partial<Document>) => void;
  addPage: () => void;
  deletePage: (pageId: string) => void;
  setCurrentPage: (pageId: string) => void;
  addComponent: (pageId: string, component: Component) => void;
  updateComponent: (componentId: string, updates: Partial<Component>) => void;
  deleteComponent: (componentId: string) => void;
  selectComponent: (componentId: string | null) => void;
}

export const useDocumentStore = create<DocumentStore>((set, get) => ({
  document: null,
  selectedComponentId: null,

  loadDocument: (doc) => set({ document: doc }),

  updateDocument: (updates) =>
    set((state) => ({
      document: state.document ? { ...state.document, ...updates } : null,
    })),

  addPage: () =>
    set((state) => {
      if (!state.document) return state;

      const newPage: Page = {
        id: crypto.randomUUID(),
        pageNumber: state.document.pages.length + 1,
        headerType: 'default',
        footerType: 'default',
        components: [],
      };

      return {
        document: {
          ...state.document,
          pages: [...state.document.pages, newPage],
          currentPageId: newPage.id,
        },
      };
    }),

  addComponent: (pageId, component) =>
    set((state) => {
      if (!state.document) return state;

      return {
        document: {
          ...state.document,
          pages: state.document.pages.map((page) => (page.id === pageId ? { ...page, components: [...page.components, component] } : page)),
        },
      };
    }),

  updateComponent: (componentId, updates) =>
    set((state) => {
      if (!state.document) return state;

      return {
        document: {
          ...state.document,
          pages: state.document.pages.map((page) => ({
            ...page,
            components: page.components.map((comp) => (comp.id === componentId ? { ...comp, ...updates } : comp)),
          })),
        },
      };
    }),

  // ... other actions
}));
```

**1.7 Coordinate Conversion Utilities**

```typescript
// lib/utils/coordinates.ts

// A4 dimensions
export const A4_WIDTH_MM = 210;
export const A4_HEIGHT_MM = 297;

// Display DPI
export const DISPLAY_DPI = 96;

// Conversion factor: 1mm = 3.7795px at 96 DPI
export const MM_TO_PX = DISPLAY_DPI / 25.4;
export const PX_TO_MM = 25.4 / DISPLAY_DPI;

export function mmToPx(mm: number): number {
  return mm * MM_TO_PX;
}

export function pxToMm(px: number): number {
  return px * PX_TO_MM;
}

export function snapToGrid(value: number, gridSize: number = 1): number {
  return Math.round(value / gridSize) * gridSize;
}

// Canvas dimensions for A4 at 96 DPI
export const CANVAS_WIDTH_PX = mmToPx(A4_WIDTH_MM); // ~794px
export const CANVAS_HEIGHT_PX = mmToPx(A4_HEIGHT_MM); // ~1123px
```

**1.8 Main Canvas Component**

```typescript
// components/pdf-builder/Canvas.tsx
'use client';

import { useDroppable } from '@dnd-kit/core';
import { useDocumentStore } from '@/lib/store/documentStore';
import { DraggableComponent } from './components/DraggableComponent';
import { CANVAS_WIDTH_PX, CANVAS_HEIGHT_PX } from '@/lib/utils/coordinates';

export function Canvas() {
  const { document, selectedComponentId } = useDocumentStore();
  const { setNodeRef } = useDroppable({ id: 'canvas' });

  const currentPage = document?.pages.find((p) => p.id === document.currentPageId);

  if (!currentPage) return null;

  return (
    <div className="flex justify-center items-start p-8 bg-gray-100 overflow-auto">
      <div
        ref={setNodeRef}
        className="relative bg-white shadow-lg"
        style={{
          width: `${CANVAS_WIDTH_PX}px`,
          height: `${CANVAS_HEIGHT_PX}px`,
        }}
      >
        {/* Grid overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="grid" width={mmToPx(10)} height={mmToPx(10)} patternUnits="userSpaceOnUse">
                <path d={`M ${mmToPx(10)} 0 L 0 0 0 ${mmToPx(10)}`} fill="none" stroke="#ddd" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Render components */}
        {currentPage.components.map((component) => (
          <DraggableComponent key={component.id} component={component} isSelected={component.id === selectedComponentId} />
        ))}
      </div>
    </div>
  );
}
```

**1.9 Draggable Component Wrapper**

```typescript
// components/pdf-builder/components/DraggableComponent.tsx
'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Component } from '@/lib/types/document.types';
import { useDocumentStore } from '@/lib/store/documentStore';
import { mmToPx } from '@/lib/utils/coordinates';

import { TextLabel } from './TextLabel';
import { TextField } from './TextField';
import { SignatureBox } from './SignatureBox';
// ... import other component types

interface DraggableComponentProps {
  component: Component;
  isSelected: boolean;
}

export function DraggableComponent({ component, isSelected }: DraggableComponentProps) {
  const { selectComponent, updateComponent } = useDocumentStore();

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: component.id,
    data: { component },
  });

  const style = {
    position: 'absolute' as const,
    left: `${mmToPx(component.position.x)}px`,
    top: `${mmToPx(component.position.y)}px`,
    width: `${mmToPx(component.size.width)}px`,
    height: `${mmToPx(component.size.height)}px`,
    transform: CSS.Translate.toString(transform),
    cursor: isDragging ? 'grabbing' : 'grab',
    zIndex: isDragging ? 1000 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectComponent(component.id);
  };

  // Render appropriate component based on type
  const renderComponent = () => {
    switch (component.type) {
      case 'text-label':
        return <TextLabel component={component} />;
      case 'text-field':
        return <TextField component={component} />;
      case 'signature-box':
        return <SignatureBox component={component} />;
      // ... other types
      default:
        return <div>Unknown component</div>;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={handleClick}
      className={`
        border-2 transition-colors
        ${isSelected ? 'border-blue-500 shadow-lg' : 'border-transparent hover:border-gray-300'}
      `}
      {...listeners}
      {...attributes}
    >
      {renderComponent()}
    </div>
  );
}
```

**1.10 Component Palette**

```typescript
// components/pdf-builder/ComponentPalette.tsx
'use client';

import { useDraggable } from '@dnd-kit/core';
import { ComponentType } from '@/lib/types/document.types';

const COMPONENTS = [
  { type: 'text-label', label: 'Text Label', icon: '📝' },
  { type: 'text-field', label: 'Text Field', icon: '📄' },
  { type: 'signature-box', label: 'Signature', icon: '✍️' },
  { type: 'date-field', label: 'Date', icon: '📅' },
  { type: 'checkbox', label: 'Checkbox', icon: '☑️' },
  { type: 'table', label: 'Table', icon: '📊' },
  { type: 'image', label: 'Image', icon: '🖼️' },
  { type: 'paragraph', label: 'Paragraph', icon: '📃' },
  { type: 'divider', label: 'Divider', icon: '➖' },
];

function PaletteItem({ type, label, icon }: { type: ComponentType; label: string; icon: string }) {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: `palette-${type}`,
    data: { type, isNew: true },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="flex flex-col items-center p-4 bg-white border rounded-lg cursor-grab hover:shadow-md transition-shadow"
    >
      <span className="text-3xl mb-2">{icon}</span>
      <span className="text-sm text-gray-700">{label}</span>
    </div>
  );
}

export function ComponentPalette() {
  return (
    <div className="w-64 bg-gray-50 p-4 border-r overflow-y-auto">
      <h3 className="text-lg font-semibold mb-4">Components</h3>
      <div className="grid grid-cols-2 gap-3">
        {COMPONENTS.map((comp) => (
          <PaletteItem key={comp.type} {...comp} />
        ))}
      </div>
    </div>
  );
}
```

**1.11 DnD Context Setup**

```typescript
// app/builder/[id]/page.tsx
'use client';

import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useDocumentStore } from '@/lib/store/documentStore';
import { pxToMm, snapToGrid } from '@/lib/utils/coordinates';
import { Canvas } from '@/components/pdf-builder/Canvas';
import { ComponentPalette } from '@/components/pdf-builder/ComponentPalette';
import { PropertyPanel } from '@/components/pdf-builder/PropertyPanel';

export default function BuilderPage({ params }: { params: { id: string } }) {
  const { document, addComponent, updateComponent } = useDocumentStore();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta, over } = event;

    if (!over || over.id !== 'canvas') return;

    const data = active.data.current;

    if (data?.isNew) {
      // New component from palette
      const newComponent: Component = {
        id: crypto.randomUUID(),
        type: data.type,
        position: {
          x: snapToGrid(pxToMm(delta.x)),
          y: snapToGrid(pxToMm(delta.y)),
        },
        size: getDefaultSize(data.type),
        properties: getDefaultProperties(data.type),
      };

      addComponent(document!.currentPageId, newComponent);
    } else if (data?.component) {
      // Existing component moved
      updateComponent(data.component.id, {
        position: {
          x: snapToGrid(data.component.position.x + pxToMm(delta.x)),
          y: snapToGrid(data.component.position.y + pxToMm(delta.y)),
        },
      });
    }
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex h-screen">
        <ComponentPalette />
        <div className="flex-1">
          <Canvas />
        </div>
        <PropertyPanel />
      </div>
    </DndContext>
  );
}

function getDefaultSize(type: ComponentType): Size {
  const defaults: Record<ComponentType, Size> = {
    'text-label': { width: 40, height: 8 },
    'text-field': { width: 80, height: 10 },
    'signature-box': { width: 60, height: 20 },
    'date-field': { width: 40, height: 10 },
    checkbox: { width: 6, height: 6 },
    table: { width: 150, height: 40 },
    image: { width: 40, height: 40 },
    paragraph: { width: 150, height: 30 },
    divider: { width: 150, height: 1 },
  };

  return defaults[type];
}

function getDefaultProperties(type: ComponentType): ComponentProperties {
  // Return sensible defaults based on type
  return {
    fontSize: 12,
    fontFamily: 'Arial',
    fontWeight: 'normal',
    alignment: 'left',
    color: '#000000',
  };
}
```

---

## Phase 2: Multi-Page Support (Week 3)

### 2.1 Page Thumbnails Component

```typescript
// components/pdf-builder/PageThumbnails.tsx
'use client';

import { useDocumentStore } from '@/lib/store/documentStore';
import { Button } from '@/components/ui-primitives/buttons';

export function PageThumbnails() {
  const { document, setCurrentPage, addPage, deletePage } = useDocumentStore();

  if (!document) return null;

  return (
    <div className="w-48 bg-gray-50 border-r p-4 overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Pages</h3>
        <Button onClick={addPage} size="sm" variant="filled">
          + Add
        </Button>
      </div>

      <div className="space-y-2">
        {document.pages.map((page, index) => (
          <div
            key={page.id}
            onClick={() => setCurrentPage(page.id)}
            className={`
              relative group cursor-pointer border-2 rounded-lg overflow-hidden
              ${page.id === document.currentPageId ? 'border-blue-500' : 'border-gray-300'}
              hover:border-blue-400 transition-colors
            `}
          >
            {/* Thumbnail preview */}
            <div className="aspect-[1/1.414] bg-white p-2">
              <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">Page {index + 1}</div>
            </div>

            {/* Delete button */}
            {document.pages.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deletePage(page.id);
                }}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center transition-opacity"
              >
                ×
              </button>
            )}

            <div className="text-center text-xs py-1 bg-gray-100">Page {index + 1}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 2.2 Page Management in Store

```typescript
// Add to documentStore.ts

deletePage: (pageId: string) => set((state) => {
  if (!state.document || state.document.pages.length <= 1) return state;

  const pages = state.document.pages.filter(p => p.id !== pageId);

  // Update page numbers
  pages.forEach((page, index) => {
    page.pageNumber = index + 1;
  });

  // If deleted page was current, switch to first page
  const currentPageId = state.document.currentPageId === pageId
    ? pages[0].id
    : state.document.currentPageId;

  return {
    document: {
      ...state.document,
      pages,
      currentPageId
    }
  };
}),

duplicatePage: (pageId: string) => set((state) => {
  if (!state.document) return state;

  const pageToDuplicate = state.document.pages.find(p => p.id === pageId);
  if (!pageToDuplicate) return state;

  const newPage: Page = {
    ...pageToDuplicate,
    id: crypto.randomUUID(),
    pageNumber: state.document.pages.length + 1,
    components: pageToDuplicate.components.map(comp => ({
      ...comp,
      id: crypto.randomUUID()
    }))
  };

  return {
    document: {
      ...state.document,
      pages: [...state.document.pages, newPage],
      currentPageId: newPage.id
    }
  };
}),

reorderPages: (fromIndex: number, toIndex: number) => set((state) => {
  if (!state.document) return state;

  const pages = [...state.document.pages];
  const [removed] = pages.splice(fromIndex, 1);
  pages.splice(toIndex, 0, removed);

  // Update page numbers
  pages.forEach((page, index) => {
    page.pageNumber = index + 1;
  });

  return {
    document: {
      ...state.document,
      pages
    }
  };
}),
```

### 2.3 Backend Multi-Page Support

```csharp
// Update PdfGenerator to handle multiple pages

public static byte[] Generate(DocumentData data)
{
    var document = Document.Create(container =>
    {
        foreach (var page in data.Pages.OrderBy(p => p.PageNumber))
        {
            container.Page(pageConfig =>
            {
                pageConfig.Size(PageSizes.A4);
                pageConfig.Margin(0);

                // Header
                if (page.HeaderType != null)
                {
                    var headerContent = GetHeaderContent(data, page.HeaderType);
                    pageConfig.Header()
                        .Height(headerContent.Height, Unit.Millimetre)
                        .Element(headerContainer => RenderComponents(headerContainer, headerContent.Components));
                }

                // Content
                pageConfig.Content()
                    .Element(contentContainer => RenderComponents(contentContainer, page.Components));

                // Footer
                if (page.FooterType != null)
                {
                    var footerContent = GetFooterContent(data, page.FooterType);
                    pageConfig.Footer()
                        .Height(footerContent.Height, Unit.Millimetre)
                        .Element(footerContainer => RenderComponents(footerContainer, footerContent.Components));
                }
            });
        }
    });

    return document.GeneratePdf();
}

private static HeaderFooterContent GetHeaderContent(DocumentData data, string type)
{
    return type switch
    {
        "firstPage" => data.HeaderFooter.Header.FirstPage,
        "compact" => data.HeaderFooter.Header.Compact,
        _ => data.HeaderFooter.Header.Default
    };
}
```

---

## Phase 3: Header/Footer System (Week 4)

### 3.1 Header/Footer Editor Component

```typescript
// components/pdf-builder/HeaderFooterEditor.tsx
'use client';

import { useState } from 'react';
import { Dialog } from '@/components/ui-primitives/layout/Dialog';
import { Button } from '@/components/ui-primitives/buttons';
import { Select } from '@/components/ui-primitives/inputs';
import { useDocumentStore } from '@/lib/store/documentStore';

type EditorMode = 'header' | 'footer';
type TemplateType = 'default' | 'firstPage' | 'compact' | 'noPageNumber';

export function HeaderFooterEditor() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<EditorMode>('header');
  const [templateType, setTemplateType] = useState<TemplateType>('default');

  const { document, updateHeaderFooter } = useDocumentStore();

  if (!document) return null;

  return (
    <>
      <Button onClick={() => setIsOpen(true)} variant="outlined">
        Edit Header/Footer
      </Button>

      <Dialog isOpen={isOpen} onClose={() => setIsOpen(false)} title="Edit Header/Footer">
        <div className="space-y-4">
          {/* Mode selector */}
          <div className="flex gap-2">
            <Button onClick={() => setMode('header')} variant={mode === 'header' ? 'filled' : 'outlined'}>
              Header
            </Button>
            <Button onClick={() => setMode('footer')} variant={mode === 'footer' ? 'filled' : 'outlined'}>
              Footer
            </Button>
          </div>

          {/* Template type selector */}
          <Select
            label="Template Type"
            value={templateType}
            onChange={(e) => setTemplateType(e.target.value as TemplateType)}
            options={[
              { value: 'default', label: 'Default (all pages)' },
              { value: 'firstPage', label: 'First Page Only' },
              { value: 'compact', label: 'Compact' },
              { value: 'noPageNumber', label: 'No Page Number' },
            ]}
          />

          {/* Mini canvas for editing header/footer */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <HeaderFooterCanvas mode={mode} templateType={templateType} content={getContent(document, mode, templateType)} />
          </div>

          {/* Variable insertion */}
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2">Available Variables</h4>
            <div className="flex flex-wrap gap-2">
              {VARIABLES.map((variable) => (
                <button
                  key={variable.key}
                  onClick={() => insertVariable(variable.key)}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                >
                  {variable.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Dialog>
    </>
  );
}

const VARIABLES = [
  { key: '{{pageNumber}}', label: 'Page Number' },
  { key: '{{totalPages}}', label: 'Total Pages' },
  { key: '{{date}}', label: 'Current Date' },
  { key: '{{policyNumber}}', label: 'Policy Number' },
  { key: '{{insuredName}}', label: 'Insured Name' },
];
```

### 3.2 Variable Substitution in Backend

```csharp
// Services/VariableSubstitution.cs
public static class VariableSubstitution
{
    public static string Substitute(string text, Dictionary<string, string> variables, int pageNumber, int totalPages)
    {
        var result = text;

        // Built-in variables
        result = result.Replace("{{pageNumber}}", pageNumber.ToString());
        result = result.Replace("{{totalPages}}", totalPages.ToString());
        result = result.Replace("{{date}}", DateTime.Now.ToString("yyyy-MM-dd"));

        // Custom variables
        foreach (var (key, value) in variables)
        {
            result = result.Replace($"{{{{{key}}}}}", value);
        }

        return result;
    }
}

// Update RenderTextLabel to handle variable substitution
private static void RenderTextLabel(IContainer container, Component component, int pageNumber, int totalPages, Dictionary<string, string> variables)
{
    var text = VariableSubstitution.Substitute(
        component.Properties.Content ?? "",
        variables,
        pageNumber,
        totalPages
    );

    container.Text(text)
             .FontSize(component.Properties.FontSize ?? 12)
             .FontFamily(component.Properties.FontFamily ?? "Arial");
}
```

---

## Phase 4: Property Panel & Styling (Week 5)

### 4.1 Property Panel Component

```typescript
// components/pdf-builder/PropertyPanel.tsx
'use client';

import { useDocumentStore } from '@/lib/store/documentStore';
import { Input } from '@/components/ui-primitives/inputs';
import { Select } from '@/components/ui-primitives/inputs';
import { ColorPicker } from '@/components/ui-primitives/inputs';
import { NumberStepper } from '@/components/ui-primitives/inputs';
import { Checkbox } from '@/components/ui-primitives/inputs';

export function PropertyPanel() {
  const { document, selectedComponentId, updateComponent } = useDocumentStore();

  if (!selectedComponentId || !document) {
    return (
      <div className="w-80 bg-gray-50 border-l p-4">
        <p className="text-gray-500 text-center">Select a component to edit properties</p>
      </div>
    );
  }

  const component = document.pages.flatMap((p) => p.components).find((c) => c.id === selectedComponentId);

  if (!component) return null;

  const handlePropertyChange = (property: string, value: any) => {
    updateComponent(selectedComponentId, {
      properties: {
        ...component.properties,
        [property]: value,
      },
    });
  };

  const handlePositionChange = (axis: 'x' | 'y', value: number) => {
    updateComponent(selectedComponentId, {
      position: {
        ...component.position,
        [axis]: value,
      },
    });
  };

  const handleSizeChange = (dimension: 'width' | 'height', value: number) => {
    updateComponent(selectedComponentId, {
      size: {
        ...component.size,
        [dimension]: value,
      },
    });
  };

  return (
    <div className="w-80 bg-gray-50 border-l p-4 overflow-y-auto">
      <h3 className="font-semibold mb-4">Properties</h3>

      {/* Component Type */}
      <div className="mb-4">
        <p className="text-sm font-medium text-gray-700 mb-1">Type</p>
        <p className="text-sm text-gray-600">{component.type}</p>
      </div>

      {/* Position */}
      <div className="mb-4">
        <p className="text-sm font-medium text-gray-700 mb-2">Position</p>
        <div className="grid grid-cols-2 gap-2">
          <NumberStepper
            label="X (mm)"
            value={component.position.x}
            onChange={(value) => handlePositionChange('x', value)}
            min={0}
            max={210}
            step={1}
          />
          <NumberStepper
            label="Y (mm)"
            value={component.position.y}
            onChange={(value) => handlePositionChange('y', value)}
            min={0}
            max={297}
            step={1}
          />
        </div>
      </div>

      {/* Size */}
      <div className="mb-4">
        <p className="text-sm font-medium text-gray-700 mb-2">Size</p>
        <div className="grid grid-cols-2 gap-2">
          <NumberStepper
            label="Width (mm)"
            value={component.size.width}
            onChange={(value) => handleSizeChange('width', value)}
            min={1}
            max={210}
            step={1}
          />
          <NumberStepper
            label="Height (mm)"
            value={component.size.height}
            onChange={(value) => handleSizeChange('height', value)}
            min={1}
            max={297}
            step={1}
          />
        </div>
      </div>

      {/* Component-specific properties */}
      {renderComponentProperties(component, handlePropertyChange)}
    </div>
  );
}

function renderComponentProperties(component: Component, onChange: (prop: string, value: any) => void) {
  switch (component.type) {
    case 'text-label':
    case 'paragraph':
      return (
        <>
          <Input label="Content" value={component.properties.content || ''} onChange={(e) => onChange('content', e.target.value)} />
          <NumberStepper
            label="Font Size"
            value={component.properties.fontSize || 12}
            onChange={(value) => onChange('fontSize', value)}
            min={6}
            max={72}
          />
          <Select
            label="Font Family"
            value={component.properties.fontFamily || 'Arial'}
            onChange={(e) => onChange('fontFamily', e.target.value)}
            options={[
              { value: 'Arial', label: 'Arial' },
              { value: 'Times New Roman', label: 'Times New Roman' },
              { value: 'Courier New', label: 'Courier New' },
            ]}
          />
          <Select
            label="Font Weight"
            value={component.properties.fontWeight || 'normal'}
            onChange={(e) => onChange('fontWeight', e.target.value)}
            options={[
              { value: 'normal', label: 'Normal' },
              { value: 'bold', label: 'Bold' },
            ]}
          />
          <ColorPicker label="Color" value={component.properties.color || '#000000'} onChange={(value) => onChange('color', value)} />
        </>
      );

    case 'text-field':
      return (
        <>
          <Input label="Label" value={component.properties.label || ''} onChange={(e) => onChange('label', e.target.value)} />
          <Input
            label="Field Name"
            value={component.properties.fieldName || ''}
            onChange={(e) => onChange('fieldName', e.target.value)}
            placeholder="e.g., insuredName"
          />
          <Checkbox label="Required" checked={component.properties.required || false} onChange={(e) => onChange('required', e.target.checked)} />
        </>
      );

    case 'signature-box':
      return (
        <>
          <Input label="Signer Name" value={component.properties.signerName || ''} onChange={(e) => onChange('signerName', e.target.value)} />
          <Checkbox
            label="Include Date"
            checked={component.properties.dateRequired || false}
            onChange={(e) => onChange('dateRequired', e.target.checked)}
          />
        </>
      );

    // ... other component types

    default:
      return null;
  }
}
```

---

## Phase 5: Component Implementations (Week 6)

### 5.1 Text Field Component

```typescript
// components/pdf-builder/components/TextField.tsx
interface TextFieldProps {
  component: Component;
}

export function TextField({ component }: TextFieldProps) {
  const { label, required, fieldName } = component.properties;

  return (
    <div className="h-full flex flex-col justify-center px-2 border border-gray-300 bg-white rounded">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-600">
          {label || 'Text Field'}
          {required && <span className="text-red-500 ml-1">*</span>}
        </span>
        {fieldName && <span className="text-xs text-gray-400 italic">{fieldName}</span>}
      </div>
      <div className="border-b border-gray-400 mt-1"></div>
    </div>
  );
}
```

### 5.2 Signature Box Component

```typescript
// components/pdf-builder/components/SignatureBox.tsx
export function SignatureBox({ component }: { component: Component }) {
  const { signerName, dateRequired } = component.properties;

  return (
    <div className="h-full flex flex-col border-2 border-gray-400 rounded p-2 bg-gray-50">
      <div className="flex-1 border-b-2 border-gray-600 mb-2"></div>
      <div className="text-xs text-center text-gray-600">{signerName || 'Signature'}</div>
      {dateRequired && <div className="text-xs text-center text-gray-400 mt-1">Date: _______________</div>}
    </div>
  );
}
```

### 5.3 Backend Component Renderers

```csharp
// Services/ComponentRenderers.cs
public static class ComponentRenderers
{
    public static void RenderTextField(IContainer container, Component component)
    {
        container.Border(1).BorderColor(Colors.Grey.Lighten2)
                 .Background(Colors.White)
                 .Padding(2, Unit.Millimetre)
                 .Column(column =>
                 {
                     column.Item().Row(row =>
                     {
                         row.RelativeItem().Text(component.Properties.Label ?? "Text Field")
                            .FontSize(8).FontColor(Colors.Grey.Darken1);

                         if (component.Properties.Required == true)
                         {
                             row.AutoItem().Text("*").FontSize(8).FontColor(Colors.Red.Medium);
                         }
                     });

                     column.Item().PaddingTop(1, Unit.Millimetre)
                            .BorderBottom(1).BorderColor(Colors.Grey.Darken1);
                 });
    }

    public static void RenderSignatureBox(IContainer container, Component component)
    {
        container.Border(2).BorderColor(Colors.Grey.Darken2)
                 .Background(Colors.Grey.Lighten4)
                 .Padding(2, Unit.Millimetre)
                 .Column(column =>
                 {
                     column.Item().BorderBottom(2).BorderColor(Colors.Grey.Darken3)
                            .Height(component.Size.Height - 10, Unit.Millimetre);

                     column.Item().PaddingTop(1, Unit.Millimetre)
                            .AlignCenter()
                            .Text(component.Properties.SignerName ?? "Signature")
                            .FontSize(8).FontColor(Colors.Grey.Darken1);

                     if (component.Properties.DateRequired == true)
                     {
                         column.Item().PaddingTop(1, Unit.Millimetre)
                                .AlignCenter()
                                .Text("Date: _______________")
                                .FontSize(8).FontColor(Colors.Grey.Medium);
                     }
                 });
    }

    public static void RenderDateField(IContainer container, Component component)
    {
        container.Border(1).BorderColor(Colors.Grey.Lighten2)
                 .Padding(2, Unit.Millimetre)
                 .AlignMiddle()
                 .Row(row =>
                 {
                     row.RelativeItem().Text(component.Properties.Label ?? "Date")
                        .FontSize(10);
                     row.AutoItem().Text("____/____/________")
                        .FontSize(10).FontColor(Colors.Grey.Medium);
                 });
    }

    public static void RenderCheckbox(IContainer container, Component component)
    {
        container.Row(row =>
        {
            // Checkbox square
            row.AutoItem().Width(component.Size.Width, Unit.Millimetre)
               .Height(component.Size.Height, Unit.Millimetre)
               .Border(1).BorderColor(Colors.Black);

            // Label
            if (!string.IsNullOrEmpty(component.Properties.Label))
            {
                row.AutoItem().PaddingLeft(2, Unit.Millimetre)
                   .AlignMiddle()
                   .Text(component.Properties.Label)
                   .FontSize(10);
            }
        });
    }

    public static void RenderTable(IContainer container, Component component)
    {
        var rows = component.Properties.Rows ?? 3;
        var cols = component.Properties.Columns ?? 3;

        container.Table(table =>
        {
            // Define columns
            for (int i = 0; i < cols; i++)
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.RelativeColumn();
                });
            }

            // Render rows
            for (int i = 0; i < rows; i++)
            {
                for (int j = 0; j < cols; j++)
                {
                    table.Cell().Border(1).BorderColor(Colors.Grey.Medium)
                         .Padding(2, Unit.Millimetre)
                         .Text($"Cell {i + 1},{j + 1}")
                         .FontSize(9);
                }
            }
        });
    }

    public static void RenderParagraph(IContainer container, Component component)
    {
        container.Padding(2, Unit.Millimetre)
                 .Text(component.Properties.Content ?? "Lorem ipsum dolor sit amet...")
                 .FontSize(component.Properties.FontSize ?? 11)
                 .FontFamily(component.Properties.FontFamily ?? "Arial")
                 .LineHeight(1.5f);
    }

    public static void RenderDivider(IContainer container, Component component)
    {
        container.Height(component.Size.Height, Unit.Millimetre)
                 .Width(component.Size.Width, Unit.Millimetre)
                 .LineHorizontal(1)
                 .LineColor(component.Properties.Color ?? Colors.Grey.Darken1);
    }
}
```

---

## Phase 6: Templates & Polish (Week 7)

### 6.1 Template System

```typescript
// lib/templates/index.ts
export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnailUrl?: string;
  content: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>;
}

export const BUILTIN_TEMPLATES: Template[] = [
  {
    id: 'auto-insurance-basic',
    name: 'Auto Insurance - Basic',
    description: 'Standard auto insurance policy template',
    category: 'Auto Insurance',
    content: {
      title: 'Auto Insurance Policy',
      version: '1.0',
      pageSize: 'A4',
      currentPageId: 'page-1',
      headerFooter: {
        header: {
          default: {
            height: 30,
            components: [
              {
                id: 'header-logo',
                type: 'image',
                position: { x: 10, y: 5 },
                size: { width: 30, height: 20 },
                properties: { src: '/logo.png' },
              },
              {
                id: 'header-title',
                type: 'text-label',
                position: { x: 50, y: 12 },
                size: { width: 100, height: 8 },
                properties: {
                  content: 'AUTO INSURANCE POLICY',
                  fontSize: 14,
                  fontWeight: 'bold',
                },
              },
            ],
          },
        },
        footer: {
          default: {
            height: 20,
            components: [
              {
                id: 'footer-page',
                type: 'text-label',
                position: { x: 95, y: 5 },
                size: { width: 20, height: 6 },
                properties: {
                  content: 'Page {{pageNumber}} of {{totalPages}}',
                  fontSize: 9,
                  alignment: 'center',
                },
              },
            ],
          },
        },
      },
      pages: [
        {
          id: 'page-1',
          pageNumber: 1,
          headerType: 'default',
          footerType: 'default',
          components: [
            {
              id: 'policy-number-label',
              type: 'text-label',
              position: { x: 20, y: 50 },
              size: { width: 40, height: 8 },
              properties: {
                content: 'Policy Number:',
                fontSize: 12,
                fontWeight: 'bold',
              },
            },
            {
              id: 'policy-number-field',
              type: 'text-field',
              position: { x: 70, y: 50 },
              size: { width: 80, height: 10 },
              properties: {
                fieldName: 'policyNumber',
                required: true,
              },
            },
            // ... more pre-defined components
          ],
        },
      ],
      variables: {},
    },
  },
  // ... more templates
];
```

### 6.2 Template Selection UI

```typescript
// app/templates/page.tsx
'use client';

import { BUILTIN_TEMPLATES } from '@/lib/templates';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui-primitives/layout/Card';
import { Button } from '@/components/ui-primitives/buttons';

export default function TemplatesPage() {
  const router = useRouter();

  const createFromTemplate = async (templateId: string) => {
    const template = BUILTIN_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;

    const response = await fetch('/api/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: template.name,
        content: JSON.stringify(template.content),
      }),
    });

    const doc = await response.json();
    router.push(`/builder/${doc.id}`);
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Choose a Template</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {BUILTIN_TEMPLATES.map((template) => (
          <Card key={template.id} className="overflow-hidden">
            <div className="aspect-[1/1.414] bg-gray-100 flex items-center justify-center">
              {template.thumbnailUrl ? (
                <img src={template.thumbnailUrl} alt={template.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-400">Preview</span>
              )}
            </div>

            <div className="p-4">
              <h3 className="font-semibold text-lg mb-2">{template.name}</h3>
              <p className="text-sm text-gray-600 mb-4">{template.description}</p>
              <Button onClick={() => createFromTemplate(template.id)} variant="filled" fullWidth>
                Use Template
              </Button>
            </div>
          </Card>
        ))}

        <Card className="overflow-hidden border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors">
          <div className="text-center p-8">
            <div className="text-4xl mb-4">+</div>
            <p className="font-semibold">Blank Document</p>
            <p className="text-sm text-gray-600 mt-2">Start from scratch</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
```

### 6.3 Toolbar Component

```typescript
// components/pdf-builder/Toolbar.tsx
'use client';

import { useDocumentStore } from '@/lib/store/documentStore';
import { Button } from '@/components/ui-primitives/buttons';
import { IconButton } from '@/components/ui-primitives/buttons';

export function Toolbar() {
  const { document, selectedComponentId, deleteComponent } = useDocumentStore();

  const handleSave = async () => {
    if (!document) return;

    await fetch(`/api/documents/${document.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: JSON.stringify(document),
      }),
    });

    // Show toast notification
  };

  const handleGeneratePDF = async () => {
    if (!document) return;

    const response = await fetch(`/api/documents/${document.id}/generate-pdf`, {
      method: 'POST',
    });

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${document.title}.pdf`;
    a.click();
  };

  const handleDelete = () => {
    if (selectedComponentId) {
      deleteComponent(selectedComponentId);
    }
  };

  return (
    <div className="h-14 bg-white border-b flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <h2 className="font-semibold">{document?.title || 'Untitled Document'}</h2>
      </div>

      <div className="flex items-center gap-2">
        {selectedComponentId && <IconButton icon="delete" onClick={handleDelete} title="Delete Component" variant="outlined" />}

        <Button onClick={handleSave} variant="outlined">
          Save
        </Button>

        <Button onClick={handleGeneratePDF} variant="filled">
          Generate PDF
        </Button>
      </div>
    </div>
  );
}
```

---

## Phase 7: Testing & Refinement (Week 8)

### 7.1 Test Cases

**Frontend Tests:**

- Component drag and drop functionality
- Multi-page navigation and management
- Property panel updates
- Header/footer editing
- Variable substitution preview
- Coordinate conversion accuracy

**Backend Tests:**

- PDF generation with multiple pages
- Header/footer rendering
- Variable substitution
- Component positioning accuracy
- Font embedding

**Integration Tests:**

- Complete document creation workflow
- Template instantiation
- Save and load document
- Generate PDF matches visual design

### 7.2 Visual Comparison Tool

```typescript
// utils/visual-comparison.ts
// Tool to compare canvas screenshot with generated PDF

export async function compareVisualOutput(documentId: string) {
  // 1. Take screenshot of canvas
  const canvas = document.getElementById('pdf-canvas');
  const canvasImage = await html2canvas(canvas);

  // 2. Generate PDF and convert first page to image
  const pdfBlob = await generatePDF(documentId);
  const pdfImage = await convertPdfToImage(pdfBlob);

  // 3. Compare images pixel by pixel
  const diff = pixelmatch(canvasImage.data, pdfImage.data, null, canvasImage.width, canvasImage.height, { threshold: 0.1 });

  const diffPercentage = (diff / (canvasImage.width * canvasImage.height)) * 100;

  return {
    diffPercentage,
    canvasImage,
    pdfImage,
    isAcceptable: diffPercentage < 5, // Less than 5% difference
  };
}
```

### 7.3 Performance Optimization

```typescript
// Debounce auto-save
import { useDebouncedCallback } from 'use-debounce';

const debouncedSave = useDebouncedCallback(async (document) => {
  await fetch(`/api/documents/${document.id}`, {
    method: 'PUT',
    body: JSON.stringify({ content: JSON.stringify(document) }),
  });
}, 2000);

// Call on every document change
useEffect(() => {
  if (document) {
    debouncedSave(document);
  }
}, [document]);
```

---

## Additional Features (Optional/Future)

### Undo/Redo System

```typescript
// lib/store/historyStore.ts
interface HistoryState {
  past: Document[];
  present: Document | null;
  future: Document[];

  undo: () => void;
  redo: () => void;
  addHistory: (document: Document) => void;
}
```

### Collaboration (Real-time editing)

- WebSocket connection for multi-user editing
- Operational Transform or CRDT for conflict resolution
- User presence indicators

### Advanced Components

- **Rich Text Editor** - Formatted text with inline styles
- **QR Code** - Dynamic QR code generation
- **Barcode** - Various barcode formats
- **Chart** - Data visualization components

### Export Options

- Export as Word document (.docx)
- Export as HTML
- Export as image (PNG/JPG)

---

## Development Guidelines

### Code Style

- Use TypeScript strict mode
- Follow existing `design.md` for component styling
- Use M3 Expressive design tokens from `ui-primitives`
- Maintain consistent naming conventions
- Document complex logic with comments

### Performance Considerations

- Debounce API calls for auto-save
- Virtualize page thumbnails if > 20 pages
- Lazy load component renderers
- Optimize PDF generation (cache headers/footers)
- Use React.memo for expensive components

### Accessibility

- Keyboard navigation support
- ARIA labels for drag-and-drop
- Focus management in dialogs
- Color contrast compliance
- Screen reader announcements

### Error Handling

- Graceful degradation if PDF generation fails
- Validation before saving
- User-friendly error messages
- Rollback on failed operations
- Offline capability with local storage

---

## Deployment Checklist

**Backend:**

- [ ] PostgreSQL database created
- [ ] Connection string configured
- [ ] Migrations applied
- [ ] QuestPDF fonts embedded
- [ ] API endpoints tested
- [ ] Error logging configured

**Frontend:**

- [ ] Environment variables set
- [ ] API base URL configured
- [ ] Build optimization
- [ ] Error boundaries added
- [ ] Loading states implemented
- [ ] Toast notifications working

**Testing:**

- [ ] All component types render correctly
- [ ] Multi-page documents work
- [ ] Header/footer system functional
- [ ] Variables substitute properly
- [ ] PDF matches visual design (95%+)
- [ ] Cross-browser testing complete

---

## Success Metrics

**MVP Success Criteria:**

1. User can create a document from template
2. User can drag and drop components onto canvas
3. User can edit component properties
4. User can add/remove pages
5. User can customize header/footer
6. Generated PDF matches visual design with 95%+ accuracy
7. System handles 10+ page documents without performance issues

**Performance Targets:**

- PDF generation: < 3 seconds for 10-page document
- Canvas rendering: 60 FPS during drag operations
- Auto-save: < 500ms debounce
- Initial load: < 2 seconds

---

## Timeline Summary

| Week | Phase         | Deliverables                                         |
| ---- | ------------- | ---------------------------------------------------- |
| 1-2  | Foundation    | Backend API, Database, Canvas, DnD, Basic components |
| 3    | Multi-Page    | Page thumbnails, Add/delete pages, Navigation        |
| 4    | Header/Footer | Editor UI, Variable substitution, Templates          |
| 5    | Properties    | Property panel, All styling options                  |
| 6    | Components    | All component implementations, Renderers             |
| 7    | Templates     | Template system, Polish UI, Toolbar                  |
| 8    | Testing       | Test coverage, Visual comparison, Bug fixes          |

**Total: 8 weeks for MVP**

---

## Notes

- Start simple, iterate based on user feedback
- Insurance contracts have specific legal requirements - consult with legal team
- Consider audit trail for document changes
- Plan for version control of templates
- Think about multi-language support early

---

## Questions to Resolve

1. **Font Licensing** - Which fonts can be embedded in PDFs?
2. **Document Versioning** - How to handle document revisions?
3. **User Permissions** - Who can create/edit templates?
4. **Storage** - Where to store generated PDFs long-term?
5. **Compliance** - Any regulatory requirements for insurance documents?

---

This task document provides a comprehensive roadmap for building the PDF builder. Adjust phases and priorities based on your specific needs and resources.
