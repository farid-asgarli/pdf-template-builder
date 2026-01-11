import { useState, useRef, useEffect, useLayoutEffect, useCallback, type ReactNode, type HTMLAttributes, type Ref, type CSSProperties } from 'react';

type TabVariant = 'underline' | 'pills' | 'segmented';

interface TabsProps extends HTMLAttributes<HTMLDivElement> {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
  variant?: TabVariant;
}

interface TabsListProps extends HTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
}

interface TabsTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  ref?: Ref<HTMLButtonElement>;
  value: string;
  disabled?: boolean;
  icon?: ReactNode;
}

interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
  value: string;
}

// Tabs Context
import { createContext, useContext } from 'react';
import { cn } from '@/app/ui';

interface TabsContextType {
  value: string;
  onValueChange: (value: string) => void;
  variant: TabVariant;
  registerTab: (value: string, element: HTMLButtonElement | null) => void;
  getTabRef: (value: string) => HTMLButtonElement | undefined;
  updateKey: number;
  triggerUpdate: () => void;
}

const TabsContext = createContext<TabsContextType | null>(null);

function useTabs() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs');
  }
  return context;
}

function Tabs({ defaultValue = '', value: controlledValue, onValueChange, variant = 'pills', className, children, ...props }: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [updateKey, setUpdateKey] = useState(0);
  const value = controlledValue ?? internalValue;
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const handleValueChange = (newValue: string) => {
    setInternalValue(newValue);
    onValueChange?.(newValue);
  };

  const registerTab = useCallback((tabValue: string, element: HTMLButtonElement | null) => {
    if (element) {
      tabRefs.current.set(tabValue, element);
    } else {
      tabRefs.current.delete(tabValue);
    }
  }, []);

  const getTabRef = useCallback((tabValue: string) => {
    return tabRefs.current.get(tabValue);
  }, []);

  const triggerUpdate = useCallback(() => {
    setUpdateKey((k) => k + 1);
  }, []);

  return (
    <TabsContext.Provider value={{ value, onValueChange: handleValueChange, variant, registerTab, getTabRef, updateKey, triggerUpdate }}>
      <div className={cn('flex flex-col', className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

function TabsList({ className, ref, children, ...props }: TabsListProps) {
  const { value, variant, getTabRef, updateKey } = useTabs();
  const listRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<CSSProperties>({});
  const [isReady, setIsReady] = useState(false);

  // Calculate indicator position
  const updateIndicator = useCallback(() => {
    const activeTab = getTabRef(value);
    const list = listRef.current;

    if (activeTab && list && (variant === 'pills' || variant === 'segmented')) {
      // Use offsetLeft/offsetWidth instead of getBoundingClientRect
      // This ensures correct positioning even when parent is animating
      setIndicatorStyle({
        width: activeTab.offsetWidth,
        height: activeTab.offsetHeight,
        transform: `translateX(${activeTab.offsetLeft}px)`,
      });
      setIsReady(true);
    }
  }, [value, variant, getTabRef]);

  // Update on value change or when tabs register
  useLayoutEffect(() => {
    // Use RAF to ensure DOM measurements are accurate
    const rafId = requestAnimationFrame(() => {
      updateIndicator();
    });
    return () => cancelAnimationFrame(rafId);
  }, [value, updateKey, updateIndicator]);

  useEffect(() => {
    // Re-calculate on window resize
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [updateIndicator]);

  // Combine refs
  const setRef = (el: HTMLDivElement | null) => {
    (listRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
    if (typeof ref === 'function') {
      ref(el);
    } else if (ref) {
      (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
    }
  };

  return (
    <div
      ref={setRef}
      role="tablist"
      className={cn(
        'relative inline-flex items-center w-max',
        variant === 'underline' && 'gap-1 border-b border-outline-variant/30',
        variant === 'pills' && 'gap-0 p-1 bg-primary-container/40 rounded-full',
        variant === 'segmented' && 'gap-0 p-1 bg-surface-container-high rounded-full',
        className
      )}
      {...props}
    >
      {/* Sliding indicator for pills and segmented variants */}
      {(variant === 'pills' || variant === 'segmented') && (
        <div
          className={cn(
            'absolute top-1 left-0 rounded-full pointer-events-none',
            isReady ? 'transition-all duration-200 ease-out' : 'opacity-0',
            variant === 'pills' && 'bg-primary ring-2 ring-primary/30',
            variant === 'segmented' && 'bg-surface-container-lowest border-2 border-outline-variant/50'
          )}
          style={indicatorStyle}
        />
      )}
      {children}
    </div>
  );
}

function TabsTrigger({ className, value, disabled = false, icon, ref, children, ...props }: TabsTriggerProps) {
  const { value: selectedValue, onValueChange, variant, registerTab, triggerUpdate } = useTabs();
  const isSelected = value === selectedValue;
  const buttonRef = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    registerTab(value, buttonRef.current);
    // Trigger update after registration so indicator can position correctly
    triggerUpdate();
    return () => registerTab(value, null);
  }, [value, registerTab, triggerUpdate]);

  // Combine refs
  const setRef = (el: HTMLButtonElement | null) => {
    (buttonRef as React.MutableRefObject<HTMLButtonElement | null>).current = el;
    if (typeof ref === 'function') {
      ref(el);
    } else if (ref) {
      (ref as React.MutableRefObject<HTMLButtonElement | null>).current = el;
    }
  };

  const variantStyles = {
    underline: cn(
      'relative px-4 py-2.5 text-sm font-medium whitespace-nowrap',
      'transition-colors duration-200',
      isSelected ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
    ),
    pills: cn(
      'relative z-10 px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap',
      'transition-colors duration-300 ease-out',
      'flex items-center gap-2',
      isSelected ? 'text-on-primary' : 'text-primary/80 hover:text-primary'
    ),
    segmented: cn(
      'relative z-10 px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap',
      'transition-colors duration-300 ease-out',
      'flex items-center gap-2',
      isSelected ? 'text-on-surface' : 'text-on-surface-variant hover:text-on-surface'
    ),
  };

  return (
    <button
      ref={setRef}
      role="tab"
      aria-selected={isSelected}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      onClick={() => !disabled && onValueChange(value)}
      className={cn(
        variantStyles[variant],
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50 justify-center',
        className
      )}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
      {/* Underline indicator for underline variant */}
      {variant === 'underline' && isSelected && <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full" />}
    </button>
  );
}

function TabsContent({ className, value, ref, children, ...props }: TabsContentProps) {
  const { value: selectedValue } = useTabs();

  if (value !== selectedValue) return null;

  return (
    <div
      ref={ref}
      role="tabpanel"
      tabIndex={0}
      className={cn('mt-4 animate-in fade-in-50 slide-in-from-bottom-2 duration-200', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
