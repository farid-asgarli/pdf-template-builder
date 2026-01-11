import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, Search } from 'lucide-react';
import { cn } from '@/app/ui';
import { SelectLabels, DEFAULT_SELECT_LABELS } from '../types';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  searchable?: boolean;
  className?: string;
  size?: 'default' | 'sm' | 'lg';
  /** Labels for i18n - pass pre-translated strings */
  labels?: SelectLabels;
}

function Select({
  options,
  value,
  onChange,
  placeholder,
  label,
  error,
  helperText,
  disabled = false,
  searchable = false,
  className,
  size = 'default',
  labels = {},
}: SelectProps) {
  const mergedLabels = { ...DEFAULT_SELECT_LABELS, ...labels };
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((o) => o.value === value);
  const hasError = !!error;

  const filteredOptions = searchable ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase())) : options;

  // Calculate position synchronously when opening
  const handleToggle = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 6,
        left: rect.left,
        width: rect.width,
      });
    }
    setOpen(!open);
    if (open) {
      setSearch('');
      setPosition(null);
    }
  };

  // Focus search input when opened
  useEffect(() => {
    if (open && searchable && searchRef.current) {
      searchRef.current.focus();
    }
  }, [open, searchable]);

  // Update position on scroll/resize while open
  useEffect(() => {
    if (!open || !triggerRef.current) return;

    const updatePosition = () => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setPosition({
          top: rect.bottom + 6,
          left: rect.left,
          width: rect.width,
        });
      }
    };

    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) && triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
        setPosition(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleSelect = (optionValue: string) => {
    onChange?.(optionValue);
    setOpen(false);
    setSearch('');
    setPosition(null);
  };

  return (
    <div className={cn('w-full', className)}>
      {label && <label className={cn('block text-sm font-semibold mb-2', hasError ? 'text-error' : 'text-on-surface')}>{label}</label>}

      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className={cn(
          'flex w-full items-center justify-between px-4 rounded-2xl',
          'bg-surface-container-lowest border-2 border-outline-variant/40',
          'text-sm text-left transition-all duration-200',
          'focus-visible:outline-none focus-visible:border-primary',
          'hover:border-outline-variant/70',
          size === 'sm' && 'h-10',
          size === 'default' && 'h-11',
          size === 'lg' && 'h-12',
          open && 'border-primary',
          disabled && 'opacity-50 cursor-not-allowed',
          hasError && 'border-error focus-visible:border-error'
        )}
      >
        <span className={cn('text-sm truncate', selectedOption ? 'text-on-surface' : 'text-on-surface-variant/50')}>
          {selectedOption?.label || placeholder || mergedLabels.placeholder}
        </span>
        <ChevronDown className={cn('h-4 w-4 text-on-surface-variant transition-transform duration-200', open && 'rotate-180 text-primary')} />
      </button>

      {(helperText || error) && <p className={cn('mt-2 text-sm', hasError ? 'text-error' : 'text-on-surface-variant/70')}>{error || helperText}</p>}

      {open &&
        position &&
        createPortal(
          <div
            ref={menuRef}
            className={cn(
              'fixed z-50 py-1.5 rounded-2xl max-h-72 overflow-auto',
              'bg-surface-container-lowest border border-outline-variant/30',
              'animate-in fade-in zoom-in-98 duration-150'
            )}
            style={{
              top: position.top,
              left: position.left,
              width: position.width,
            }}
          >
            {searchable && (
              <div className="px-2 pb-1.5">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant/50" />
                  <input
                    ref={searchRef}
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={mergedLabels.searchPlaceholder}
                    className={cn(
                      'w-full h-9 pl-9 pr-3 rounded-xl',
                      'bg-surface-container/50 text-on-surface text-sm',
                      'border border-outline-variant/20',
                      'placeholder:text-on-surface-variant/40',
                      'focus:outline-none focus:border-primary/30 focus:bg-surface-container'
                    )}
                  />
                </div>
              </div>
            )}

            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-on-surface-variant text-center">{mergedLabels.noOptionsFound}</div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  disabled={option.disabled}
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    'flex w-full items-center gap-3 px-3 py-2.5 text-sm text-left transition-all duration-150',
                    'hover:bg-surface-container-high rounded-xl mx-1.5',
                    option.value === value && 'bg-primary-container/50 text-on-primary-container font-medium',
                    option.disabled && 'opacity-50 cursor-not-allowed'
                  )}
                  style={{ width: 'calc(100% - 12px)' }}
                >
                  <span className="flex-1 truncate">{option.label}</span>
                  {option.value === value && <Check className="h-4 w-4 text-primary shrink-0" />}
                </button>
              ))
            )}
          </div>,
          document.body
        )}
    </div>
  );
}

export { Select };
