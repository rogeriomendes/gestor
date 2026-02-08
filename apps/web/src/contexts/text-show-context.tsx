"use client";

import type React from "react";
import { createContext, useContext, useState } from "react";

interface TextContextType {
  isShowing: boolean;
  toggleShow: () => void;
}

const TextContext = createContext<TextContextType | undefined>(undefined);

export function useTextContext() {
  const context = useContext(TextContext);
  if (!context) {
    throw new Error("useTextContext must be used within a TextShowProvider");
  }
  return context;
}

export function TextShowProvider({ children }: { children: React.ReactNode }) {
  const [isShowing, setIsShowing] = useState(true);

  function toggleShow() {
    setIsShowing(!isShowing);
  }

  return (
    <TextContext.Provider value={{ isShowing, toggleShow }}>
      {children}
    </TextContext.Provider>
  );
}
