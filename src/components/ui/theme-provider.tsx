"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";
const THEME_KEY = "infrale_theme";

interface ThemeCtx {
  theme:    Theme;
  setTheme: (t: Theme) => void;
  toggle:   () => void;
}

const Ctx = createContext<ThemeCtx>({
  theme:    "dark",
  setTheme: () => {},
  toggle:   () => {},
});

export function useTheme() { return useContext(Ctx); }

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    const saved = (localStorage.getItem(THEME_KEY) as Theme) ?? "dark";
    setThemeState(saved);
    applyTheme(saved);
  }, []);

  function setTheme(t: Theme) {
    setThemeState(t);
    localStorage.setItem(THEME_KEY, t);
    applyTheme(t);
  }

  function toggle() { setTheme(theme === "dark" ? "light" : "dark"); }

  return (
    <Ctx.Provider value={{ theme, setTheme, toggle }}>
      {children}
    </Ctx.Provider>
  );
}

function applyTheme(t: Theme) {
  const html = document.documentElement;
  if (t === "light") {
    html.classList.add("light");
    html.classList.remove("dark");
  } else {
    html.classList.add("dark");
    html.classList.remove("light");
  }
}
