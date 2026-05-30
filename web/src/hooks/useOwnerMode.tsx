import { createContext, useContext, useState, type ReactNode } from "react";

interface OwnerModeContextType {
  enabled: boolean;
  toggle: () => void;
}

const OwnerModeContext = createContext<OwnerModeContextType | null>(null);

export function OwnerModeProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(false);

  return (
    <OwnerModeContext.Provider value={{ enabled, toggle: () => setEnabled((p) => !p) }}>
      {children}
    </OwnerModeContext.Provider>
  );
}

export function useOwnerMode() {
  const ctx = useContext(OwnerModeContext);
  if (!ctx) throw new Error("useOwnerMode must be used within OwnerModeProvider");
  return ctx;
}
