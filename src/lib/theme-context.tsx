"use client";
import { createContext, useContext, useEffect, useState } from "react";

export type ThemeMode = "dark" | "light" | "auto";

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  resolvedTheme: "dark" | "light";
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: "dark",
  setMode: () => {},
  resolvedTheme: "dark",
});

function getResolved(mode: ThemeMode): "dark" | "light" {
  if (mode !== "auto") return mode;
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("dark");
  const [resolvedTheme, setResolvedTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const stored = (localStorage.getItem("aviva-theme") as ThemeMode) || "dark";
    setModeState(stored);
    const resolved = getResolved(stored);
    setResolvedTheme(resolved);
    document.documentElement.classList.toggle("theme-light", resolved === "light");
  }, []);

  useEffect(() => {
    const resolved = getResolved(mode);
    setResolvedTheme(resolved);
    document.documentElement.classList.toggle("theme-light", resolved === "light");
  }, [mode]);

  useEffect(() => {
    if (mode !== "auto") return;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const handler = () => {
      const resolved = getResolved("auto");
      setResolvedTheme(resolved);
      document.documentElement.classList.toggle("theme-light", resolved === "light");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [mode]);

  function setMode(m: ThemeMode) {
    setModeState(m);
    localStorage.setItem("aviva-theme", m);
  }

  return (
    <ThemeContext.Provider value={{ mode, setMode, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
