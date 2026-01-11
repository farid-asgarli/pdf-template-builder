# Component Index - Single Source of Truth

> **CRITICAL**: Before creating ANY component, check this index first.  
> **RULE**: If it exists here, you MUST use it. Do NOT create duplicates.

---

## UI Primitives (`/components/ui`)

### Actions

#### Button

- **Location**: `/components/ui/Button.tsx`
- **Variants**: `filled` | `tonal` | `outlined` | `ghost` | `elevated` | `destructive` | `destructive-outline` | `destructive-tonal`
- **Sizes**: `sm` (36px) | `default` (44px) | `lg` (48px) | `xl` (56px)
- **Shape**: `rounded-full` (ALWAYS - this is M3 Expressive)
- **DO NOT CREATE**:
  - Custom button components with different styling
  - Buttons with `rounded-lg`, `rounded-xl`, or `rounded-2xl`
  - Buttons without `border-2`
- **Usage**:
  ```tsx
  <Button variant="filled" size="default">Primary Action</Button>
  <Button variant="tonal">Secondary Action</Button>
  <Button variant="outlined">Tertiary Action</Button>
  ```

#### IconButton

- **Location**: `/components/ui/IconButton.tsx`
- **Sizes**: `sm` (32px) | `default` (40px) | `lg` (48px) | `xl` (56px)
- **Shape**: Circular (ALWAYS)
- **Variants**: Same as Button
- **DO NOT CREATE**: Square icon buttons, custom icon wrappers
- **Usage**:
  ```tsx
  <IconButton variant="ghost" size="default">
    <Settings className="h-5 w-5" />
  </IconButton>
  ```

#### FAB (Floating Action Button)

- **Location**: `/components/ui/FAB.tsx`
- **Variants**: `primary` | `secondary` | `tertiary` | `extended`
- **Position**: Fixed at bottom-right (mobile) or contextual
- **Shape**: `rounded-full` for icon-only, `rounded-3xl` for extended
- **DO NOT CREATE**: Custom floating buttons, alternative FAB styles
- **Usage**:

  ```tsx
  <FAB variant="primary" position="bottom-right">
    <Plus className="h-6 w-6" />
  </FAB>

  <FAB variant="extended" position="bottom-right">
    <Plus className="h-5 w-5" />
    New Survey
  </FAB>
  ```

---

### Containers

#### Card

- **Location**: `/components/ui/Card.tsx`
- **Variants**: `default` | `surface` | `outlined` | `glass` | `tonal` | `interactive`
- **Shape Options**: `default` (24px) | `compact` (12px) | `prominent` (32px) | `rounded` (16px)
- **Shape Morphing**: Stationary → Hover → Focus (e.g., 24px → 36px → 48px)
- **Composition**: `Card`, `CardHeader`, `CardContent`, `CardFooter`
- **DO NOT CREATE**:
  - Custom divs with card-like styling
  - Cards with `shadow-*` utilities
  - Cards without border-radius transitions
- **Usage**:
  ```tsx
  <Card variant="default" shapeOption="default">
    <CardHeader>
      <h3>Card Title</h3>
    </CardHeader>
    <CardContent>Content goes here</CardContent>
  </Card>
  ```

#### Dialog

- **Location**: `/components/ui/Dialog.tsx`
- **Sizes**: `sm` (400px) | `default` (500px) | `lg` (600px) | `xl` (800px) | `full`
- **Shape**: `rounded-3xl` (24px - FIXED)
- **Background**: `surface-container`
- **Backdrop**: `bg-black/60 backdrop-blur-sm`
- **DO NOT CREATE**: Custom modals, alternative dialog wrappers
- **Usage**:
  ```tsx
  <Dialog open={isOpen} onOpenChange={setIsOpen}>
    <DialogContent size="default">
      <DialogHeader>
        <DialogTitle>Dialog Title</DialogTitle>
      </DialogHeader>
      {/* Content */}
    </DialogContent>
  </Dialog>
  ```

#### Drawer

- **Location**: `/components/ui/Drawer.tsx`
- **Direction**: `left` | `right` (default)
- **Sizes**: `sm` (320px) | `default` (400px) | `lg` (500px) | `xl` (600px)
- **Shape**: No rounded corners on screen edge side
- **DO NOT CREATE**: Side panels, custom slide-in components
- **Usage**:
  ```tsx
  <Drawer open={isOpen} onOpenChange={setIsOpen} direction="right">
    <DrawerContent size="default">{/* Content */}</DrawerContent>
  </Drawer>
  ```

---

### Forms

#### Input

- **Location**: `/components/ui/Input.tsx`
- **Variants**: `outline` (default) | `filled` | `ghost`
- **Sizes**: `sm` (36px) | `default` (44px) | `lg` (48px)
- **Shape**: `rounded-2xl` (16px - FIXED)
- **Border**: `border-2` (ALWAYS)
- **States**: default, focus, error, disabled
- **DO NOT CREATE**: Custom text inputs, alternative input styles
- **Usage**:
  ```tsx
  <Input variant="outline" size="default" placeholder="Enter text..." error={!!errors.field} />
  ```

#### Textarea

- **Location**: `/components/ui/Textarea.tsx`
- **Same styling as Input**: `rounded-2xl`, `border-2`
- **Variants**: `outline` | `filled` | `ghost`
- **Sizes**: `sm` | `default` | `lg`
- **DO NOT CREATE**: Custom textarea components
- **Usage**:
  ```tsx
  <Textarea variant="outline" rows={4} placeholder="Enter description..." />
  ```

#### Select

- **Location**: `/components/ui/Select.tsx`
- **Same styling as Input**: `rounded-2xl`, `border-2`
- **Custom Dropdown**: Uses Radix UI Select
- **DO NOT CREATE**: Native `<select>` elements, custom dropdowns
- **Usage**:
  ```tsx
  <Select value={value} onValueChange={setValue}>
    <SelectTrigger>
      <SelectValue placeholder="Select option" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="1">Option 1</SelectItem>
    </SelectContent>
  </Select>
  ```

#### Checkbox

- **Location**: `/components/ui/Checkbox.tsx`
- **Shape**: `rounded-lg` (12px - FIXED)
- **Size**: 20px × 20px
- **Check Icon**: Custom SVG with `strokeWidth: 3`
- **DO NOT CREATE**: Custom checkbox implementations
- **Usage**:
  ```tsx
  <Checkbox checked={isChecked} onCheckedChange={setIsChecked} />
  ```

#### Radio

- **Location**: `/components/ui/Radio.tsx`
- **Shape**: Circular (ALWAYS)
- **Size**: 20px × 20px
- **Indicator**: Inner circle
- **DO NOT CREATE**: Custom radio implementations
- **Usage**:
  ```tsx
  <RadioGroup value={value} onValueChange={setValue}>
    <Radio value="1" label="Option 1" />
    <Radio value="2" label="Option 2" />
  </RadioGroup>
  ```

#### Switch

- **Location**: `/components/ui/Switch.tsx`
- **Shape**: Pill track with circular thumb
- **Size**: 44px × 24px (default)
- **DO NOT CREATE**: Toggle switches, custom switch components
- **Usage**:
  ```tsx
  <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
  ```

#### SelectionCard

- **Location**: `/components/ui/SelectionCard.tsx`
- **Type**: `radio` | `checkbox`
- **Shape**: Inherits from Card (rounded-2xl base)
- **States**: Unselected, selected, hover, disabled
- **DO NOT CREATE**: Custom selection cards, radio/checkbox cards
- **Usage**:
  ```tsx
  <SelectionCard type="radio" value="option1" checked={selected === 'option1'} onChange={() => setSelected('option1')}>
    <SelectionCardContent>{/* Content */}</SelectionCardContent>
  </SelectionCard>
  ```

---

### Display

#### Badge

- **Location**: `/components/ui/Badge.tsx`
- **Variants**: `default` | `secondary` | `tertiary` | `error` | `warning` | `success` | `info` | `outline`
- **Sizes**: `sm` (20px) | `default` (24px) | `lg` (28px) | `dot` (10px)
- **Shape**: `rounded-full` (ALWAYS)
- **DO NOT CREATE**: Custom badges, status indicators with different shapes
- **Usage**:
  ```tsx
  <Badge variant="success" size="default">Active</Badge>
  <Badge variant="error" size="sm">Error</Badge>
  <Badge variant="dot" />
  ```

#### Chip

- **Location**: `/components/ui/Chip.tsx`
- **Variants**: `assist` | `filter` | `filter-selected` | `input` | `suggestion` | `success` | `warning` | `error`
- **Sizes**: `sm` (24px) | `default` (32px) | `lg` (40px)
- **Shape**: `rounded-full` (ALWAYS)
- **Features**: Dismissible, with icon, avatar support
- **DO NOT CREATE**: Tags, pills, custom chip components
- **Usage**:
  ```tsx
  <Chip variant="filter" dismissible onDismiss={handleRemove}>
    Filter Label
  </Chip>
  ```

#### Avatar

- **Location**: `/components/ui/Avatar.tsx`
- **Sizes**: `xs` (24px) | `sm` (32px) | `default` (40px) | `lg` (48px) | `xl` (56px)
- **Shape**: Circular (ALWAYS)
- **Fallback**: Initials with colored background
- **DO NOT CREATE**: Custom avatar components, profile pictures
- **Usage**:
  ```tsx
  <Avatar src="/avatar.jpg" alt="Sarah M" size="default" />
  <Avatar fallback="SM" size="default" />
  ```

#### Stat

- **Location**: `/components/ui/Stat.tsx`
- **Layout**: Large number + label + optional trend indicator
- **Variants**: `default` | `primary` | `success` | `error` | `warning`
- **DO NOT CREATE**: Custom metric displays, stat cards
- **Usage**:
  ```tsx
  <Stat value="100" label="Total Responses" trend={{ value: 12, direction: 'up' }} variant="success" />
  ```

#### IconContainer

- **Location**: `/components/ui/IconContainer.tsx`
- **Sizes**: `sm` (32px) | `default` (40px) | `lg` (48px) | `xl` (56px)
- **Variants**: `primary` | `secondary` | `tertiary` | `error` | `warning` | `success` | `info`
- **Shape**: `rounded-2xl` to `rounded-full` (configurable)
- **DO NOT CREATE**: Custom icon wrappers
- **Usage**:
  ```tsx
  <IconContainer variant="primary" size="default" shape="rounded">
    <ChartBar className="h-5 w-5" />
  </IconContainer>
  ```

---

### Feedback

#### Toast

- **Location**: `/components/ui/Toast.tsx`
- **Library**: react-hot-toast wrapper
- **Variants**: `default` | `success` | `error` | `warning` | `info`
- **Position**: Top-center (default) | configurable
- **DO NOT CREATE**: Custom notification systems
- **Usage**:

  ```tsx
  import { toast } from 'react-hot-toast';

  toast.success('Survey published!');
  toast.error('Failed to save');
  ```

#### Progress

- **Location**: `/components/ui/Progress.tsx`
- **Variants**: `linear` | `circular`
- **Determinate/Indeterminate**: Both supported
- **DO NOT CREATE**: Custom loading bars, spinners
- **Usage**:
  ```tsx
  <Progress variant="linear" value={60} max={100} />
  <Progress variant="circular" indeterminate />
  ```

#### LoadingState

- **Location**: `/components/ui/LoadingState.tsx`
- **Type**: Full page/section loading overlay
- **Variants**: `spinner` | `skeleton` | `dots`
- **DO NOT CREATE**: Custom loading overlays
- **Usage**:
  ```tsx
  <LoadingState variant="spinner" message="Loading surveys..." />
  ```

#### Skeleton

- **Location**: `/components/ui/Skeleton.tsx`
- **Shapes**: `text` | `circle` | `rectangle`
- **Animation**: Shimmer effect (M3 compliant)
- **DO NOT CREATE**: Custom skeleton loaders
- **Usage**:
  ```tsx
  <Skeleton variant="text" lines={3} />
  <Skeleton variant="circle" size={48} />
  ```

#### EmptyState

- **Location**: `/components/ui/EmptyState.tsx`
- **Layout**: Icon + heading + description + optional action
- **DO NOT CREATE**: Custom empty states, "no data" components
- **Usage**:
  ```tsx
  <EmptyState
    icon={<Inbox className="h-12 w-12" />}
    title="No surveys yet"
    description="Create your first survey to get started"
    action={<Button variant="filled">Create Survey</Button>}
  />
  ```

---

### Navigation

#### Tabs

- **Location**: `/components/ui/Tabs.tsx`
- **Variants**: `underline` | `pills` | `segmented`
- **Shape**:
  - Pills/Segmented container: `rounded-full`
  - Individual tabs: `rounded-full`
- **DO NOT CREATE**: Custom tab implementations
- **Usage**:
  ```tsx
  <Tabs variant="pills" value={activeTab} onValueChange={setActiveTab}>
    <TabsList>
      <TabsTrigger value="all">All</TabsTrigger>
      <TabsTrigger value="active">Active</TabsTrigger>
    </TabsList>
    <TabsContent value="all">{/* Content */}</TabsContent>
  </Tabs>
  ```

#### Menu

- **Location**: `/components/ui/Menu.tsx`
- **Library**: Radix UI DropdownMenu wrapper
- **Shape**: `rounded-2xl` (16px)
- **DO NOT CREATE**: Custom dropdown menus, context menus
- **Usage**:
  ```tsx
  <Menu>
    <MenuTrigger asChild>
      <IconButton variant="ghost">
        <MoreVertical className="h-5 w-5" />
      </IconButton>
    </MenuTrigger>
    <MenuContent>
      <MenuItem>Edit</MenuItem>
      <MenuItem>Delete</MenuItem>
    </MenuContent>
  </Menu>
  ```

#### Breadcrumbs

- **Location**: `/components/ui/Breadcrumbs.tsx`
- **Separator**: Chevron icon
- **DO NOT CREATE**: Custom breadcrumb components
- **Usage**:
  ```tsx
  <Breadcrumbs>
    <BreadcrumbItem href="/surveys">Surveys</BreadcrumbItem>
    <BreadcrumbItem>Survey Builder</BreadcrumbItem>
  </Breadcrumbs>
  ```

#### Tooltip

- **Location**: `/components/ui/Tooltip.tsx`
- **Library**: Radix UI Tooltip wrapper
- **Delay**: 300ms hover delay
- **DO NOT CREATE**: Custom tooltip implementations
- **Usage**:
  ```tsx
  <Tooltip content="Delete survey">
    <IconButton variant="ghost">
      <Trash2 className="h-5 w-5" />
    </IconButton>
  </Tooltip>
  ```

---

## Layout Components (`/components/layout`)

### App Shell

#### Layout

- **Location**: `/components/layout/Layout.tsx`
- **Structure**: NavRail + Content Area + Mobile Nav
- **DO NOT CREATE**: Alternative layout wrappers
- **Usage**: Wrap all authenticated pages

#### NavigationRail

- **Location**: `/components/layout/NavigationRail.tsx`
- **Width**: 88px (w-22)
- **Background**: `surface-container-lowest`
- **Items**: Icon + label, max 8 items
- **DO NOT CREATE**: Custom sidebars, alternative navigation

#### NavigationBar

- **Location**: `/components/layout/NavigationBar.tsx`
- **Height**: 72px (h-18)
- **Position**: Fixed bottom (mobile only)
- **Items**: Max 5 items with icon + label
- **DO NOT CREATE**: Custom bottom navigation

#### AppBar

- **Location**: `/components/layout/AppBar.tsx`
- **Height**: 56px (h-14)
- **Usage**: Mobile header with title + actions
- **DO NOT CREATE**: Custom top bars, headers

#### PageHeader

- **Location**: `/components/layout/PageHeader.tsx`
- **Layout**: Title + description + actions + optional back button
- **DO NOT CREATE**: Custom page headers
- **Usage**:
  ```tsx
  <PageHeader title="Surveys" description="Create and manage your surveys" action={<Button variant="filled">New Survey</Button>} />
  ```

#### ListPageLayout

- **Location**: `/components/layout/ListPageLayout.tsx`
- **Slots**: Toolbar, filters, content, FAB
- **DO NOT CREATE**: Custom list page structures
- **Usage**:
  ```tsx
  <ListPageLayout toolbar={<Toolbar />} filters={<Filters />} content={<SurveyList />} fab={<FAB>New</FAB>} />
  ```

---

## Feature Components (`/components/features`)

### Surveys (`/features/surveys`)

#### SurveyCard

- **Location**: `/components/features/surveys/SurveyCard.tsx`
- **Composes**: `Card`, `Badge`, `IconButton`, `Menu`
- **Props**: Survey data, actions (edit, delete, duplicate)
- **DO NOT CREATE**: Alternative survey list items
- **Usage**:
  ```tsx
  <SurveyCard survey={surveyData} onEdit={handleEdit} onDelete={handleDelete} />
  ```

#### SurveyStatusBadge

- **Location**: `/components/features/surveys/SurveyStatusBadge.tsx`
- **Composes**: `Badge`
- **Variants**: Maps survey status to badge variants
- **DO NOT CREATE**: Custom status indicators
- **Usage**:
  ```tsx
  <SurveyStatusBadge status="active" />
  ```

#### CreateSurveyDialog

- **Location**: `/components/features/surveys/CreateSurveyDialog.tsx`
- **Composes**: `Dialog`, `Input`, `Select`, `Button`
- **Steps**: Single-step or wizard
- **DO NOT CREATE**: Alternative survey creation dialogs

---

## Utility Functions (`/lib`)

### Core Utils

#### cn (classnames utility)

- **Location**: `/lib/utils.ts`
- **Function**: Merges Tailwind classes with proper precedence
- **DO NOT CREATE**: Alternative className merging functions
- **Usage**:

  ```tsx
  import { cn } from '@/lib/utils';

  <div className={cn('base-classes', conditionalClass && 'conditional', className)} />;
  ```

#### Date Utils

- **Location**: `/lib/date-utils.ts`
- **Functions**: `formatDate`, `formatRelativeTime`, `parseDate`
- **DO NOT CREATE**: Custom date formatters
- **Usage**:

  ```tsx
  import { formatDate, formatRelativeTime } from '@/lib/date-utils';

  formatDate(date, 'MMM dd, yyyy'); // "Dec 30, 2024"
  formatRelativeTime(date); // "2 hours ago"
  ```

#### URL Utils

- **Location**: `/lib/url-utils.ts`
- **Functions**: `createQueryString`, `parseQueryString`
- **DO NOT CREATE**: Custom URL parameter handlers

---

## Rules Summary

### ✅ ALWAYS DO

1. Check this index before creating ANY component
2. Use existing components by importing them
3. Follow M3 Expressive principles (no shadows, proper shapes)
4. Use CVA for variant management
5. Use semantic color tokens from CSS custom properties
6. Compose existing components instead of creating new ones

### ❌ NEVER DO

1. Create duplicate components with similar functionality
2. Create custom variants without adding them to the source component
3. Use arbitrary colors outside the design system palette
4. Add shadows (except toasts)
5. Use rounded values not in the design system (only: full, 2xl, 3xl, lg)
6. Create custom button/card/input styles - extend the existing components

---

## Before Creating a Component - Checklist

```
□ I checked COMPONENT_INDEX.md
□ This component does NOT already exist
□ I cannot achieve this by composing existing UI components
□ I've identified which existing components I will compose
□ I will follow M3 Expressive principles from design.md
□ I will use CVA for variants
□ I will NOT duplicate utility functions
□ I will add this component to COMPONENT_INDEX.md after creation
```

---

## Quick Reference

| Need              | Use Component                          | Location                                |
| ----------------- | -------------------------------------- | --------------------------------------- |
| Action button     | `Button`                               | `/components/ui/Button.tsx`             |
| Icon-only button  | `IconButton`                           | `/components/ui/IconButton.tsx`         |
| Primary action    | `FAB`                                  | `/components/ui/FAB.tsx`                |
| Content container | `Card`                                 | `/components/ui/Card.tsx`               |
| Modal             | `Dialog`                               | `/components/ui/Dialog.tsx`             |
| Side panel        | `Drawer`                               | `/components/ui/Drawer.tsx`             |
| Text input        | `Input`                                | `/components/ui/Input.tsx`              |
| Multi-line input  | `Textarea`                             | `/components/ui/Textarea.tsx`           |
| Dropdown          | `Select`                               | `/components/ui/Select.tsx`             |
| Checkbox          | `Checkbox`                             | `/components/ui/Checkbox.tsx`           |
| Radio button      | `Radio`                                | `/components/ui/Radio.tsx`              |
| Toggle            | `Switch`                               | `/components/ui/Switch.tsx`             |
| Visual selection  | `SelectionCard`                        | `/components/ui/SelectionCard.tsx`      |
| Status indicator  | `Badge`                                | `/components/ui/Badge.tsx`              |
| Tag/filter        | `Chip`                                 | `/components/ui/Chip.tsx`               |
| User picture      | `Avatar`                               | `/components/ui/Avatar.tsx`             |
| Metric display    | `Stat`                                 | `/components/ui/Stat.tsx`               |
| Notification      | `Toast`                                | `/components/ui/Toast.tsx`              |
| Loading           | `Progress`, `LoadingState`, `Skeleton` | `/components/ui/`                       |
| Empty state       | `EmptyState`                           | `/components/ui/EmptyState.tsx`         |
| Tabs              | `Tabs`                                 | `/components/ui/Tabs.tsx`               |
| Dropdown menu     | `Menu`                                 | `/components/ui/Menu.tsx`               |
| Navigation trail  | `Breadcrumbs`                          | `/components/ui/Breadcrumbs.tsx`        |
| Hint on hover     | `Tooltip`                              | `/components/ui/Tooltip.tsx`            |
| Page wrapper      | `Layout`                               | `/components/layout/Layout.tsx`         |
| Page header       | `PageHeader`                           | `/components/layout/PageHeader.tsx`     |
| List page         | `ListPageLayout`                       | `/components/layout/ListPageLayout.tsx` |

---

**Last Updated**: December 30, 2024
