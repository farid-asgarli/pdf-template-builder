# Composition Patterns - How to Build Features

> **Rule**: Always compose existing UI components. Never create custom styled elements.

---

## Pattern 1: Survey Card

### ❌ WRONG: Custom Implementation

```tsx
// DON'T DO THIS
export function SurveyCard({ survey }: { survey: Survey }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{survey.title}</h3>
          <p className="text-sm text-gray-500">{survey.description}</p>
        </div>
        <span className="px-2 py-1 text-xs rounded-lg bg-green-100 text-green-800">{survey.status}</span>
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-600">
        <span>{survey.responseCount} responses</span>
        <span>• {survey.createdAt}</span>
      </div>

      <div className="mt-4 flex gap-2">
        <button className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600">View</button>
        <button className="px-4 py-2 border border-gray-300 rounded-full hover:bg-gray-50">Edit</button>
      </div>
    </div>
  );
}
```

**Problems:**

- ❌ Custom div instead of `Card` component
- ❌ Wrong border radius (`rounded-xl` instead of `rounded-2xl`)
- ❌ Using shadow (`hover:shadow-lg`) - violates M3 Expressive
- ❌ Custom badge styling instead of `Badge` component
- ❌ Custom buttons instead of `Button` component
- ❌ Arbitrary colors (`bg-white`, `text-gray-500`)
- ❌ No shape morphing on hover

### ✅ CORRECT: Compose UI Components

```tsx
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/date-utils';
import { cn } from '@/lib/utils';

interface SurveyCardProps {
  survey: Survey;
  onView?: () => void;
  onEdit?: () => void;
  className?: string;
}

export function SurveyCard({ survey, onView, onEdit, className }: SurveyCardProps) {
  return (
    <Card variant="interactive" shapeOption="default" className={cn('cursor-pointer', className)} onClick={onView}>
      <CardHeader className="flex flex-row items-start justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-on-surface">{survey.title}</h3>
          <p className="text-sm text-on-surface-variant">{survey.description}</p>
        </div>

        <Badge variant={getStatusVariant(survey.status)} size="default">
          {survey.status}
        </Badge>
      </CardHeader>

      <CardContent className="flex items-center gap-4 text-sm text-on-surface-variant">
        <span>{survey.responseCount} responses</span>
        <span>•</span>
        <span>{formatDate(survey.createdAt, 'MMM dd')}</span>
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button
          variant="filled"
          size="default"
          onClick={(e) => {
            e.stopPropagation();
            onView?.();
          }}
        >
          View
        </Button>
        <Button
          variant="outlined"
          size="default"
          onClick={(e) => {
            e.stopPropagation();
            onEdit?.();
          }}
        >
          Edit
        </Button>
      </CardFooter>
    </Card>
  );
}

// Helper function for status to badge variant mapping
function getStatusVariant(status: SurveyStatus): BadgeVariant {
  const map: Record<SurveyStatus, BadgeVariant> = {
    draft: 'default',
    active: 'success',
    closed: 'secondary',
  };
  return map[status] || 'default';
}
```

**Benefits:**

- ✅ Uses `Card` with proper variant and shape morphing
- ✅ Uses `Button` with correct variants (`filled`, `outlined`)
- ✅ Uses `Badge` with semantic variants
- ✅ Uses semantic color tokens (`text-on-surface`, `text-on-surface-variant`)
- ✅ Uses utility function (`formatDate`) instead of inline formatting
- ✅ Proper TypeScript types
- ✅ Accessible (click handlers, semantic HTML)
- ✅ Follows M3 Expressive (no shadows, proper shapes)

---

## Pattern 2: Create Survey Dialog

### ❌ WRONG: Custom Modal

```tsx
export function CreateSurveyDialog({ isOpen, onClose }: Props) {
  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Create Survey</h2>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Title</label>
                <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Enter survey title" />
              </div>

              <div className="flex gap-2 justify-end">
                <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-full">
                  Cancel
                </button>
                <button className="px-4 py-2 bg-blue-500 text-white rounded-full">Create</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

**Problems:**

- ❌ Custom backdrop and modal structure
- ❌ Using shadow (`shadow-xl`) - violates M3 Expressive
- ❌ Custom close button instead of `IconButton`
- ❌ Native `<input>` instead of `Input` component
- ❌ Custom buttons instead of `Button` component
- ❌ No form validation
- ❌ No accessibility (escape key, focus trap)

### ✅ CORRECT: Use Dialog Component

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const createSurveySchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().max(500).optional(),
});

type CreateSurveyForm = z.infer<typeof createSurveySchema>;

interface CreateSurveyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateSurveyForm) => Promise<void>;
}

export function CreateSurveyDialog({ open, onOpenChange, onSubmit }: CreateSurveyDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateSurveyForm>({
    resolver: zodResolver(createSurveySchema),
  });

  const handleFormSubmit = async (data: CreateSurveyForm) => {
    await onSubmit(data);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="default">
        <DialogHeader>
          <DialogTitle>Create Survey</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium text-on-surface">
              Title
            </label>
            <Input id="title" variant="outline" size="default" placeholder="Enter survey title" error={!!errors.title} {...register('title')} />
            {errors.title && <p className="text-xs text-error">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium text-on-surface">
              Description <span className="text-on-surface-variant">(optional)</span>
            </label>
            <Textarea
              id="description"
              variant="outline"
              rows={3}
              placeholder="Enter survey description"
              error={!!errors.description}
              {...register('description')}
            />
            {errors.description && <p className="text-xs text-error">{errors.description.message}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" size="default" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="filled" size="default" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Survey'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

**Benefits:**

- ✅ Uses `Dialog` with proper M3 styling (rounded-3xl)
- ✅ Uses `Input` and `Textarea` components
- ✅ Uses `Button` components with correct variants
- ✅ Form validation with react-hook-form + Zod
- ✅ Proper error handling and display
- ✅ Accessibility built-in (Dialog component handles escape, focus trap)
- ✅ Loading states
- ✅ Semantic color tokens

---

## Pattern 3: Dashboard Stats

### ❌ WRONG: Custom Stat Cards

```tsx
export function DashboardStats({ stats }: { stats: Stats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-purple-600 font-medium">Total Surveys</p>
            <p className="text-3xl font-bold text-purple-900 mt-1">{stats.totalSurveys}</p>
            <p className="text-xs text-purple-500 mt-1">All time surveys created</p>
          </div>
          <div className="bg-purple-200 rounded-full p-3">
            <FileText className="h-6 w-6 text-purple-700" />
          </div>
        </div>
      </div>

      {/* More stat cards... */}
    </div>
  );
}
```

**Problems:**

- ❌ Custom colored backgrounds (not semantic)
- ❌ Hardcoded purple colors
- ❌ Custom icon container styling
- ❌ Not using `Stat` component
- ❌ Not using `IconContainer` component

### ✅ CORRECT: Compose Stat Components

```tsx
import { Stat } from '@/components/ui/Stat';
import { IconContainer } from '@/components/ui/IconContainer';
import { FileText, Activity, Clock, Users } from 'lucide-react';

interface DashboardStatsProps {
  stats: {
    totalSurveys: number;
    activeSurveys: number;
    draftSurveys: number;
    totalResponses: number;
  };
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Stat
        value={stats.totalSurveys.toString()}
        label="Total Surveys"
        description="All time surveys created"
        icon={
          <IconContainer variant="primary" size="lg" shape="rounded">
            <FileText className="h-6 w-6" />
          </IconContainer>
        }
        variant="default"
      />

      <Stat
        value={stats.activeSurveys.toString()}
        label="Active Surveys"
        description="Currently collecting responses"
        icon={
          <IconContainer variant="success" size="lg" shape="rounded">
            <Activity className="h-6 w-6" />
          </IconContainer>
        }
        variant="success"
        trend={{ value: 12, direction: 'up' }}
      />

      <Stat
        value={stats.draftSurveys.toString()}
        label="Draft Surveys"
        description="Ready to be published"
        icon={
          <IconContainer variant="warning" size="lg" shape="rounded">
            <Clock className="h-6 w-6" />
          </IconContainer>
        }
        variant="warning"
      />

      <Stat
        value={stats.totalResponses.toString()}
        label="Total Responses"
        description="Across all surveys"
        icon={
          <IconContainer variant="info" size="lg" shape="rounded">
            <Users className="h-6 w-6" />
          </IconContainer>
        }
        variant="info"
      />
    </div>
  );
}
```

**Benefits:**

- ✅ Uses `Stat` component for consistent metric display
- ✅ Uses `IconContainer` with semantic variants
- ✅ Semantic color variants (`success`, `warning`, `info`)
- ✅ Trend indicators where relevant
- ✅ Responsive grid
- ✅ Consistent spacing and sizing

---

## Pattern 4: Survey List with Filters

### ❌ WRONG: Mixed Implementation

```tsx
export function SurveyList() {
  const [status, setStatus] = useState('all');

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button className={`px-4 py-2 rounded-full ${status === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`} onClick={() => setStatus('all')}>
          All
        </button>
        <button
          className={`px-4 py-2 rounded-full ${status === 'active' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
          onClick={() => setStatus('active')}
        >
          Active
        </button>
        {/* More filters... */}
      </div>

      <div className="space-y-3">
        {surveys.map((survey) => (
          <SurveyCard key={survey.id} survey={survey} />
        ))}
      </div>
    </div>
  );
}
```

**Problems:**

- ❌ Custom filter buttons instead of `Tabs` component
- ❌ Inline conditional classes (hard to maintain)
- ❌ No empty state handling
- ❌ No loading state
- ❌ No error handling

### ✅ CORRECT: Use Tabs and Proper States

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { SurveyCard } from '@/components/features/surveys/SurveyCard';
import { useSurveys } from '@/hooks/queries/useSurveys';
import { Inbox } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface SurveyListProps {
  onCreateSurvey?: () => void;
}

export function SurveyList({ onCreateSurvey }: SurveyListProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'draft' | 'closed'>('all');
  const { data: surveys, isLoading, error } = useSurveys({ status: activeTab });

  if (isLoading) {
    return <LoadingState variant="skeleton" />;
  }

  if (error) {
    return (
      <EmptyState
        icon={<AlertCircle className="h-12 w-12" />}
        title="Failed to load surveys"
        description="There was an error loading your surveys. Please try again."
        action={<Button variant="outlined">Retry</Button>}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Tabs variant="pills" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
          <TabsTrigger value="closed">Closed</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {surveys.length === 0 ? (
            <EmptyState
              icon={<Inbox className="h-12 w-12" />}
              title="No surveys yet"
              description="Create your first survey to get started"
              action={
                <Button variant="filled" onClick={onCreateSurvey}>
                  Create Survey
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {surveys.map((survey) => (
                <SurveyCard
                  key={survey.id}
                  survey={survey}
                  onView={() => navigate(`/surveys/${survey.id}`)}
                  onEdit={() => navigate(`/surveys/${survey.id}/edit`)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

**Benefits:**

- ✅ Uses `Tabs` component with `pills` variant
- ✅ Proper loading state with `LoadingState`
- ✅ Proper empty state with `EmptyState`
- ✅ Error handling with meaningful message
- ✅ Uses React Query hook for data fetching
- ✅ Responsive grid for cards
- ✅ Action callbacks for navigation

---

## Pattern 5: Form with Validation

### ❌ WRONG: Uncontrolled Form

```tsx
export function SurveySettingsForm() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    // Manual validation...
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label className="block mb-1">Survey Title</label>
        <input name="title" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
      </div>

      <div className="mb-4">
        <label className="block mb-1">Allow multiple responses</label>
        <input type="checkbox" name="allowMultiple" />
      </div>

      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-full">
        Save
      </button>
    </form>
  );
}
```

**Problems:**

- ❌ Native form elements
- ❌ No validation schema
- ❌ No error display
- ❌ Manual FormData extraction
- ❌ No loading state
- ❌ Custom button styling

### ✅ CORRECT: React Hook Form + Zod

```tsx
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const settingsSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().max(500).optional(),
  allowMultipleResponses: z.boolean(),
  requireAuthentication: z.boolean(),
  closesAt: z.date().optional(),
});

type SurveySettings = z.infer<typeof settingsSchema>;

interface SurveySettingsFormProps {
  initialData?: Partial<SurveySettings>;
  onSubmit: (data: SurveySettings) => Promise<void>;
}

export function SurveySettingsForm({ initialData, onSubmit }: SurveySettingsFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    watch,
    setValue,
  } = useForm<SurveySettings>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      allowMultipleResponses: false,
      requireAuthentication: false,
      ...initialData,
    },
  });

  const allowMultiple = watch('allowMultipleResponses');
  const requireAuth = watch('requireAuthentication');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium text-on-surface">
          Survey Title
        </label>
        <Input id="title" variant="outline" size="default" placeholder="Enter survey title" error={!!errors.title} {...register('title')} />
        {errors.title && <p className="text-xs text-error">{errors.title.message}</p>}
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium text-on-surface">
          Description
        </label>
        <Textarea
          id="description"
          variant="outline"
          rows={3}
          placeholder="Enter survey description"
          error={!!errors.description}
          {...register('description')}
        />
        {errors.description && <p className="text-xs text-error">{errors.description.message}</p>}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <label className="text-sm font-medium text-on-surface">Allow Multiple Responses</label>
            <p className="text-xs text-on-surface-variant">Allow users to submit more than one response</p>
          </div>
          <Switch checked={allowMultiple} onCheckedChange={(checked) => setValue('allowMultipleResponses', checked, { shouldDirty: true })} />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <label className="text-sm font-medium text-on-surface">Require Authentication</label>
            <p className="text-xs text-on-surface-variant">Only authenticated users can respond</p>
          </div>
          <Switch checked={requireAuth} onCheckedChange={(checked) => setValue('requireAuthentication', checked, { shouldDirty: true })} />
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-4 border-t border-outline-variant/30">
        <Button type="button" variant="ghost" size="default" disabled={!isDirty || isSubmitting}>
          Reset
        </Button>
        <Button type="submit" variant="filled" size="default" disabled={!isDirty || isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
```

**Benefits:**

- ✅ Uses `Input`, `Textarea`, `Switch` components
- ✅ Zod schema validation
- ✅ Proper error display under each field
- ✅ Loading states (isSubmitting)
- ✅ Dirty state tracking (only enable save if changed)
- ✅ Controlled components with watch/setValue
- ✅ Accessible labels and descriptions
- ✅ Semantic color tokens

---

## Key Takeaways

### Always Check First

1. **Is there a UI component for this?** → Use it
2. **Is there a feature component for this?** → Use it
3. **Is there a utility function for this?** → Use it
4. **Do I need to create something new?** → Compose existing components

### Composition Hierarchy

```
Feature Component
  ↓ imports
UI Components (Card, Button, Input, Badge, etc.)
  ↓ uses
Utility Functions (cn, formatDate, etc.)
  ↓ uses
Design System Tokens (CSS custom properties)
```

### Never Create These

- ❌ Custom buttons (use `Button`)
- ❌ Custom cards (use `Card`)
- ❌ Custom inputs (use `Input`, `Textarea`, `Select`)
- ❌ Custom badges/chips (use `Badge`, `Chip`)
- ❌ Custom modals (use `Dialog`, `Drawer`)
- ❌ Custom tabs (use `Tabs`)
- ❌ Custom tooltips (use `Tooltip`)
- ❌ Custom dropdowns (use `Menu`, `Select`)
- ❌ Custom date formatters (use `formatDate` from date-utils)
- ❌ Custom className mergers (use `cn` from utils)

### Always Compose

- ✅ Import from `/components/ui`
- ✅ Import from `/components/layout`
- ✅ Import from `/lib`
- ✅ Use semantic color tokens
- ✅ Use design system spacing
- ✅ Follow M3 Expressive principles
- ✅ Add proper TypeScript types
- ✅ Handle loading and error states
- ✅ Make components accessible

---

## Quick Reference

| Need              | Use                        | Don't Create                    |
| ----------------- | -------------------------- | ------------------------------- |
| Action button     | `<Button variant="..." />` | Custom button div               |
| Content container | `<Card variant="..." />`   | Custom div with styling         |
| Text input        | `<Input variant="..." />`  | Native input element            |
| Modal             | `<Dialog>`                 | Custom modal overlay            |
| Status indicator  | `<Badge variant="..." />`  | Colored span/div                |
| Filter/tag        | `<Chip variant="..." />`   | Custom pill/tag                 |
| Tab navigation    | `<Tabs variant="..." />`   | Custom tab buttons              |
| Dropdown          | `<Menu>` or `<Select>`     | Custom dropdown                 |
| Date formatting   | `formatDate()`             | new Date().toLocaleDateString() |
| Class merging     | `cn()`                     | Custom className logic          |

---

**Last Updated**: December 30, 2024
