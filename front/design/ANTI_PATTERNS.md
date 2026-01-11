# Anti-Patterns - What NOT to Do

> **These patterns violate M3 Expressive principles and create technical debt.**

---

## Anti-Pattern 1: Shadow for Elevation

### ❌ WRONG

```tsx
// Using shadows to create depth
<div className="shadow-lg hover:shadow-xl transition-shadow">
  Card content
</div>

<button className="shadow-md hover:shadow-lg">
  Click me
</button>
```

**Why it's wrong:**

- M3 Expressive uses **color containment** for elevation, not shadows
- Only toasts should have shadows
- Creates visual inconsistency with the design system

### ✅ CORRECT

```tsx
// Use surface hierarchy for depth
<Card variant="default"> {/* Uses surface-container color */}
  Card content
</Card>

// Or use elevated variant
<Card variant="elevated"> {/* Uses surface-container-high */}
  Elevated content
</Card>

// Buttons never need shadows
<Button variant="filled">
  Click me
</Button>
```

---

## Anti-Pattern 2: Wrong Border Radius

### ❌ WRONG

```tsx
// Using wrong rounded values
<button className="rounded-lg">Button</button> {/* Should be rounded-full */}
<button className="rounded-xl">Button</button> {/* Should be rounded-full */}

<div className="rounded-lg">Card</div> {/* Should be rounded-2xl */}
<div className="rounded-xl">Card</div> {/* Should be rounded-2xl */}

<input className="rounded-lg" /> {/* Should be rounded-2xl */}
<input className="rounded-full" /> {/* Should be rounded-2xl */}
```

**Why it's wrong:**

- M3 Expressive has specific shape tokens for each component type
- Buttons are ALWAYS `rounded-full` (pill shape)
- Cards are ALWAYS `rounded-2xl` base (with dynamic morphing)
- Inputs are ALWAYS `rounded-2xl`

### ✅ CORRECT

```tsx
// Buttons: always rounded-full
<Button variant="filled">Button</Button>
<Button variant="outlined">Button</Button>

// Cards: always rounded-2xl base
<Card variant="default">Card</Card>

// Inputs: always rounded-2xl
<Input variant="outline" />
```

---

## Anti-Pattern 3: Arbitrary Colors

### ❌ WRONG

```tsx
// Using arbitrary hex colors
<div className="bg-[#6750a4] text-white">
  Primary colored div
</div>

// Using Tailwind's default colors
<button className="bg-blue-500 hover:bg-blue-600">
  Button
</button>

<p className="text-gray-600">
  Some text
</p>
```

**Why it's wrong:**

- Breaks theme consistency (won't work with dark mode)
- Doesn't respect user's palette preference
- Not semantic (what does "blue-500" mean in context?)

### ✅ CORRECT

```tsx
// Use semantic color tokens
<div className="bg-primary text-on-primary">
  Primary colored div
</div>

// Use Button component (handles colors automatically)
<Button variant="filled">
  Button
</Button>

// Use semantic text colors
<p className="text-on-surface-variant">
  Some text
</p>
```

---

## Anti-Pattern 4: Border Width Inconsistency

### ❌ WRONG

```tsx
// Using border or border-1
<button className="border border-gray-300">Button</button>
<input className="border border-gray-400" />
<div className="border border-gray-200">Card</div>

// No border on interactive elements
<button className="bg-primary text-white">Button</button>
```

**Why it's wrong:**

- M3 Expressive uses `border-2` (2px) for emphasis and touch targets
- Inconsistent border widths look unprofessional
- Borders help define interactive surfaces

### ✅ CORRECT

```tsx
// All interactive elements use border-2
<Button variant="outlined">Button</Button> {/* Has border-2 */}
<Input variant="outline" /> {/* Has border-2 */}
<Card variant="outlined">Card</Card> {/* Has border-2 */}

// Filled buttons still have border-2 for structure
<Button variant="filled">Button</Button> {/* Has border-2 border-primary */}
```

---

## Anti-Pattern 5: Creating Duplicate Components

### ❌ WRONG

```tsx
// File: /components/features/surveys/CustomButton.tsx
export function CustomButton({ children, primary }: Props) {
  return (
    <button
      className={`
      px-4 py-2 rounded-full font-semibold
      ${primary ? 'bg-blue-500 text-white' : 'bg-gray-100'}
    `}
    >
      {children}
    </button>
  );
}

// File: /components/features/analytics/ActionButton.tsx
export function ActionButton({ children, variant }: Props) {
  return (
    <button
      className={`
      px-6 py-2 rounded-full font-semibold
      ${variant === 'primary' ? 'bg-primary text-white' : 'border'}
    `}
    >
      {children}
    </button>
  );
}
```

**Why it's wrong:**

- Creates multiple implementations of the same thing
- Inconsistent behavior across the app
- Maintenance nightmare (need to update multiple places)
- The `Button` component already exists!

### ✅ CORRECT

```tsx
// Just use the existing Button component everywhere
import { Button } from '@/components/ui/Button';

// In surveys feature
<Button variant="filled">Survey Action</Button>

// In analytics feature
<Button variant="filled">Analytics Action</Button>

// If you need a domain-specific button, compose it:
export function SurveyActionButton(props: ButtonProps) {
  return (
    <Button
      variant="filled"
      size="default"
      {...props}
    />
  );
}
```

---

## Anti-Pattern 6: Inline Conditional Classes

### ❌ WRONG

```tsx
<div
  className={`
  px-4 py-2 rounded-full
  ${isActive ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}
  ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'}
  ${size === 'large' ? 'text-lg px-6 py-3' : size === 'small' ? 'text-sm px-2 py-1' : ''}
`}
>
  Content
</div>
```

**Why it's wrong:**

- Hard to read and maintain
- No type safety
- Doesn't scale to many variants
- Reinventing CVA (class-variance-authority)

### ✅ CORRECT

```tsx
// Use CVA in the component definition
import { cva } from 'class-variance-authority';

const buttonVariants = cva('px-4 py-2 rounded-full font-semibold transition-colors', {
  variants: {
    variant: {
      active: 'bg-primary text-on-primary',
      inactive: 'bg-surface-container-high text-on-surface',
    },
    size: {
      small: 'text-sm px-2 py-1',
      default: 'text-base px-4 py-2',
      large: 'text-lg px-6 py-3',
    },
    disabled: {
      true: 'opacity-50 cursor-not-allowed',
      false: 'hover:opacity-90',
    },
  },
  defaultVariants: {
    variant: 'inactive',
    size: 'default',
    disabled: false,
  },
});

// Use it with type safety
<div
  className={buttonVariants({
    variant: isActive ? 'active' : 'inactive',
    size: 'large',
    disabled: isDisabled,
  })}
>
  Content
</div>;
```

---

## Anti-Pattern 7: Transform for Elevation

### ❌ WRONG

```tsx
// Using translateY or scale for elevation
<div className="hover:translate-y-[-4px] transition-transform">
  Hoverable card
</div>

<button className="hover:scale-110">
  Button
</button>

<div className="transform translate-y-2 shadow-lg">
  Elevated content
</div>
```

**Why it's wrong:**

- M3 Expressive doesn't use transforms for depth
- Can cause layout shifts
- Violates the "no elevation through position" principle

### ✅ CORRECT

```tsx
// Use border-radius morphing for interaction feedback
<Card variant="interactive" shapeOption="default">
  {/* Radius morphs from 24px → 36px on hover */}
  Hoverable card
</Card>

// Use scale ONLY for press feedback
<Button variant="filled" className="active:scale-[0.98]">
  Button
</Button>

// Use surface colors for elevation
<Card variant="elevated">
  {/* Uses surface-container-high color for elevation */}
  Elevated content
</Card>
```

---

## Anti-Pattern 8: Missing Loading States

### ❌ WRONG

```tsx
export function SurveyList() {
  const { data: surveys } = useSurveys();

  return (
    <div>
      {surveys?.map((survey) => (
        <SurveyCard key={survey.id} survey={survey} />
      ))}
    </div>
  );
}
```

**Why it's wrong:**

- No loading state (blank screen while loading)
- No error handling (silent failures)
- No empty state (confusing when no surveys)
- Poor user experience

### ✅ CORRECT

```tsx
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';

export function SurveyList() {
  const { data: surveys, isLoading, error } = useSurveys();

  if (isLoading) {
    return <LoadingState variant="skeleton" />;
  }

  if (error) {
    return (
      <EmptyState
        icon={<AlertCircle className="h-12 w-12" />}
        title="Failed to load surveys"
        description={error.message}
        action={
          <Button variant="outlined" onClick={refetch}>
            Retry
          </Button>
        }
      />
    );
  }

  if (surveys.length === 0) {
    return (
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
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {surveys.map((survey) => (
        <SurveyCard key={survey.id} survey={survey} />
      ))}
    </div>
  );
}
```

---

## Anti-Pattern 9: Hardcoded Responsive Breakpoints

### ❌ WRONG

```tsx
export function DashboardStats() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isMobile) {
    return <MobileStatsView />;
  }

  return <DesktopStatsView />;
}
```

**Why it's wrong:**

- JavaScript-based responsive behavior (expensive)
- Duplicates logic that Tailwind already handles
- Flash of wrong content on initial render
- Harder to maintain

### ✅ CORRECT

```tsx
export function DashboardStats({ stats }: Props) {
  return (
    // Use Tailwind's responsive classes
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Stat value={stats.total} label="Total Surveys" />
      <Stat value={stats.active} label="Active" />
      <Stat value={stats.draft} label="Draft" />
      <Stat value={stats.closed} label="Closed" />
    </div>
  );
}
```

---

## Anti-Pattern 10: Native Form Elements

### ❌ WRONG

```tsx
<form>
  <input type="text" placeholder="Email" className="border rounded p-2" />
  <select className="border rounded p-2">
    <option>Option 1</option>
    <option>Option 2</option>
  </select>
  <input type="checkbox" /> Remember me
  <button type="submit">Submit</button>
</form>
```

**Why it's wrong:**

- Inconsistent styling with design system
- No validation UI
- Poor accessibility
- Doesn't match M3 Expressive shapes
- Native select/checkbox are hard to style

### ✅ CORRECT

```tsx
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { Button } from '@/components/ui/Button';

<form onSubmit={handleSubmit(onSubmit)}>
  <Input variant="outline" size="default" placeholder="Email" error={!!errors.email} {...register('email')} />
  {errors.email && <p className="text-xs text-error">{errors.email.message}</p>}

  <Select value={value} onValueChange={setValue}>
    <SelectTrigger>
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="1">Option 1</SelectItem>
      <SelectItem value="2">Option 2</SelectItem>
    </SelectContent>
  </Select>

  <div className="flex items-center gap-2">
    <Checkbox checked={rememberMe} onCheckedChange={setRememberMe} />
    <label className="text-sm">Remember me</label>
  </div>

  <Button type="submit" variant="filled">
    Submit
  </Button>
</form>;
```

---

## Anti-Pattern 11: Gradients

### ❌ WRONG

```tsx
<div className="bg-gradient-to-r from-blue-500 to-purple-600">
  Gradient background
</div>

<button className="bg-gradient-to-br from-primary to-secondary">
  Gradient button
</button>
```

**Why it's wrong:**

- M3 Expressive uses **flat, solid colors** only
- Gradients violate the design system principles
- Creates visual complexity that conflicts with clarity

### ✅ CORRECT

```tsx
// Use solid colors from the palette
<div className="bg-primary-container">
  Solid background
</div>

<Button variant="filled">
  Solid button
</Button>

// For visual interest, use layering instead
<Card variant="tonal">
  <CardContent className="bg-primary-container/40">
    Layered effect with opacity
  </CardContent>
</Card>
```

---

## Anti-Pattern 12: Inconsistent Spacing

### ❌ WRONG

```tsx
<div className="px-3 py-4">
  <h2 className="mb-3">Title</h2>
  <p className="mb-2">Description</p>
  <div className="mt-5">
    <button className="mr-2">Cancel</button>
    <button>Submit</button>
  </div>
</div>
```

**Why it's wrong:**

- Arbitrary spacing values (px-3, py-4, mb-3, mt-5)
- Inconsistent gaps between elements
- No rhythm or system
- Doesn't follow Tailwind's spacing scale

### ✅ CORRECT

```tsx
// Use consistent spacing from the scale
<div className="p-4 md:p-5">
  {' '}
  {/* Card padding */}
  <h2 className="mb-2">Title</h2> {/* Label margin */}
  <p className="mb-4">Description</p> {/* Section gap */}
  <div className="flex gap-3 mt-6">
    {' '}
    {/* Action buttons with gap-3 */}
    <Button variant="ghost">Cancel</Button>
    <Button variant="filled">Submit</Button>
  </div>
</div>
```

**Spacing Reference:**

- `gap-1` (4px): Tight gaps
- `gap-2` (8px): Small gaps
- `gap-3` (12px): Default gaps
- `gap-4` (16px): Component padding
- `gap-6` (24px): Section spacing
- `mb-2` (8px): Label margins
- `mb-4` (16px): Field spacing

---

## Anti-Pattern 13: Custom Date Formatting

### ❌ WRONG

```tsx
// Inline date formatting
<span>
  {new Date(survey.createdAt).toLocaleDateString()}
</span>

// Inconsistent formatting
<span>
  {survey.createdAt.split('T')[0]}
</span>

// Custom formatter function in component
const formatDate = (date: string) => {
  const d = new Date(date);
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
};
```

**Why it's wrong:**

- Inconsistent date formats across the app
- No timezone handling
- No i18n support
- Duplicated logic in every component

### ✅ CORRECT

```tsx
import { formatDate, formatRelativeTime } from '@/lib/date-utils';

// Consistent formatting using utility
<span>{formatDate(survey.createdAt, 'MMM dd, yyyy')}</span>

// Relative time for recent dates
<span>{formatRelativeTime(survey.createdAt)}</span>

// The utility handles:
// - Consistent formatting
// - Timezone conversion
// - i18n support
// - Edge cases
```

---

## Anti-Pattern 14: Prop Drilling

### ❌ WRONG

```tsx
// Page level
function SurveysPage() {
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);

  return <SurveyList selectedSurvey={selectedSurvey} onSelectSurvey={setSelectedSurvey} />;
}

// List component
function SurveyList({ selectedSurvey, onSelectSurvey }: Props) {
  return surveys.map((survey) => (
    <SurveyCard survey={survey} isSelected={selectedSurvey?.id === survey.id} onSelect={() => onSelectSurvey(survey)} />
  ));
}

// Card component
function SurveyCard({ survey, isSelected, onSelect }: Props) {
  // ...
}
```

**Why it's wrong:**

- Props passed through multiple levels
- Components are tightly coupled
- Hard to refactor
- Components can't be used independently

### ✅ CORRECT

```tsx
// Use Zustand store for shared state
// stores/surveyStore.ts
export const useSurveyStore = create<SurveyStore>((set) => ({
  selectedSurvey: null,
  setSelectedSurvey: (survey) => set({ selectedSurvey: survey }),
}));

// Page level - just renders
function SurveysPage() {
  return <SurveyList />;
}

// List component - independent
function SurveyList() {
  const { data: surveys } = useSurveys();

  return surveys.map((survey) => <SurveyCard key={survey.id} survey={survey} />);
}

// Card component - accesses store directly
function SurveyCard({ survey }: { survey: Survey }) {
  const { selectedSurvey, setSelectedSurvey } = useSurveyStore();
  const isSelected = selectedSurvey?.id === survey.id;

  return (
    <Card variant={isSelected ? 'tonal' : 'default'} onClick={() => setSelectedSurvey(survey)}>
      {/* ... */}
    </Card>
  );
}
```

---

## Anti-Pattern 15: Missing TypeScript Types

### ❌ WRONG

```tsx
// Using any
function SurveyCard({ survey }: { survey: any }) {
  return <div>{survey.title}</div>;
}

// No types at all
function createSurvey(data) {
  return api.post('/surveys', data);
}

// Inline types everywhere
function SurveyList({
  surveys,
}: {
  surveys: {
    id: string;
    title: string;
    status: string;
  }[];
}) {
  // ...
}
```

**Why it's wrong:**

- No type safety
- No autocomplete
- Runtime errors instead of compile-time errors
- Hard to refactor

### ✅ CORRECT

```tsx
// Define types in /types
// types/survey.ts
export interface Survey {
  id: string;
  title: string;
  description?: string;
  status: SurveyStatus;
  responseCount: number;
  createdAt: string;
  updatedAt: string;
}

export type SurveyStatus = 'draft' | 'active' | 'closed';

// Use types consistently
import type { Survey } from '@/types/survey';

function SurveyCard({ survey }: { survey: Survey }) {
  return <div>{survey.title}</div>;
}

function createSurvey(data: CreateSurveyInput): Promise<Survey> {
  return api.post('/surveys', data);
}

function SurveyList({ surveys }: { surveys: Survey[] }) {
  // ...
}
```

---

## Summary: Quick Don't List

| ❌ Don't                     | ✅ Do Instead                           |
| ---------------------------- | --------------------------------------- |
| Use shadows for elevation    | Use surface color hierarchy             |
| Use wrong border radius      | Follow M3 shape tokens (full, 2xl, 3xl) |
| Use arbitrary colors         | Use semantic color tokens               |
| Use border or border-1       | Use border-2 for all components         |
| Create duplicate components  | Check COMPONENT_INDEX.md first          |
| Inline conditional classes   | Use CVA (class-variance-authority)      |
| Use transforms for elevation | Use color and shape morphing            |
| Skip loading/error states    | Always handle all states                |
| JavaScript responsive        | Use Tailwind responsive classes         |
| Native form elements         | Use design system form components       |
| Use gradients                | Use solid colors                        |
| Arbitrary spacing            | Follow Tailwind spacing scale           |
| Custom date formatting       | Use date-utils                          |
| Prop drilling                | Use Zustand stores                      |
| Skip TypeScript types        | Define and use proper types             |

---

**Last Updated**: December 30, 2024
