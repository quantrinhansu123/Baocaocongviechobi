import React, { createContext, useContext } from 'react';

type MobileShellContextValue = {
  openMenu: () => void;
};

const MobileShellContext = createContext<MobileShellContextValue | null>(null);

export function MobileShellProvider({
  openMenu,
  children,
}: {
  openMenu: () => void;
  children: React.ReactNode;
}) {
  return <MobileShellContext.Provider value={{ openMenu }}>{children}</MobileShellContext.Provider>;
}

export function useMobileShell(): MobileShellContextValue {
  const context = useContext(MobileShellContext);
  if (!context) {
    return { openMenu: () => {} };
  }
  return context;
}
