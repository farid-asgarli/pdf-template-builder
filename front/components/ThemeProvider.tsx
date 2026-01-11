'use client';

import { useEffect, useState } from 'react';
import { useThemeStore } from '@/lib/store/themeStore';

interface ThemeProviderProps {
  children: React.ReactNode;
}

/**
 * ThemeProvider applies the theme palette and mode to the document root.
 * It reads from the persisted theme store and applies the appropriate
 * data attributes to enable CSS theming.
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const { palette, mode } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering theme after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;

    // Apply palette - violet is default (no attribute needed)
    if (palette === 'violet') {
      root.removeAttribute('data-palette');
    } else {
      root.setAttribute('data-palette', palette);
    }

    // Apply mode
    root.setAttribute('data-theme', mode);
  }, [palette, mode, mounted]);

  return <>{children}</>;
}
