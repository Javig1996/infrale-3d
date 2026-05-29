"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X }       from "lucide-react";
import { cn }      from "@/lib/utils";

interface ModalProps {
  open:       boolean;
  onClose:    () => void;
  title?:     string;
  description?: string;
  children:   React.ReactNode;
  maxWidth?:  "sm" | "md" | "lg" | "xl";
  className?: string;
}

const MAX_W = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
} as const;

export function Modal({
  open, onClose, title, description, children, maxWidth = "md", className,
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={v => !v && onClose()}>
      <Dialog.Portal>
        {/* Overlay */}
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-scale-in" />

        {/* Content */}
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
            "w-full p-4 outline-none",
            "data-[state=open]:animate-scale-in",
            MAX_W[maxWidth]
          )}
          aria-describedby={description ? "modal-desc" : undefined}
        >
          <div className={cn("glass-card p-6 space-y-5 max-h-[90vh] overflow-y-auto", className)}>
            {/* Header */}
            {title && (
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Dialog.Title className="text-sm font-semibold text-slate-100">
                    {title}
                  </Dialog.Title>
                  {description && (
                    <Dialog.Description id="modal-desc" className="text-xs text-slate-500 mt-1">
                      {description}
                    </Dialog.Description>
                  )}
                </div>
                <Dialog.Close asChild>
                  <button
                    className="btn-icon shrink-0 -mt-0.5 -mr-1"
                    aria-label="Cerrar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </Dialog.Close>
              </div>
            )}

            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/* Subcomponentes para body y footer */
export function ModalBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("space-y-4", className)}>{children}</div>;
}

export function ModalFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center justify-end gap-3 pt-2 border-t border-surface-border", className)}>
      {children}
    </div>
  );
}
