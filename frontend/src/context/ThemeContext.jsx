import { createContext, useContext, useEffect, useState, useCallback } from "react";

const ThemeContext = createContext({ mode: "dark", setMode: () => {}, toggle: () => {} });

const STORAGE_KEY = "tincay360_theme";

function readStored() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "light" || v === "dark") return v;
  } catch { /* */ }
  return null;
}

function applyToHtml(mode) {
  const html = document.documentElement;
  if (mode === "light") {
    html.classList.add("light");
    html.classList.remove("dark");
  } else {
    html.classList.add("dark");
    html.classList.remove("light");
  }
  html.dataset.theme = mode;
}

export function ThemeProvider({ defaultMode = "dark", children }) {
  const [mode, setModeState] = useState(() => readStored() || defaultMode);

  // Áp dụng ngay khi mount
  useEffect(() => { applyToHtml(mode); }, [mode]);

  const setMode = useCallback((m) => {
    const next = m === "light" ? "light" : "dark";
    setModeState(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* */ }
  }, []);

  const toggle = useCallback(() => {
    setMode(mode === "dark" ? "light" : "dark");
  }, [mode, setMode]);

  return (
    <ThemeContext.Provider value={{ mode, setMode, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
