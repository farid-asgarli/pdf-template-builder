import { type InputHTMLAttributes, forwardRef } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from './Input';
import { cn } from '@/app/ui';
import { SearchInputLabels, DEFAULT_SEARCH_INPUT_LABELS } from '../types';

/**
 * Props for the SearchInput component.
 */
interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'size'> {
  /** Current search query value */
  value: string;
  /** Callback when the search query changes */
  onChange: (value: string) => void;
  /** Callback when the clear button is clicked (defaults to setting value to '') */
  onClear?: () => void;
  /** Whether to show the clear button when there's text */
  showClear?: boolean;
  /** Custom search icon */
  searchIcon?: React.ReactNode;
  /** Labels for i18n - pass pre-translated strings */
  labels?: SearchInputLabels;
}

/**
 * A search input component with a search icon and optional clear button.
 * Used consistently across list pages for filtering content.
 *
 * @example
 * ```tsx
 * const [searchQuery, setSearchQuery] = useState('');
 * <SearchInput
 *   value={searchQuery}
 *   onChange={setSearchQuery}
 *   placeholder="Search items..."
 * />
 * ```
 */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ value, onChange, onClear, showClear = true, searchIcon, placeholder, className, labels = {}, ...props }, ref) => {
    const mergedLabels = { ...DEFAULT_SEARCH_INPUT_LABELS, ...labels };
    const handleClear = () => {
      if (onClear) {
        onClear();
      } else {
        onChange('');
      }
    };

    return (
      <Input
        ref={ref}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || mergedLabels.placeholder}
        startIcon={searchIcon || <Search className="h-4 w-4" />}
        endIcon={
          showClear && value ? (
            <button
              type="button"
              onClick={handleClear}
              className="hover:text-on-surface transition-colors p-0.5 rounded-full hover:bg-on-surface/5"
              aria-label={mergedLabels.clearSearch}
            >
              <X className="h-4 w-4" />
            </button>
          ) : undefined
        }
        className={cn('w-full sm:w-56', className)}
        {...props}
      />
    );
  }
);

SearchInput.displayName = 'SearchInput';
