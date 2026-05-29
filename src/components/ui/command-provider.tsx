"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { CommandPalette } from "./command-palette";

interface CommandCtx {
  open:    boolean;
  setOpen: (v: boolean) => void;
  toggle:  () => void;
}

const Ctx = createContext<CommandCtx>({
  open:    false,
  setOpen: () => {},
  toggle:  () => {},
});

export function useCommand() {
  return useContext(Ctx);
}

export function CommandProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen(p => !p), []);

  // Atajo de teclado global ⌘K / Ctrl+K
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        toggle();
      }
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [toggle]);

  return (
    <Ctx.Provider value={{ open, setOpen, toggle }}>
      {children}
      <CommandPalette open={open} onClose={() => setOpen(false)} />
    </Ctx.Provider>
  );
}
