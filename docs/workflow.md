# PDF Builder - Implementation Workflow

## Overview

This document breaks down the PDF builder implementation into **small, testable, incremental steps** designed for high-quality development. Each step builds on the previous one and includes validation criteria before moving forward.

**Key Principles:**

- ✅ Build → Test → Validate → Move Forward
- ✅ Each step should be completable in 30-60 minutes
- ✅ Test immediately after building each piece
- ✅ Don't move to next step until current step works perfectly
- ✅ Keep complexity minimal initially, add sophistication later

---

## Phase 1: Backend Foundation (Day 1)

### Step 1.1: Database Setup

**Goal:** Get PostgreSQL running with basic schema

**Tasks:**

1. Create .NET 8 Web API project
2. Install packages:
   - `Npgsql.EntityFrameworkCore.PostgreSQL`
   - `Microsoft.EntityFrameworkCore.Design`
3. Create `AppDbContext.cs` with Documents table only
4. Add connection string to `appsettings.json`
5. Run migrations: `dotnet ef migrations add Initial`
6. Apply: `dotnet ef database update`

**Validation:**

```bash
# Should connect successfully and show empty documents table
psql -d pdfbuilder -c "SELECT * FROM documents;"
```

**Success Criteria:**

- ✅ Database exists
- ✅ Documents table created
- ✅ No errors in migration

---

### Step 1.2: Basic CRUD API

**Goal:** Create/Read/Update documents with JSON content

**Tasks:**

1. Create minimal API endpoints in `Program.cs`:
   - `POST /api/documents` - Create empty document
   - `GET /api/documents/{id}` - Get document by ID
   - `PUT /api/documents/{id}` - Update document content
2. Use simple JSON string for content (no complex objects yet)
3. Add CORS for local development

**Validation:**

```bash
# Test with curl or Postman
curl -X POST http://localhost:5000/api/documents \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Doc", "content": "{}"}'

# Should return created document with ID
```

**Success Criteria:**

- ✅ Can create document
- ✅ Can retrieve document by ID
- ✅ Can update document content
- ✅ Returns proper HTTP status codes

---

### Step 1.3: QuestPDF Setup (Minimal)

**Goal:** Generate simplest possible PDF

**Tasks:**

1. Install `QuestPDF` package
2. Create `PdfGenerator.cs` class
3. Implement `GenerateSimple()` method that creates A4 PDF with "Hello World"
4. Add endpoint: `POST /api/documents/{id}/generate-pdf`
5. Return PDF as file download

**Validation:**

```bash
# Generate PDF and save
curl -X POST http://localhost:5000/api/documents/{id}/generate-pdf \
  --output test.pdf

# Open test.pdf - should show "Hello World"
```

**Success Criteria:**

- ✅ PDF generates without errors
- ✅ PDF is A4 size
- ✅ Contains text "Hello World"
- ✅ Downloads properly

---

### Step 1.4: Parse JSON and Render Single Component

**Goal:** Read component data from JSON and render to PDF

**Tasks:**

1. Create simple data model:
   ```csharp
   public class ComponentData {
       public string Type { get; set; }
       public double X { get; set; }
       public double Y { get; set; }
       public string Content { get; set; }
   }
   ```
2. Update PdfGenerator to parse JSON
3. Render ONE text label at specified position
4. Test with hardcoded JSON

**Validation:**

```json
// Test document content
{
  "components": [
    {
      "type": "text-label",
      "x": 50,
      "y": 100,
      "content": "Policy Number: ABC123"
    }
  ]
}
```

**Success Criteria:**

- ✅ Text appears in PDF
- ✅ Position matches coordinates (50mm from left, 100mm from top)
- ✅ No errors in console

**⚠️ CHECKPOINT:** Backend can now generate PDFs from JSON. Test thoroughly before moving to frontend.

---

## Phase 2: Frontend Foundation (Day 2)

### Step 2.1: Next.js Setup

**Goal:** Get Next.js running with basic routing

**Tasks:**

1. Create Next.js 14 project with TypeScript
2. Install dependencies:
   ```bash
   npm install zustand @dnd-kit/core @dnd-kit/utilities
   npm install -D tailwindcss
   ```
3. Create folder structure:
   ```
   src/
   ├── app/
   │   └── builder/[id]/page.tsx
   ├── components/pdf-builder/
   ├── lib/
   │   ├── store/
   │   ├── types/
   │   └── utils/
   ```
4. Set up Tailwind CSS
5. Create placeholder builder page

**Validation:**

- Navigate to `http://localhost:3000/builder/123`
- Should show "PDF Builder - Document 123"

**Success Criteria:**

- ✅ Dev server runs without errors
- ✅ Routing works
- ✅ Tailwind styles apply

---

### Step 2.2: Type Definitions

**Goal:** Define TypeScript types for entire system

**Tasks:**

1. Create `lib/types/document.types.ts`
2. Define all interfaces from TASK.md:
   - `Document`
   - `Page`
   - `Component`
   - `Position`
   - `Size`
   - `ComponentProperties`
3. Export all types

**Validation:**

```typescript
// Should compile without errors
import { Document, Component } from '@/lib/types/document.types';

const testDoc: Document = {
  id: '123',
  title: 'Test',
  // ... rest of properties
};
```

**Success Criteria:**

- ✅ All types defined
- ✅ No TypeScript errors
- ✅ Intellisense works in VSCode

---

### Step 2.3: Coordinate Utilities

**Goal:** MM ↔ PX conversion working perfectly

**Tasks:**

1. Create `lib/utils/coordinates.ts`
2. Implement conversion functions
3. Add constants (A4 dimensions, DPI)
4. Write test cases

**Validation:**

```typescript
// Test conversions
console.log(mmToPx(210)); // Should be ~794px (A4 width)
console.log(pxToMm(794)); // Should be ~210mm
console.log(snapToGrid(45.7, 5)); // Should be 45
```

**Success Criteria:**

- ✅ Conversions are accurate (within 0.1mm)
- ✅ A4 canvas dimensions correct
- ✅ Snap to grid works

---

### Step 2.4: Zustand Store (Empty)

**Goal:** Set up state management structure

**Tasks:**

1. Create `lib/store/documentStore.ts`
2. Define store interface
3. Implement basic actions (load, update)
4. Initialize with null document
5. Add devtools for debugging

**Validation:**

```typescript
// In any component
const { document, loadDocument } = useDocumentStore();

loadDocument({
  id: '123',
  title: 'Test',
  pages: [],
  // ...
});

console.log(document); // Should show loaded document
```

**Success Criteria:**

- ✅ Store initializes
- ✅ Can load/update document
- ✅ React components can access store
- ✅ Zustand devtools work

**⚠️ CHECKPOINT:** Frontend infrastructure ready. Test store updates in browser devtools.

---

## Phase 3: Simple Canvas (Day 3)

### Step 3.1: Static Canvas

**Goal:** Display white A4 canvas with grid

**Tasks:**

1. Create `components/pdf-builder/Canvas.tsx`
2. Render white div with exact A4 dimensions in pixels
3. Add SVG grid overlay (10mm squares)
4. Center canvas on screen
5. Add gray background around canvas

**Validation:**

- Open builder page
- Should see white A4-sized rectangle with grid
- Grid squares should be 10mm (~38px)

**Success Criteria:**

- ✅ Canvas is 794px × 1123px (A4 at 96 DPI)
- ✅ Grid visible and properly sized
- ✅ Canvas centered and scrollable

---

### Step 3.2: Render One Static Component

**Goal:** Display one component on canvas (no dragging yet)

**Tasks:**

1. Create `components/pdf-builder/components/TextLabel.tsx`
2. Add one component to store's initial state
3. Render it on canvas at specified position
4. Convert mm position to px for display
5. Add border to show component boundaries

**Validation:**

```typescript
// Initial document state
{
  pages: [
    {
      id: 'page-1',
      components: [
        {
          id: 'comp-1',
          type: 'text-label',
          position: { x: 50, y: 100 }, // mm
          size: { width: 80, height: 10 },
          properties: { content: 'Hello World', fontSize: 12 },
        },
      ],
    },
  ];
}
```

**Success Criteria:**

- ✅ Component appears on canvas
- ✅ Position matches coordinates
- ✅ Text renders correctly

---

### Step 3.3: DnD Setup (Drag Existing Component)

**Goal:** Make component draggable

**Tasks:**

1. Wrap Canvas in `<DndContext>`
2. Make TextLabel draggable with `useDraggable`
3. Make Canvas droppable with `useDroppable`
4. Handle `onDragEnd` to update position in store
5. Convert delta pixels to mm and update component

**Validation:**

- Drag component around canvas
- Release mouse
- Component should stay at new position
- Check store - position should update

**Success Criteria:**

- ✅ Component is draggable
- ✅ Position updates in store
- ✅ Position persists after drag
- ✅ Snaps to 1mm grid

---

### Step 3.4: Component Selection

**Goal:** Click to select component, show selection border

**Tasks:**

1. Add `selectedComponentId` to store
2. Add click handler to component
3. Show blue border when selected
4. Click canvas background to deselect
5. Add keyboard shortcut (Delete to remove)

**Validation:**

- Click component → blue border appears
- Click canvas background → border disappears
- Press Delete → component removed

**Success Criteria:**

- ✅ Selection works
- ✅ Visual feedback clear
- ✅ Delete works
- ✅ Only one component selected at a time

**⚠️ CHECKPOINT:** Can drag and select components. This is the core interaction. Test thoroughly.

---

## Phase 4: Component Palette (Day 4)

### Step 4.1: Simple Palette UI

**Goal:** Show list of available components

**Tasks:**

1. Create `components/pdf-builder/ComponentPalette.tsx`
2. Display 3 component types (text-label, text-field, signature-box)
3. Style as cards with icons
4. Place on left side of screen
5. Make scrollable

**Validation:**

- Should see palette with 3 component types
- Icons and labels visible
- Palette doesn't block canvas

**Success Criteria:**

- ✅ Palette renders
- ✅ UI looks clean
- ✅ Responsive layout works

---

### Step 4.2: Drag from Palette

**Goal:** Drag new component from palette to canvas

**Tasks:**

1. Make palette items draggable
2. Add `isNew: true` flag to drag data
3. Update `onDragEnd` to detect new components
4. Create new component at drop position
5. Generate unique ID for new component

**Validation:**

- Drag "Text Label" from palette
- Drop on canvas
- New component should appear at drop position
- Check store - component added

**Success Criteria:**

- ✅ Can drag from palette
- ✅ New component created
- ✅ Position correct
- ✅ Component has unique ID

---

### Step 4.3: Implement 3 Component Types

**Goal:** Text Label, Text Field, Signature Box render properly

**Tasks:**

1. Create `TextField.tsx` component
2. Create `SignatureBox.tsx` component
3. Update `DraggableComponent.tsx` to render based on type
4. Add default properties for each type
5. Test dragging all 3 types

**Validation:**

- Drag each component type to canvas
- Each should render with appropriate styling
- Text Field should show input-like border
- Signature Box should show signature line

**Success Criteria:**

- ✅ All 3 types render correctly
- ✅ Visual distinction between types
- ✅ Default properties applied

**⚠️ CHECKPOINT:** Can add multiple component types. Test creating a simple form.

---

## Phase 5: Property Panel (Day 5)

### Step 5.1: Basic Property Panel UI

**Goal:** Show selected component's properties

**Tasks:**

1. Create `components/pdf-builder/PropertyPanel.tsx`
2. Show "Select a component" when nothing selected
3. When selected, show:
   - Component type (read-only)
   - Position X, Y (editable)
   - Size width, height (editable)
4. Place on right side of screen

**Validation:**

- Select component → properties appear
- Deselect → shows placeholder message
- Properties should match selected component

**Success Criteria:**

- ✅ Panel renders on right side
- ✅ Shows correct component data
- ✅ Updates when selection changes

---

### Step 5.2: Edit Position & Size

**Goal:** Change component properties via panel

**Tasks:**

1. Use `NumberStepper` from ui-primitives
2. Connect to store's `updateComponent` action
3. Update canvas in real-time as values change
4. Add min/max constraints (0-210 for X, 0-297 for Y)
5. Add step size (1mm)

**Validation:**

- Select component
- Change X value in panel
- Component should move on canvas immediately
- Change width
- Component should resize on canvas

**Success Criteria:**

- ✅ Changes reflect immediately on canvas
- ✅ Values validate (can't go negative)
- ✅ Store updates correctly

---

### Step 5.3: Type-Specific Properties

**Goal:** Show different properties based on component type

**Tasks:**

1. For Text Label: content, fontSize, fontFamily, fontWeight
2. For Text Field: label, fieldName, required
3. For Signature Box: signerName, dateRequired
4. Use `Input`, `Select`, `Checkbox` from ui-primitives
5. Organize into sections

**Validation:**

- Select Text Label → shows text properties
- Select Text Field → shows field properties
- Change values → component updates on canvas

**Success Criteria:**

- ✅ Correct properties shown per type
- ✅ All inputs functional
- ✅ UI organized and clean

**⚠️ CHECKPOINT:** Full editing workflow works (drag, select, edit properties). Test creating a simple contract.

---

## Phase 6: Backend-Frontend Integration (Day 6)

### Step 6.1: API Client Setup

**Goal:** Connect frontend to backend

**Tasks:**

1. Create `lib/utils/api.ts`
2. Implement fetch wrappers:
   ```typescript
   createDocument(title: string)
   loadDocument(id: string)
   updateDocument(id: string, content: string)
   generatePDF(id: string)
   ```
3. Add error handling
4. Add loading states

**Validation:**

```typescript
// Test API calls
const doc = await createDocument('Test');
console.log(doc.id); // Should show UUID

const loaded = await loadDocument(doc.id);
console.log(loaded); // Should match created doc
```

**Success Criteria:**

- ✅ All API calls work
- ✅ Errors handled gracefully
- ✅ TypeScript types match

---

### Step 6.2: Load Document on Page Load

**Goal:** Builder page loads document from database

**Tasks:**

1. In `app/builder/[id]/page.tsx`, fetch document on mount
2. Load into Zustand store
3. Show loading spinner while fetching
4. Handle 404 if document doesn't exist
5. Parse JSON content into Document type

**Validation:**

1. Create document via API
2. Navigate to `/builder/{id}`
3. Should load and display document
4. Components should appear on canvas

**Success Criteria:**

- ✅ Document loads from database
- ✅ Canvas shows saved components
- ✅ Loading states work
- ✅ Error handling for invalid IDs

---

### Step 6.3: Auto-Save

**Goal:** Save document changes automatically

**Tasks:**

1. Watch store for changes with `useEffect`
2. Debounce saves (2 second delay)
3. Show save status indicator ("Saving...", "Saved")
4. Only save if document actually changed
5. Handle save errors

**Validation:**

- Make changes to document
- Wait 2 seconds
- Check database - should have updated content
- See "Saved" indicator

**Success Criteria:**

- ✅ Changes persist to database
- ✅ Debouncing works (doesn't spam API)
- ✅ User feedback clear
- ✅ No data loss

---

### Step 6.4: Generate PDF Button

**Goal:** User can generate and download PDF

**Tasks:**

1. Create `Toolbar.tsx` component at top
2. Add "Generate PDF" button
3. On click:
   - Send current document to backend
   - Backend generates PDF
   - Download file to user's computer
4. Show loading state during generation
5. Handle errors (show toast)

**Validation:**

- Create document with components
- Click "Generate PDF"
- PDF downloads
- Open PDF - should match canvas layout

**Success Criteria:**

- ✅ PDF generates
- ✅ PDF downloads automatically
- ✅ Components in PDF match canvas positions
- ✅ Loading states work

**⚠️ CHECKPOINT:** Complete round-trip: create → edit → save → generate PDF. This is the MVP core loop!

---

## Phase 7: Multi-Page Support (Day 7)

### Step 7.1: Page Thumbnails UI

**Goal:** Show list of pages in sidebar

**Tasks:**

1. Create `PageThumbnails.tsx` component
2. Show simple list of pages (Page 1, Page 2, etc.)
3. Highlight current page
4. Click to switch pages
5. Add "+ Add Page" button at bottom

**Validation:**

- Initialize document with 2 pages
- See both pages in sidebar
- Click Page 2 → canvas switches to page 2
- Current page highlighted

**Success Criteria:**

- ✅ All pages shown
- ✅ Switching works
- ✅ Visual feedback for current page

---

### Step 7.2: Add/Delete Pages

**Goal:** Manage multiple pages

**Tasks:**

1. Implement `addPage` in store
2. Implement `deletePage` in store (with confirmation)
3. Wire up "+ Add Page" button
4. Add delete button on each page thumbnail (show on hover)
5. Prevent deleting last page
6. Update page numbers after deletion

**Validation:**

- Click "+ Add Page" → new blank page created
- Click delete on Page 2 → shows confirmation
- Confirm → Page 2 deleted, numbering updates
- Try to delete last page → disabled/blocked

**Success Criteria:**

- ✅ Can add pages
- ✅ Can delete pages (except last)
- ✅ Page numbers update correctly
- ✅ Current page handles deletion gracefully

---

### Step 7.3: Update Backend for Multi-Page

**Goal:** Backend renders multiple pages to PDF

**Tasks:**

1. Update `PdfGenerator` to loop through pages
2. Render each page in order
3. Ensure components only appear on their page
4. Test with 3-page document

**Validation:**

- Create 3-page document
- Add different components to each page
- Generate PDF
- PDF should have 3 pages
- Each page should show only its components

**Success Criteria:**

- ✅ PDF has correct number of pages
- ✅ Components on correct pages
- ✅ Page sizing consistent

---

### Step 7.4: Copy Page Functionality

**Goal:** Duplicate existing page

**Tasks:**

1. Implement `duplicatePage` in store
2. Deep clone all components with new IDs
3. Add "Duplicate" button to page thumbnails
4. New page appears after current page

**Validation:**

- Create page with 3 components
- Click "Duplicate"
- New page created with same 3 components
- Edit component on new page
- Original page unchanged

**Success Criteria:**

- ✅ Duplication works
- ✅ Components truly cloned (not referenced)
- ✅ IDs are unique

**⚠️ CHECKPOINT:** Multi-page documents work end-to-end. Create 3-page insurance contract and test.

---

## Phase 8: Header/Footer System (Day 8-9)

### Step 8.1: Simple Global Header

**Goal:** Add header that appears on all pages

**Tasks:**

1. Add `headerFooter` to document structure in store
2. Create simple default header with:
   - Company logo placeholder (just a colored box for now)
   - Title text "AUTO INSURANCE POLICY"
3. Render header on canvas above content area
4. Make header area non-editable (different background)
5. Add visual separator line

**Validation:**

- Open any page
- Should see header at top
- Header should be 30mm tall
- Content area starts below header

**Success Criteria:**

- ✅ Header appears on canvas
- ✅ Clearly separated from content
- ✅ Same on all pages

---

### Step 8.2: Simple Global Footer

**Goal:** Add footer with page number

**Tasks:**

1. Add footer to document structure
2. Create default footer with centered text: "Page X of Y"
3. Render footer at bottom of canvas
4. Implement variable substitution for page numbers

**Validation:**

- Footer appears on all pages
- Page 1 shows "Page 1 of 3"
- Page 2 shows "Page 2 of 3"
- Page numbers update when pages added/deleted

**Success Criteria:**

- ✅ Footer renders correctly
- ✅ Page numbers accurate
- ✅ Updates dynamically

---

### Step 8.3: Update Backend for Headers/Footers

**Goal:** PDF includes headers and footers

**Tasks:**

1. Update `PdfGenerator` to render header section
2. Render footer section with page numbers
3. Use QuestPDF's `.Header()` and `.Footer()` methods
4. Implement variable substitution in backend

**Validation:**

- Generate PDF
- Each page should have header and footer
- Page numbers should be correct
- Layout should match canvas

**Success Criteria:**

- ✅ Headers render in PDF
- ✅ Footers render in PDF
- ✅ Variables substitute correctly
- ✅ Matches canvas layout

---

### Step 8.4: Header/Footer Editor (Basic)

**Goal:** Let user customize header/footer text

**Tasks:**

1. Create `HeaderFooterEditor.tsx` dialog
2. Show current header/footer content
3. Allow editing text content
4. Save changes to store
5. Update canvas and PDF

**Validation:**

- Click "Edit Header" button
- Dialog opens with current header
- Change text to "MY INSURANCE COMPANY"
- Save
- Header updates on canvas

**Success Criteria:**

- ✅ Editor opens
- ✅ Shows current content
- ✅ Changes apply immediately
- ✅ Saves to database

---

### Step 8.5: Per-Page Header Overrides

**Goal:** Allow different header on first page

**Tasks:**

1. Add "First Page Header" template to document
2. Add dropdown in page properties: "Use header: Default / First Page / None"
3. Render appropriate header based on page selection
4. Update backend to handle header selection

**Validation:**

- Set Page 1 to use "First Page" header
- Set Pages 2-3 to use "Default" header
- First page shows different header
- Other pages show default header
- PDF matches

**Success Criteria:**

- ✅ Can select header per page
- ✅ Different headers render correctly
- ✅ PDF matches canvas

**⚠️ CHECKPOINT:** Header/footer system functional. Test with realistic insurance contract structure.

---

## Phase 9: Remaining Components (Day 10)

### Step 9.1: Date Field Component

**Goal:** Add date input component

**Tasks:**

1. Create `DateField.tsx` frontend component
2. Render with date format placeholder (MM/DD/YYYY)
3. Add backend renderer
4. Add to component palette
5. Test drag, edit, PDF generation

**Success Criteria:**

- ✅ Date field works like other components
- ✅ Renders in PDF correctly

---

### Step 9.2: Checkbox Component

**Goal:** Add checkbox with label

**Tasks:**

1. Create `Checkbox.tsx` frontend component
2. Render as small square with label
3. Add backend renderer
4. Add to palette

**Success Criteria:**

- ✅ Checkbox renders correctly
- ✅ Appears in PDF

---

### Step 9.3: Paragraph Component

**Goal:** Multi-line text block

**Tasks:**

1. Create `Paragraph.tsx` frontend component
2. Support multi-line content
3. Add text wrapping
4. Add backend renderer with line height

**Success Criteria:**

- ✅ Text wraps correctly
- ✅ PDF matches canvas

---

### Step 9.4: Divider Component

**Goal:** Horizontal/vertical lines

**Tasks:**

1. Create `Divider.tsx` frontend component
2. Render as simple line
3. Support thickness and color
4. Add backend renderer

**Success Criteria:**

- ✅ Line renders correctly
- ✅ Thickness adjustable

---

### Step 9.5: Table Component (Basic)

**Goal:** Simple table with rows/columns

**Tasks:**

1. Create `Table.tsx` frontend component
2. Default 3×3 grid
3. Show cell borders
4. Add backend renderer using QuestPDF table
5. Make rows/columns configurable in properties

**Success Criteria:**

- ✅ Table renders with grid
- ✅ Configurable dimensions
- ✅ PDF renders table correctly

**⚠️ CHECKPOINT:** All component types implemented. Build a complete insurance contract using all types.

---

## Phase 10: Templates (Day 11)

### Step 10.1: Template Data Structure

**Goal:** Define and store templates

**Tasks:**

1. Create `lib/templates/index.ts`
2. Define `Template` interface
3. Create 1 hardcoded template: "Auto Insurance - Basic"
4. Template should have pre-placed components

**Success Criteria:**

- ✅ Template structure defined
- ✅ Sample template complete

---

### Step 10.2: Template Gallery Page

**Goal:** Show available templates

**Tasks:**

1. Create `app/templates/page.tsx`
2. Display template cards in grid
3. Show template name, description, thumbnail
4. Add "Blank Document" option
5. Style using ui-primitives Card component

**Success Criteria:**

- ✅ Templates display in grid
- ✅ UI looks professional
- ✅ Responsive layout

---

### Step 10.3: Create from Template

**Goal:** Instantiate template as new document

**Tasks:**

1. Add click handler to template card
2. Call API to create new document
3. Copy template content to new document
4. Redirect to builder page with new document ID
5. Test creating multiple documents from template

**Validation:**

- Click "Auto Insurance - Basic" template
- New document created
- Redirected to builder
- Canvas shows template components
- Can edit and save changes

**Success Criteria:**

- ✅ Template instantiation works
- ✅ New document independent from template
- ✅ All components copied correctly

---

### Step 10.4: Save as Template (Admin)

**Goal:** Convert document to reusable template

**Tasks:**

1. Add "Save as Template" button in toolbar
2. Show dialog to enter template name/description
3. Save to templates table in database
4. Add basic validation (name required)

**Success Criteria:**

- ✅ Can save document as template
- ✅ Template appears in gallery
- ✅ Can instantiate saved template

**⚠️ CHECKPOINT:** Template system complete. Create 2-3 insurance templates and test workflow.

---

## Phase 11: Polish & UX (Day 12)

### Step 11.1: Keyboard Shortcuts

**Goal:** Common actions via keyboard

**Tasks:**

1. Delete: Delete selected component
2. Ctrl+S: Manual save
3. Ctrl+Z: Undo (if time permits)
4. Arrow keys: Nudge component position
5. Show keyboard shortcuts in help menu

**Success Criteria:**

- ✅ Shortcuts work
- ✅ Don't conflict with browser shortcuts
- ✅ Documented for users

---

### Step 11.2: Loading States

**Goal:** Show feedback during async operations

**Tasks:**

1. Add spinners for:
   - Loading document
   - Generating PDF
   - Saving
2. Use `LoadingState` from ui-primitives
3. Disable actions during loading
4. Show "Generating PDF..." message

**Success Criteria:**

- ✅ Loading states clear
- ✅ No jarring transitions
- ✅ User knows what's happening

---

### Step 11.3: Error Handling

**Goal:** Graceful error messages

**Tasks:**

1. Add toast notifications using `Toast` from ui-primitives
2. Show toasts for:
   - Save success/failure
   - PDF generation errors
   - Network errors
3. Add error boundaries in React
4. Log errors to console

**Success Criteria:**

- ✅ Errors don't crash app
- ✅ User sees helpful messages
- ✅ Can recover from errors

---

### Step 11.4: Visual Polish

**Goal:** Professional appearance

**Tasks:**

1. Refine component styling:
   - Hover states
   - Focus states
   - Transitions
2. Add shadows and depth
3. Improve grid visibility (toggle on/off)
4. Add ruler/measurements on canvas edges
5. Smooth animations for drag/drop

**Success Criteria:**

- ✅ UI feels polished
- ✅ Animations smooth (60fps)
- ✅ Follows M3 Expressive design

---

### Step 11.5: Responsive Layout

**Goal:** Works on different screen sizes

**Tasks:**

1. Test on 1920×1080, 1366×768, 1280×720
2. Make sidebars collapsible on small screens
3. Ensure canvas scrollable
4. Adjust property panel for narrow screens

**Success Criteria:**

- ✅ Usable on 1280×720 and up
- ✅ No horizontal scroll on main view
- ✅ All controls accessible

**⚠️ CHECKPOINT:** App is polished and production-ready. Get user feedback!

---

## Phase 12: Testing & Validation (Day 13)

### Step 12.1: Manual Testing Checklist

**Goal:** Verify all features work

**Test Cases:**

1. ✅ Create new document from blank
2. ✅ Create document from template
3. ✅ Add components of each type
4. ✅ Drag and position components
5. ✅ Edit properties via panel
6. ✅ Add/delete/reorder pages
7. ✅ Customize header/footer
8. ✅ Save changes (auto and manual)
9. ✅ Generate PDF
10. ✅ PDF matches canvas (verify 5+ components)
11. ✅ Keyboard shortcuts work
12. ✅ Error handling works (disconnect network and test)
13. ✅ Create 5-page document and test performance

---

### Step 12.2: Visual Comparison Test

**Goal:** Verify PDF matches canvas

**Tasks:**

1. Create test document with:
   - Text at multiple positions
   - Different font sizes
   - Signature boxes
   - Tables
   - Multiple pages
2. Generate PDF
3. Compare side-by-side
4. Measure differences
5. Target: < 5% visual difference

**Success Criteria:**

- ✅ Positions within 1mm
- ✅ Text sizes match
- ✅ Fonts render consistently
- ✅ Overall layout identical

---

### Step 12.3: Performance Testing

**Goal:** Ensure system performs well

**Tests:**

1. Load time for 1-page document: < 1 second
2. Load time for 10-page document: < 3 seconds
3. Drag operations: 60fps (no stuttering)
4. PDF generation for 10 pages: < 5 seconds
5. Canvas with 50+ components: still responsive

**Success Criteria:**

- ✅ All targets met
- ✅ No performance regressions
- ✅ Memory usage reasonable

---

### Step 12.4: Bug Fixes

**Goal:** Fix all critical bugs

**Process:**

1. Create bug list from testing
2. Prioritize: Critical → High → Medium → Low
3. Fix critical and high bugs
4. Re-test fixed bugs
5. Document known low-priority issues for later

**Success Criteria:**

- ✅ No critical bugs remain
- ✅ No high-priority bugs remain
- ✅ Medium bugs documented

**⚠️ CHECKPOINT:** App is stable and tested. Ready for deployment!

---

## Phase 13: Deployment Prep (Day 14)

### Step 13.1: Environment Configuration

**Goal:** Proper config for production

**Tasks:**

1. Create production `appsettings.json`
2. Set up environment variables:
   - Database connection string
   - CORS origins
   - API URL for frontend
3. Add `.env.example` files
4. Document configuration

**Success Criteria:**

- ✅ Config secure (no hardcoded secrets)
- ✅ Documentation clear
- ✅ Easy to deploy

---

### Step 13.2: Database Migration Strategy

**Goal:** Production database setup

**Tasks:**

1. Generate final migration
2. Create seed data script (templates)
3. Document database setup steps
4. Test on clean database

**Success Criteria:**

- ✅ Migration runs successfully
- ✅ Seed data loads
- ✅ Instructions clear

---

### Step 13.3: Build & Deploy

**Goal:** Deploy to server

**Tasks:**

1. Build frontend: `npm run build`
2. Build backend: `dotnet publish`
3. Deploy to hosting (Docker, VPS, cloud)
4. Configure reverse proxy (nginx/similar)
5. Set up SSL certificate
6. Test in production

**Success Criteria:**

- ✅ App accessible via HTTPS
- ✅ All features work in production
- ✅ Performance acceptable

---

## Summary: Quality Checkpoints

After each major phase, validate:

**✅ Phase 1-2 (Backend + Frontend Foundation):**

- Can load document from database
- Components render on canvas
- State management works

**✅ Phase 3-5 (Core Editing):**

- Full drag-and-drop works
- All 3 initial component types functional
- Property editing updates canvas

**✅ Phase 6 (Integration):**

- Complete round-trip: create → edit → save → PDF
- Auto-save works
- PDF downloads

**✅ Phase 7-8 (Multi-Page + Headers):**

- Multi-page documents work
- Headers/footers appear correctly
- PDF has multiple pages with headers/footers

**✅ Phase 9-10 (Components + Templates):**

- All component types implemented
- Template system functional
- Can create complex documents

**✅ Phase 11-13 (Polish + Deploy):**

- Professional UI/UX
- No critical bugs
- Deployed and accessible

---

## Tips for High-Quality Development

### 1. Test Immediately

After writing each piece of code, test it before moving on. Don't accumulate untested code.

### 2. Start Simple

Build the simplest version that works, then add complexity. Don't over-engineer.

### 3. Use Console Logging

Add `console.log` statements liberally to understand what's happening. Remove later.

### 4. Check TypeScript Errors

Run `tsc --noEmit` frequently to catch type errors early.

### 5. Git Commits

Commit after each completed step with clear message: "Step 3.2: Implement DnD for existing components"

### 6. Take Breaks

Don't rush. Quality over speed. Take breaks between phases.

### 7. Ask for Clarification

If any step is unclear, ask before implementing. Don't guess.

### 8. Compare with TASK.md

Reference TASK.md frequently to ensure you're building what was specified.

### 9. Test in Multiple Browsers

Test in Chrome, Firefox, Safari (if available) during Phase 11.

### 10. Document Decisions

If you deviate from the plan or make a technical decision, document why in code comments.

---

## Common Pitfalls to Avoid

❌ **Don't skip validation steps** - Each checkpoint is there for a reason
❌ **Don't build everything at once** - Small, incremental steps
❌ **Don't ignore TypeScript errors** - Fix them immediately
❌ **Don't forget coordinate conversion** - Always convert mm ↔ px
❌ **Don't hardcode values** - Use constants and config
❌ **Don't skip error handling** - Add try-catch blocks
❌ **Don't forget to test PDF output** - Canvas matching PDF is critical
❌ **Don't over-optimize prematurely** - Get it working first, then optimize

---

## Success Criteria for MVP

By end of Day 14, you should have:

1. ✅ Working PDF builder application
2. ✅ 9 component types fully functional
3. ✅ Multi-page support with headers/footers
4. ✅ Template system with 2-3 templates
5. ✅ Generated PDFs match canvas with 95%+ accuracy
6. ✅ Professional UI following M3 Expressive design
7. ✅ No critical bugs
8. ✅ Deployed and accessible
9. ✅ Documentation complete
10. ✅ Ready for user testing

**Total estimated time: 10-14 days of focused development**

Good luck! 🚀
