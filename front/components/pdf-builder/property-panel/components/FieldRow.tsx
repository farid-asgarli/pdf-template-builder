interface FieldRowProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

export function FieldRow({ label, children, className }: FieldRowProps) {
  return (
    <div className={`flex items-center justify-between gap-4 ${className || ''}`}>
      <span className="shrink-0 text-sm font-medium text-on-surface">{label}</span>
      <div className="w-32">{children}</div>
    </div>
  );
}
