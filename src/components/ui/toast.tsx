"use client";

import {
  createContext, useContext, useState, useCallback, useRef, useEffect,
} from "react";
import { CheckCircle2, AlertTriangle, X, Info, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Tipos ──────────────────────────────────────────────────────────────────

type ToastType    = "success" | "error" | "warning" | "info";
type ToastOptions = { duration?: number; description?: string };

interface Toast {
  id:          string;
  type:        ToastType;
  message:     string;
  description?: string;
  duration:    number;
  removing:    boolean;
}

interface ToastCtx {
  success: (msg: string, opts?: ToastOptions) => void;
  error:   (msg: string, opts?: ToastOptions) => void;
  warning: (msg: string, opts?: ToastOptions) => void;
  info:    (msg: string, opts?: ToastOptions) => void;
}

// ─── Context ────────────────────────────────────────────────────────────────

const Ctx = createContext<ToastCtx>({
  success: () => {},
  error:   () => {},
  warning: () => {},
  info:    () => {},
});

export function useToast() {
  return useContext(Ctx);
}

// ─── Provider ───────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const remove = useCallback((id: string) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, removing: true } : t));
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 200);
  }, []);

  const add = useCallback((type: ToastType, message: string, opts: ToastOptions = {}) => {
    const id       = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const duration = opts.duration ?? (type === "error" ? 6000 : 4000);

    setToasts(prev => [...prev.slice(-4), { id, type, message, description: opts.description, duration, removing: false }]);

    const timer = setTimeout(() => remove(id), duration);
    timers.current.set(id, timer);
  }, [remove]);

  useEffect(() => {
    const ts = timers.current;
    return () => { ts.forEach(t => clearTimeout(t)); };
  }, []);

  const ctx: ToastCtx = {
    success: (msg, opts) => add("success", msg, opts),
    error:   (msg, opts) => add("error",   msg, opts),
    warning: (msg, opts) => add("warning", msg, opts),
    info:    (msg, opts) => add("info",    msg, opts),
  };

  return (
    <Ctx.Provider value={ctx}>
      {children}
      <ToastContainer toasts={toasts} onRemove={remove} />
    </Ctx.Provider>
  );
}

// ─── UI ─────────────────────────────────────────────────────────────────────

const ICONS: Record<ToastType, React.ElementType> = {
  success: CheckCircle2,
  error:   AlertCircle,
  warning: AlertTriangle,
  info:    Info,
};

const STYLES: Record<ToastType, string> = {
  success: "border-green-500/30 bg-green-500/10",
  error:   "border-red-500/30 bg-red-500/10",
  warning: "border-yellow-500/30 bg-yellow-500/10",
  info:    "border-brand-300/30 bg-brand-300/10",
};

const ICON_STYLES: Record<ToastType, string> = {
  success: "text-green-400",
  error:   "text-red-400",
  warning: "text-yellow-400",
  info:    "text-brand-200",
};

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
      aria-label="Notificaciones"
    >
      {toasts.map(toast => {
        const Icon = ICONS[toast.type];
        return (
          <div
            key={toast.id}
            role="alert"
            className={cn(
              "pointer-events-auto flex items-start gap-3 w-full max-w-sm",
              "rounded-xl border p-4 shadow-xl",
              "glass-card",
              STYLES[toast.type],
              toast.removing
                ? "animate-toast-out"
                : "animate-toast-in"
            )}
          >
            <Icon className={cn("w-4 h-4 shrink-0 mt-0.5", ICON_STYLES[toast.type])} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-100">{toast.message}</p>
              {toast.description && (
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{toast.description}</p>
              )}
            </div>
            <button
              onClick={() => onRemove(toast.id)}
              className="btn-icon w-6 h-6 shrink-0 -mt-0.5 -mr-1"
              aria-label="Cerrar notificación"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
