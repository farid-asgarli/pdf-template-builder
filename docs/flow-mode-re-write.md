# Flow Mode Rewrite - Implementation Plan

## Overview

This document outlines the complete rewrite of the PDF Template Builder to use a **flow-based layout system** instead of absolute positioning. The new system will leverage QuestPDF's native layout capabilities for automatic page breaks, vertical/horizontal flow, and professional document features.

---

## Phase 1: Backend Data Model Restructure

### Task 1.1: Define New Core Data Structures

**Goal:** Replace the absolute positioning model with a flow-based hierarchical model.

**Steps:**

1. Remove `Position` (x, y) from component base - components no longer have absolute coordinates
2. Remove `Size` (width, height) as fixed values - replace with flexible sizing options
3. Create new `FlowSize` model with options: `Auto`, `Fixed`, `Relative` (percentage), `Fill`
4. Create `Spacing` model for margins/padding with individual sides
5. Create `FlowDirection` enum: `Vertical`, `Horizontal`
6. Remove `LayoutConfig` (autoExpand, pushSiblings) - no longer needed as flow handles this naturally

### Task 1.2: Create Container Component Type

**Goal:** Introduce a container concept that can hold child components and define layout direction.

**Steps:**

1. Create `ContainerComponent` as a new component type
2. Container has `direction` property: vertical (Column) or horizontal (Row)
3. Container has `children` array of components
4. Container has `spacing` between children
5. Container has `alignment` options (start, center, end, stretch, space-between)
6. For horizontal containers, children can have `relativeSize` (like Row's RelativeItem) or `fixedSize` (like ConstantItem) or `autoSize`

### Task 1.3: Restructure Page Model

**Goal:** Separate page into distinct zones that each serve a purpose.

**Steps:**

1. Page has `background` property - optional component/image rendered behind everything
2. Page has `foreground` property - optional component/image rendered on top (watermarks)
3. Page has `header` property - optional container that repeats on every page (fixed height)
4. Page has `footer` property - optional container that repeats on every page (fixed height)
5. Page has `content` property - the main flowing content container
6. Remove `components` array from page - replaced by the structured zones above
7. Add page `margins` property for content area margins

### Task 1.4: Update Component Base Model

**Goal:** Simplify component model for flow-based rendering.

**Steps:**

1. Keep `id`, `type`, `condition` properties
2. Add `width` property with type `FlowSize` (auto, fixed in mm, percentage, fill)
3. Add `height` property with type `FlowSize` (auto, fixed in mm, fill)
4. Add `margin` property for outer spacing
5. Add `padding` property for inner spacing
6. Add `alignment` property for self-alignment within parent
7. Add `zIndex` property for layering within the same container level

### Task 1.5: Create Layer Component Type

**Goal:** Support absolute positioning within a flowing context for overlays.

**Steps:**

1. Create `LayerComponent` type that can contain multiple layers
2. Has `primaryContent` - the main content that determines size and flows
3. Has `backgroundLayers` array - components rendered behind primary content
4. Has `foregroundLayers` array - components rendered in front of primary content
5. Background/foreground layer items have `offsetX`, `offsetY` for positioning within the layer bounds
6. This enables signatures over text, stamps on paragraphs, etc.

### Task 1.6: Update Individual Component Types

**Goal:** Adjust each component type for flow-based rendering.

**Steps:**

1. **TextLabel**: Remove position/size, add text alignment, keep font properties
2. **Paragraph**: Remove position/size, add text alignment and justification options
3. **Table**: Remove position/size, columns define relative widths, rows flow naturally
4. **Image**: Remove position/size, add fit mode (fill, fit, stretch, original), aspect ratio preservation option
5. **Divider**: Remove position/size, has thickness and orientation (horizontal/vertical)
6. **Checkbox**: Remove position/size, has label position option (left/right)
7. **Rectangle**: Remove position/size, has background color, border, corner radius

---

## Phase 2: Backend Rendering Engine Rewrite

### Task 2.1: Create Flow Renderer Service

**Goal:** New service that translates flow-based document model to QuestPDF.

**Steps:**

1. Create `FlowRenderer` class to replace current rendering approach
2. Entry point takes the document model and returns QuestPDF document
3. Uses recursive rendering - containers render their children recursively

### Task 2.2: Implement Page Rendering

**Goal:** Render page structure with zones.

**Steps:**

1. Create page with configured size and margins
2. If page has `background`, render using `page.Background()`
3. If page has `foreground`, render using `page.Foreground()`
4. If page has `header`, render using `page.Header()` with fixed height
5. If page has `footer`, render using `page.Footer()` with fixed height
6. Render `content` using `page.Content()` - this is where flow happens

### Task 2.3: Implement Container Rendering

**Goal:** Render containers as Column or Row based on direction.

**Steps:**

1. If direction is vertical, use QuestPDF `Column`
2. If direction is horizontal, use QuestPDF `Row`
3. Apply spacing between items using `.Spacing()` method
4. For each child component, create appropriate item type:
   - Vertical: `column.Item()` for each child
   - Horizontal: `row.RelativeItem(n)`, `row.ConstantItem(size)`, or `row.AutoItem()` based on child's width setting
5. Apply alignment settings to the container

### Task 2.4: Implement Size Resolution

**Goal:** Translate FlowSize model to QuestPDF constraints.

**Steps:**

1. `Auto` size: Let content determine size (default behavior)
2. `Fixed` size: Use `.Width(x)` or `.Height(x)` with unit
3. `Relative` size: For horizontal items, use `RelativeItem(percentage/100)`
4. `Fill` size: Use `.Extend()` to fill available space
5. Handle `MinWidth`, `MaxWidth`, `MinHeight`, `MaxHeight` constraints if specified

### Task 2.5: Implement Layer Rendering

**Goal:** Render LayerComponent using QuestPDF Layers.

**Steps:**

1. Use `.Layers()` container
2. Render background layers first using `.Layer()` with `TranslateX/Y` for offsets
3. Render primary content using `.PrimaryLayer()`
4. Render foreground layers last using `.Layer()` with `TranslateX/Y` for offsets
5. Apply `ZIndex` if specified for ordering

### Task 2.6: Implement Individual Component Renderers

**Goal:** Update each component renderer for flow context.

**Steps:**

1. Create renderer method for each component type
2. Renderers receive a QuestPDF container and the component data
3. Renderers no longer handle positioning - just content and styling
4. Apply padding/margin from component properties
5. Keep existing styling logic (fonts, colors, borders, etc.)

### Task 2.7: Implement Conditional Rendering

**Goal:** Support conditional visibility based on data context.

**Steps:**

1. Before rendering any component, evaluate its `condition` property
2. If condition is false, skip rendering entirely (use `.ShowIf()` or just don't render)
3. Keep existing condition evaluation logic from template engine

### Task 2.8: Remove Old Rendering Code

**Goal:** Clean up legacy absolute positioning code.

**Steps:**

1. Delete `LayoutEngine.cs` - no longer needed
2. Remove absolute positioning logic from `PdfDocument.cs`
3. Remove `Layers` usage for absolute positioning of all components
4. Remove `TranslateX/Y` usage for component positioning (keep for layer offsets only)
5. Remove `Unconstrained` usage for bypassing layout

---

## Phase 3: Frontend Type Updates

### Task 3.1: Update Core TypeScript Types

**Goal:** Match frontend types to new backend model.

**Steps:**

1. Create `FlowSize` type: `{ type: 'auto' | 'fixed' | 'relative' | 'fill', value?: number }`
2. Create `Spacing` type: `{ top?: number, right?: number, bottom?: number, left?: number }`
3. Create `FlowDirection` type: `'vertical' | 'horizontal'`
4. Create `Alignment` type for various alignment options
5. Remove `Position` interface
6. Update `Size` to optional or replace with `FlowSize`

### Task 3.2: Update Component Types

**Goal:** Update all component type definitions.

**Steps:**

1. Remove `position` from base `Component` interface
2. Remove fixed `size` from base `Component` interface
3. Add `width?: FlowSize` and `height?: FlowSize`
4. Add `margin?: Spacing` and `padding?: Spacing`
5. Add `alignment?: Alignment`
6. Create `ContainerComponent` interface with `direction`, `children`, `spacing`
7. Create `LayerComponent` interface with `primaryContent`, `backgroundLayers`, `foregroundLayers`

### Task 3.3: Update Page Type

**Goal:** Match page type to new structure.

**Steps:**

1. Remove `components` array
2. Add `background?: Component`
3. Add `foreground?: Component`
4. Add `header?: ContainerComponent`
5. Add `footer?: ContainerComponent`
6. Add `content: ContainerComponent`
7. Add `margins?: Spacing`

### Task 3.4: Remove Obsolete Types and Helpers

**Goal:** Clean up code that's no longer relevant.

**Steps:**

1. Remove `LayoutConfig` interface
2. Remove `DEFAULT_LAYOUT_CONFIG`
3. Remove `supportsAutoExpand` function
4. Remove `getDefaultLayoutConfig` function
5. Remove any position/overlap calculation utilities

---

## Phase 4: Frontend Store Rewrite

### Task 4.1: Restructure Document Store State

**Goal:** Update store to work with hierarchical component model.

**Steps:**

1. Remove flat `components` array concept
2. Page now contains nested structure: header, footer, content (each with children)
3. Create helper to find component by ID in nested structure
4. Create helper to find parent container of a component
5. Create helper to get component path (for breadcrumb navigation)

### Task 4.2: Update Component CRUD Operations

**Goal:** Rewrite add/update/delete for nested structure.

**Steps:**

1. `addComponent`: Takes parent container ID and position (index) within children array
2. `updateComponent`: Find by ID in nested structure, update properties
3. `deleteComponent`: Find by ID, remove from parent's children array
4. `moveComponent`: Remove from source parent, add to target parent at specified index
5. `duplicateComponent`: Deep clone including any nested children

### Task 4.3: Implement Drag-and-Drop Reordering

**Goal:** Support reordering components within and between containers.

**Steps:**

1. Track source container ID and index
2. Track target container ID and index
3. On drop: remove from source, insert at target
4. Validate: ensure component type is valid for target container
5. Handle nested containers (dragging a container with children)

### Task 4.4: Create Default Document Structure

**Goal:** New documents start with proper flow structure.

**Steps:**

1. New page has empty vertical content container by default
2. Optionally create with header/footer containers
3. Helper functions to add standard sections (header row, content column, etc.)

---

## Phase 5: Frontend Canvas Rewrite

### Task 5.1: Replace Absolute Canvas with Flow Preview

**Goal:** New canvas that shows flow-based layout preview.

**Steps:**

1. Remove coordinate-based component positioning
2. Render components in their hierarchical order
3. Containers show as visual groups with direction indicator
4. Components show approximate size based on content or specified dimensions
5. Maintain 1:1 scale with actual PDF output where possible

### Task 5.2: Implement Visual Container Indicators

**Goal:** Make container hierarchy visible and understandable.

**Steps:**

1. Show container boundaries with subtle borders/backgrounds
2. Indicate flow direction with arrow or icon (↓ for vertical, → for horizontal)
3. Show spacing between items visually
4. Highlight selected container with distinct style
5. Show drop zones when dragging components

### Task 5.3: Implement Component Selection in Hierarchy

**Goal:** Select components within nested structure.

**Steps:**

1. Click on component selects it and shows in property panel
2. Click on container selects the container (not children)
3. Double-click on container enters it (focuses children for selection)
4. Breadcrumb navigation shows current path: Page > Header > Row > Logo
5. Keyboard navigation: arrow keys to move between siblings, enter to go into container, escape to go up

### Task 5.4: Implement Drag-and-Drop in Canvas

**Goal:** Drag components to reorder or move between containers.

**Steps:**

1. Drag handle on each component
2. While dragging, show valid drop zones
3. Drop zones appear between components and inside empty containers
4. Visual feedback for invalid drops
5. Support drag from component palette to canvas

### Task 5.5: Remove Resize Handles

**Goal:** Components no longer freely resizable.

**Steps:**

1. Remove corner/edge resize handles from components
2. Size is controlled via property panel (width/height settings)
3. Optionally show size adjustment controls in property panel (slider, input)
4. Containers can have spacing adjusted via property panel

---

## Phase 6: Frontend Property Panel Updates

### Task 6.1: Update Common Properties Section

**Goal:** New properties for flow-based layout.

**Steps:**

1. Remove X, Y position inputs
2. Remove fixed Width, Height inputs (replace with flow-based)
3. Add Width setting: dropdown (Auto, Fixed, Relative%, Fill) + value input
4. Add Height setting: dropdown (Auto, Fixed, Fill) + value input
5. Add Margin controls (4-sided or unified)
6. Add Padding controls (4-sided or unified)
7. Add Alignment dropdown

### Task 6.2: Create Container Properties Section

**Goal:** Properties specific to container components.

**Steps:**

1. Direction toggle: Vertical / Horizontal
2. Spacing input (gap between children)
3. Child alignment options
4. Wrap setting for horizontal containers (wrap to next line or not)
5. Show children count and allow expand/collapse in panel

### Task 6.3: Create Layer Properties Section

**Goal:** Properties for layer components.

**Steps:**

1. List of background layers with add/remove
2. List of foreground layers with add/remove
3. Each layer item shows offset X, Y inputs
4. Reorder layers via drag or up/down buttons

### Task 6.4: Update Page Properties Section

**Goal:** New page-level settings.

**Steps:**

1. Page size and orientation (keep existing)
2. Page margins (4-sided)
3. Background settings (color, image, or component reference)
4. Foreground/watermark settings (image, text, opacity)
5. Header settings: enable/disable, fixed height
6. Footer settings: enable/disable, fixed height

---

## Phase 7: Frontend Component Palette Updates

### Task 7.1: Reorganize Component Categories

**Goal:** New organization reflecting flow concepts.

**Steps:**

1. **Layout** category: Container (Vertical), Container (Horizontal), Layer
2. **Content** category: Text Label, Paragraph, Image
3. **Data** category: Table, List, Repeater
4. **Form** category: Checkbox, Input Field (future)
5. **Decorative** category: Divider, Rectangle, Spacer

### Task 7.2: Create Container Component Palette Items

**Goal:** Easy way to add layout containers.

**Steps:**

1. Vertical Container: Creates Column-style container
2. Horizontal Container: Creates Row-style container
3. Two Column Layout: Pre-built horizontal container with two equal children
4. Three Column Layout: Pre-built horizontal container with three equal children
5. Header + Content + Footer: Pre-built page structure

### Task 7.3: Create Spacer Component

**Goal:** Empty component for creating gaps.

**Steps:**

1. New `Spacer` component type
2. Has only width and height properties
3. Renders as empty space
4. Useful for pushing content or creating fixed gaps

---

## Phase 8: Template Structure View

### Task 8.1: Create Tree View Component

**Goal:** Hierarchical view of document structure.

**Steps:**

1. Tree view showing page structure
2. Nodes for: Page > Header/Content/Footer > Containers > Components
3. Expand/collapse containers
4. Drag-and-drop reordering in tree
5. Click to select and scroll canvas to component

### Task 8.2: Implement Tree-Canvas Synchronization

**Goal:** Selection syncs between tree and canvas.

**Steps:**

1. Selecting in tree highlights in canvas and shows in property panel
2. Selecting in canvas highlights in tree
3. Double-click in tree focuses that level in canvas
4. Context menu in tree for quick actions (delete, duplicate, wrap in container)

---

## Phase 9: Migration and Cleanup

### Task 9.1: Delete Legacy Code - Backend

**Goal:** Remove all obsolete backend code.

**Steps:**

1. Delete `LayoutEngine.cs`
2. Remove old component position/size handling in models
3. Remove absolute positioning rendering logic
4. Clean up unused imports and references

### Task 9.2: Delete Legacy Code - Frontend

**Goal:** Remove all obsolete frontend code.

**Steps:**

1. Remove position-based drag logic
2. Remove resize handle components
3. Remove overlap detection utilities
4. Remove layout config UI components
5. Clean up unused imports and types

### Task 9.3: Update API Contracts

**Goal:** Ensure API reflects new model.

**Steps:**

1. Update DTOs to match new document structure
2. Update API documentation
3. Ensure serialization/deserialization works correctly
4. Test with sample documents

---

## Phase 10: Testing and Polish

### Task 10.1: Create Test Documents

**Goal:** Verify all features work correctly.

**Steps:**

1. Simple single-column document
2. Two-column layout document
3. Document with header and footer
4. Document with watermark
5. Document with table spanning multiple pages
6. Document with layer (signature over text)
7. Document with nested containers
8. Document with conditional content

### Task 10.2: Performance Testing

**Goal:** Ensure reasonable performance.

**Steps:**

1. Test with large documents (50+ pages)
2. Test with many components (100+ per page)
3. Test with complex nested structures (5+ levels deep)
4. Optimize any bottlenecks found

### Task 10.3: UI/UX Polish

**Goal:** Smooth user experience.

**Steps:**

1. Clear visual feedback for all interactions
2. Helpful error messages for invalid operations
3. Tooltips explaining layout concepts
4. Keyboard shortcuts for common actions
5. Undo/redo works correctly with new structure

---

## Implementation Order Recommendation

1. **Phase 1** (Backend Models) - Foundation for everything
2. **Phase 3** (Frontend Types) - Keep types in sync
3. **Phase 2** (Backend Rendering) - Get PDF output working
4. **Phase 4** (Frontend Store) - State management for new model
5. **Phase 5** (Frontend Canvas) - Visual editing
6. **Phase 6** (Frontend Property Panel) - Property editing
7. **Phase 7** (Component Palette) - Adding components
8. **Phase 8** (Tree View) - Structure navigation
9. **Phase 9** (Cleanup) - Remove old code
10. **Phase 10** (Testing) - Verify and polish

---

## Key Design Decisions

1. **No backward compatibility** - Clean break from absolute positioning
2. **Containers are first-class** - Layout is explicit via container components
3. **Flow is default** - Content flows naturally, absolute positioning only via Layers
4. **Recursive structure** - Containers can contain containers (unlimited nesting)
5. **Page zones are fixed** - Header/Footer don't flow, Content does
6. **Size is flexible** - Auto, fixed, relative, or fill options
7. **Layers for overlays** - Signatures, stamps, watermarks use Layer component

---

## Notes

- All measurements should use millimeters for consistency with PDF
- The canvas preview should closely match PDF output
- Consider adding "preview mode" that renders actual PDF for comparison
- Template variables (`{{variable}}`) work the same way in flow mode
- Conditional rendering (`{{#if}}`) can show/hide any component or container
