import { createContext, useContext, useEffect, useState } from "react";

type Font = "custom" | "standard";

interface FontContextType {
  font: Font;
  toggleFont: () => void;
  setFont: (font: Font) => void;
}

const FontContext = createContext<FontContextType | undefined>(undefined);

export function useFont() {
  const context = useContext(FontContext);
  if (context === undefined) {
    throw new Error("useFont must be used within a FontProvider");
  }
  return context;
}

interface FontProviderProps {
  children: React.ReactNode;
  defaultFont?: Font;
}

export function FontProvider({
  children,
  defaultFont = "custom",
}: FontProviderProps) {
  const [font, setFontState] = useState<Font>(() => {
    // Check localStorage for saved font preference
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("font-preference") as Font;
      return saved || defaultFont;
    }
    return defaultFont;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove previous font classes
    root.classList.remove("custom-font", "standard-font");
    
    // Add current font class
    if (font === "standard") {
      root.classList.add("standard-font");
    } else {
      root.classList.add("custom-font");
    }
    
    // Save to localStorage
    localStorage.setItem("font-preference", font);
  }, [font]);

  const setFont = (newFont: Font) => {
    setFontState(newFont);
  };

  const toggleFont = () => {
    setFontState(prev => prev === "custom" ? "standard" : "custom");
  };

  const value: FontContextType = {
    font,
    setFont,
    toggleFont,
  };

  return (
    <FontContext.Provider value={value}>
      {children}
    </FontContext.Provider>
  );
}