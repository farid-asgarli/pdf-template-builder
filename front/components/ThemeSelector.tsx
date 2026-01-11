'use client';

import { useThemeStore, THEME_PALETTES, type ThemePalette } from '@/lib/store/themeStore';
import { Tooltip, Menu, MenuItem, IconButton } from '@/app/ui/primitives';
import { Palette, Sun, Moon, Check } from 'lucide-react';

export function ThemeSelector() {
  const { palette, mode, setPalette, toggleMode } = useThemeStore();

  return (
    <div className="flex items-center gap-1">
      {/* Dark/Light mode toggle */}
      <Tooltip content={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
        <IconButton
          variant="ghost"
          size="sm"
          aria-label="Toggle theme mode"
          onClick={toggleMode}
          icon={mode === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        />
      </Tooltip>

      {/* Palette selector */}
      <Menu
        trigger={
          <Tooltip content="Change color theme">
            <IconButton variant="ghost" size="sm" aria-label="Change color theme" icon={<Palette className="h-4 w-4" />} />
          </Tooltip>
        }
      >
        <div className="px-3 py-2 text-xs font-medium text-on-surface-variant">Color Theme</div>
        <div className="max-h-64 overflow-y-auto">
          {THEME_PALETTES.map((theme) => (
            <MenuItem key={theme.id} onClick={() => setPalette(theme.id as ThemePalette)}>
              <div className="flex w-full items-center gap-3">
                <div className="h-4 w-4 rounded-full border border-outline-variant/50" style={{ backgroundColor: theme.primaryColor }} />
                <span className="flex-1">{theme.name}</span>
                {palette === theme.id && <Check className="h-4 w-4 text-primary" />}
              </div>
            </MenuItem>
          ))}
        </div>
      </Menu>
    </div>
  );
}
