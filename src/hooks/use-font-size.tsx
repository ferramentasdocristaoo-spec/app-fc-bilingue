import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type FontSizeOption = "small" | "medium" | "large" | "xlarge";

interface FontSizeContextType {
  fontSize: FontSizeOption;
  setFontSize: (size: FontSizeOption) => void;
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
      return (localStorage.getItem("fc-font-size") as FontSizeOption) || "medium";
    } catch {
      return "medium";
    }
  });

  const setFontSize = (size: FontSizeOption) => {
    setFontSizeState(size);
    try { localStorage.setItem("fc-font-size", size); } catch {}
  };

  return (
    <FontSizeContext.Provider value={{ fontSize, setFontSize, fontSizeClass: FONT_SIZE_CLASSES[fontSize] }}>
      {children}
    </FontSizeContext.Provider>
  );
}

export function useFontSize() {
  const ctx = useContext(FontSizeContext);
  if (!ctx) throw new Error("useFontSize must be used within FontSizeProvider");
  return ctx;
}
