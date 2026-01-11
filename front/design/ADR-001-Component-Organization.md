# ADR-001: Component Organization and Single Source of Truth

**Status**: Accepted  
**Date**: December 30, 2024  
**Context**: Dashboard module implementation

---

## Problem

Claude Opus 4.5 is creating duplicate components, violating M3 Expressive principles, and producing inconsistent code because there is no single source of truth for:

- Which components exist
- How to compose them
- What design patterns to follow
- What NOT to do

This leads to:

- Multiple implementations of the same UI element
- Inconsistent styling (wrong border radius, wrong colors, wrong shapes)
- Duplicated utility functions
- Code that doesn't match design.md specifications

---

## Decision

We will enforce a **strict hierarchy** with these rules:

### 1. Component Hierarchy

```
Pages (thin orchestrators)
  ↓
Layout Components (app shell)
  ↓
Feature Components (domain logic)
  ↓
UI Components (design system primitives)
  ↓
Utility Functions (shared logic)
```

**Rule**: Each layer can ONLY import from layers below it. Never sideways or upward.

### 2. Single Source of Truth

- **COMPONENT_INDEX.md**: The authoritative list of all components
- **design.md**: The authoritative design system specification
- **Before creating ANY component**: Check COMPONENT_INDEX.md
- **If it exists**: Use it, don't recreate it
- **If it doesn't exist**: Add it to the index after creation

### 3. UI Component Rules

**UI components (`/components/ui`):**

- ✅ Zero business logic
- ✅ Use CVA for variant management
- ✅ Follow M3 Expressive principles exactly
- ✅ Accept `className` prop for composition
- ✅ Forward refs for DOM access
- ❌ No API calls
- ❌ No route navigation
- ❌ No domain-specific knowledge

**Feature components (`/components/features`):**

- ✅ Compose UI components
- ✅ Contain domain logic
- ✅ Handle API calls
- ✅ Manage local state
- ❌ Cannot create custom UI primitives
- ❌ Must use UI components for all visual elements

**Pages (`/pages`):**

- ✅ Maximum 50 lines of code
- ✅ Compose layout + feature components
- ✅ Handle routing
- ✅ Manage page-level state
- ❌ No direct UI primitives (must use features/layouts)
- ❌ No business logic (delegate to features)

### 4. M3 Expressive Non-Negotiables

These rules from design.md are **ABSOLUTE**:

| Element   | Rule                    | Never                               |
| --------- | ----------------------- | ----------------------------------- |
| Buttons   | `rounded-full`          | rounded-lg, rounded-xl, rounded-2xl |
| Buttons   | `border-2`              | border, border-1                    |
| Cards     | `rounded-2xl` base      | rounded-lg, rounded-xl              |
| Cards     | Shape morphing on hover | Static border radius                |
| Inputs    | `rounded-2xl`           | rounded-lg, rounded-full            |
| Inputs    | `border-2`              | border, border-1                    |
| Elevation | Color + border          | box-shadow (except toasts)          |
| Colors    | CSS custom properties   | Arbitrary hex values                |
| Spacing   | Tailwind scale          | Arbitrary px values                 |

### 5. Composition Over Creation

**Always prefer:**

```tsx
// ✅ CORRECT: Compose existing components
<Card variant="interactive">
  <CardHeader>
    <h3>Title</h3>
  </CardHeader>
  <CardContent>
    <Button variant="filled">Action</Button>
  </CardContent>
</Card>

// ❌ WRONG: Create custom styled div
<div className="rounded-xl bg-white p-4 border">
  <div className="font-semibold mb-2">Title</div>
  <div>
    <button className="bg-blue-500 px-4 py-2 rounded-lg">Action</button>
  </div>
</div>
```

---

## Consequences

### Positive

1. **Single source of truth**: No ambiguity about which component to use
2. **Consistency**: All code follows M3 Expressive principles
3. **No duplication**: Clear hierarchy prevents recreating existing components
4. **Easier debugging**: Know exactly where to find component implementations
5. **Better Claude output**: Clear constraints lead to predictable results

### Negative

1. **Requires discipline**: Must check index before every component creation
2. **Initial overhead**: Setting up the system takes time
3. **Less flexibility**: Can't quickly prototype with one-off components

### Mitigation

- **For prototyping**: Create in `/components/experimental` folder, migrate later
- **For variants**: Extend existing components, don't create new ones
- **For urgency**: Still check COMPONENT_INDEX.md first, mark TODOs for cleanup

---

## Implementation Plan

### Phase 1: Documentation (DONE)

- ✅ Create COMPONENT_INDEX.md
- ✅ Create ADR-001
- ⏳ Create COMPOSITION_PATTERNS.md
- ⏳ Create ANTI_PATTERNS.md
- ⏳ Create CLAUDE_PROMPTS.md

### Phase 2: Audit Dashboard Module

- [ ] List all existing components in `/src/components`
- [ ] Identify duplicates
- [ ] Identify violations of M3 Expressive
- [ ] Create refactoring plan

### Phase 3: Establish Baseline

- [ ] Create template components for each UI primitive
- [ ] Add them to COMPONENT_INDEX.md
- [ ] Document composition patterns

### Phase 4: Refactor Dashboard

- [ ] Start with UI components layer
- [ ] Then feature components
- [ ] Then pages
- [ ] Update COMPONENT_INDEX.md as we go

---

## Verification Checklist

Before merging any component, verify:

```
□ Component is listed in COMPONENT_INDEX.md
□ If it's a UI component:
  □ Uses CVA for variants
  □ Follows M3 Expressive shape rules
  □ Uses semantic color tokens
  □ No business logic
  □ Forwards refs
  □ Accepts className prop

□ If it's a feature component:
  □ Composes UI components (not raw HTML)
  □ No custom button/card/input styling
  □ Business logic is present and appropriate

□ If it's a page:
  □ Under 50 lines
  □ Composes layout + features
  □ No direct UI primitives

□ All components:
  □ No shadows (except Toast)
  □ No arbitrary colors
  □ No arbitrary spacing
  □ Proper TypeScript types
  □ Accessible (ARIA, keyboard nav)
```

---

## References

- COMPONENT_INDEX.md
- design.md (Material Design 3 Expressive)
- [M3 Foundations](https://m3.material.io/foundations)
- [M3 Expressive Research](https://design.google/library/expressive-material-design-google-research)

---

## Approval

**Author**: System Architect  
**Reviewers**: Development Team  
**Status**: Accepted and in effect immediately

---

## Change Log

| Date       | Change          | Reason                        |
| ---------- | --------------- | ----------------------------- |
| 2024-12-30 | Initial version | Establish component hierarchy |
