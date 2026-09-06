import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type HeaderToolbarContextValue = {
  toolbar: React.ReactNode;
  setToolbar: (node: React.ReactNode) => void;
  clearToolbar: () => void;
};

const HeaderToolbarContext = createContext<HeaderToolbarContextValue | null>(null);

export function HeaderToolbarProvider({ children }: { children: React.ReactNode }) {
  const [toolbar, setToolbarState] = useState<React.ReactNode>(null);

  const setToolbar = useCallback((node: React.ReactNode) => {
    setToolbarState(node);
  }, []);

  const clearToolbar = useCallback(() => {
    setToolbarState(null);
  }, []);

  const value = useMemo(
    () => ({ toolbar, setToolbar, clearToolbar }),
    [toolbar, setToolbar, clearToolbar]
  );

  return <HeaderToolbarContext.Provider value={value}>{children}</HeaderToolbarContext.Provider>;
}

export function useHeaderToolbar(): HeaderToolbarContextValue {
  const context = useContext(HeaderToolbarContext);
  if (!context) {
    return {
      toolbar: null,
      setToolbar: () => {},
      clearToolbar: () => {},
    };
  }
  return context;
}
