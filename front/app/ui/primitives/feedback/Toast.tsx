import { useEffect, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import hotToast, { Toaster, type Toast as HotToastType } from 'react-hot-toast';
import { cn } from '@/app/ui';
import { X, CircleCheck, CircleX, TriangleAlert, Info } from 'lucide-react';

// Helper for SSR-safe portal mounting
const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

function useIsMounted() {
  return useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);
}

// Toast types
type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastOptions {
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Toast styling configuration - using CSS variables for theme-awareness
const toastStyles = {
  success: {
    iconComponent: CircleCheck,
    iconColor: 'var(--toast-icon-success)',
  },
  error: {
    iconComponent: CircleX,
    iconColor: 'var(--toast-icon-error)',
  },
  warning: {
    iconComponent: TriangleAlert,
    iconColor: 'var(--toast-icon-warning)',
  },
  info: {
    iconComponent: Info,
    iconColor: 'var(--toast-icon-info)',
  },
};

// Custom toast renderer component - Gmail-inspired design
function CustomToast({
  t,
  type,
  title,
  description,
  action,
  dismissLabel,
}: {
  t: HotToastType;
  type: ToastType;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  dismissLabel: string;
}) {
  const style = toastStyles[type];
  const IconComponent = style.iconComponent;

  return (
    <div
      className={cn(
        'flex items-center gap-3 min-w-72 max-w-142 pl-4 pr-2 py-2.5 rounded-lg',
        'bg-(--toast-bg) text-(--toast-text)',
        'shadow-(--toast-shadow)',
        t.visible ? 'animate-toast-in' : 'animate-toast-out'
      )}
    >
      {/* Icon */}
      <div className="shrink-0" style={{ color: style.iconColor }}>
        <IconComponent className="h-5 w-5" strokeWidth={2} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-normal">{title}</p>
        {description && <p className="text-sm mt-0.5 opacity-80">{description}</p>}
      </div>

      {/* Action button */}
      {action && (
        <button
          onClick={() => {
            action.onClick();
            hotToast.dismiss(t.id);
          }}
          className={cn(
            'text-sm font-medium px-2 py-1.5 rounded shrink-0',
            'text-(--toast-action) hover:bg-(--toast-hover)',
            'transition-colors duration-200',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30'
          )}
        >
          {action.label}
        </button>
      )}

      {/* Close button - only show if no action */}
      {!action && (
        <button
          onClick={() => hotToast.dismiss(t.id)}
          className={cn(
            'shrink-0 p-1.5 rounded',
            'hover:bg-(--toast-hover)',
            'transition-colors duration-200',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30'
          )}
          aria-label={dismissLabel}
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>
      )}
    </div>
  );
}

// Helper function to show toasts - maintains the same API
export const toast = {
  success: (title: string, options?: ToastOptions) => {
    return hotToast.custom(
      (t) => (
        <CustomToast
          t={t}
          type="success"
          title={title}
          description={options?.description}
          action={options?.action}
          dismissLabel="Dismiss notification"
        />
      ),
      {
        duration: options?.duration ?? 4000,
        position: 'bottom-right',
      }
    );
  },
  error: (title: string, options?: ToastOptions) => {
    return hotToast.custom(
      (t) => (
        <CustomToast
          t={t}
          type="error"
          title={title}
          description={options?.description}
          action={options?.action}
          dismissLabel="Dismiss notification"
        />
      ),
      {
        duration: options?.duration ?? 6000,
        position: 'bottom-right',
      }
    );
  },
  warning: (title: string, options?: ToastOptions) => {
    return hotToast.custom(
      (t) => (
        <CustomToast
          t={t}
          type="warning"
          title={title}
          description={options?.description}
          action={options?.action}
          dismissLabel="Dismiss notification"
        />
      ),
      {
        duration: options?.duration ?? 4000,
        position: 'bottom-right',
      }
    );
  },
  info: (title: string, options?: ToastOptions) => {
    return hotToast.custom(
      (t) => (
        <CustomToast
          t={t}
          type="info"
          title={title}
          description={options?.description}
          action={options?.action}
          dismissLabel="Dismiss notification"
        />
      ),
      {
        duration: options?.duration ?? 4000,
        position: 'bottom-right',
      }
    );
  },
  dismiss: (id?: string) => {
    if (id) {
      hotToast.dismiss(id);
    } else {
      hotToast.dismiss();
    }
  },
  // Promise toast for async operations
  promise: <T,>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((err: Error) => string);
    }
  ) => {
    return hotToast.promise(
      promise,
      {
        loading: loading,
        success: (data) => (typeof success === 'function' ? success(data) : success),
        error: (err) => (typeof error === 'function' ? error(err) : error),
      },
      {
        position: 'bottom-right',
        style: {
          background: 'var(--toast-bg)',
          color: 'var(--toast-text)',
          borderRadius: '0.5rem',
          padding: '10px 16px',
          fontFamily: 'var(--font-sans)',
          fontSize: '14px',
          fontWeight: '400',
          boxShadow: 'var(--toast-shadow)',
          minWidth: '288px',
          maxWidth: '568px',
        },
        success: {
          iconTheme: {
            primary: 'var(--toast-icon-success)',
            secondary: 'var(--toast-bg)',
          },
        },
        error: {
          iconTheme: {
            primary: 'var(--toast-icon-error)',
            secondary: 'var(--toast-bg)',
          },
        },
      }
    );
  },
};

// Toast Container component - uses react-hot-toast's Toaster
export function ToastContainer() {
  return (
    <Toaster
      position="bottom-right"
      containerStyle={{
        bottom: 24,
        right: 24,
      }}
      toastOptions={{
        duration: 4000,
      }}
      gutter={8}
    />
  );
}

// Legacy store export for backwards compatibility (if needed)
export const useToastStore = {
  getState: () => ({
    toasts: [],
    addToast: toast.success,
    removeToast: toast.dismiss,
  }),
};

// Snackbar - Gmail-style minimal notification
interface SnackbarProps {
  open: boolean;
  onClose: () => void;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

export function Snackbar({ open, onClose, message, action, duration = 4000 }: SnackbarProps) {
  const mounted = useIsMounted();

  useEffect(() => {
    if (open && duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [open, duration, onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      className={cn(
        'fixed bottom-6 left-6 z-100',
        'transition-all duration-300 ease-out',
        open ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-3 pointer-events-none'
      )}
    >
      <div
        className={cn(
          'flex items-center gap-2 pl-4 pr-2 py-2.5 rounded-lg',
          'bg-(--toast-bg) text-(--toast-text)',
          'shadow-(--toast-shadow)',
          'min-w-72 max-w-142'
        )}
      >
        <span className="text-sm font-normal flex-1">{message}</span>
        {action && (
          <button
            onClick={() => {
              action.onClick();
              onClose();
            }}
            className={cn(
              'text-sm font-medium px-2 py-1.5 rounded',
              'text-(--toast-action)',
              'hover:bg-(--toast-hover)',
              'transition-colors duration-200',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30'
            )}
          >
            {action.label}
          </button>
        )}
      </div>
    </div>,
    document.body
  );
}
