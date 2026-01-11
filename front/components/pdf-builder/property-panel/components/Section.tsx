'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface SectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function Section({ title, icon, children, defaultOpen = true }: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mx-4 mb-3">
      <button
        className="flex w-full items-center gap-2.5 rounded-2xl px-3.5 py-2.5 transition-all duration-200 hover:bg-surface-container-high/60"
        onClick={() => setIsOpen(!isOpen)}
      >
        {icon && <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-surface-container text-on-surface-variant">{icon}</span>}
        <h3 className="flex-1 text-left text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{title}</h3>
        <ChevronDown className={`h-4 w-4 text-on-surface-variant transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`} />
      </button>
      <div className={`grid transition-all duration-200 ${isOpen ? 'mt-2 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <div className="rounded-2xl bg-surface-container/50 p-3.5">{children}</div>
        </div>
      </div>
    </div>
  );
}
