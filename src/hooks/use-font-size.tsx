import { createContext, useContext, useState, ReactNode } from "react";

export type FontSizeOption = "small" | "medium" | "large" | "xlarge";

/** Os 4 tamanhos, em ordem. Ponto único para o A−/A+ do topo, o "Aa" do celular e os Ajustes do Dock. */
export const FONT_SIZE_OPTIONS: { value: FontSizeOption; px: number }[] = [
  { value: "small", px: 14 },
  { value: "medium", px: 17 },
  { value: "large", px: 20 },
  { value: "xlarge", px: 24 },
];

interface FontSizeContextType {
  fontSize: FontSizeOption;
  setFontSize: (size: FontSizeOption) => void;
  /** Sobe (+1) ou desce (−1) um degrau; nas pontas não faz nada. */
  stepFontSize: (delta: 1 | -1) => void;
  fontSizeClass: string;
}

const FONT_SIZE_CLASSES: Record<FontSizeOption, string> = {
  small: "font-scale-small",
  medium: "font-scale-medium",
  large: "font-scale-large",
  xlarge: "font-scale-xlarge",
};

const FontSizeContext = createContext<FontSizeContextType | undefined>(undefined);

export function FontSizeProvider({ children }: { children: ReactNode }) {
  const [fontSize, setFontSizeState] = useState<FontSizeOption>(() => {
    try {
      const saved = localStorage.getItem("fc-font-size") as FontSizeOption | null;
      return saved && FONT_SIZE_OPTIONS.some((o) => o.value === saved) ? saved : "medium";
    } catch {
      return "medium";
    }
  });

  const setFontSize = (size: FontSizeOption) => {
    setFontSizeState(size);
    try { localStorage.setItem("fc-font-size", size); } catch { /* sem armazenamento: vale só nesta sessão */ }
  };

  const stepFontSize = (delta: 1 | -1) => {
    const next = FONT_SIZE_OPTIONS[FONT_SIZE_OPTIONS.findIndex((o) => o.value === fontSize) + delta];
    if (next) setFontSize(next.value);
  };

  return (
    <FontSizeContext.Provider value={{ fontSize, setFontSize, stepFontSize, fontSizeClass: FONT_SIZE_CLASSES[fontSize] }}>
      {children}
    </FontSizeContext.Provider>
  );
}

export function useFontSize() {
  const ctx = useContext(FontSizeContext);
  if (!ctx) throw new Error("useFontSize must be used within FontSizeProvider");
  return ctx;
}
