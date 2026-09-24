"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type TownRole = 'coordinator' | 'resident' | 'admin' | null;

export interface TownContextValue {
  // The town this user is operating within
  townId: string;
  townName: string;
  townDisplayName: string;
  province: string;

  // User's role in this town
  role: TownRole;

  // Whether user is authenticated
  isAuthenticated: boolean;

  // Operations
  selectTown: (townId: string, name: string, displayName: string, province: string) => void;
  setRole: (role: TownRole) => void;
}

const TownContext = createContext<TownContextValue | null>(null);

const MOCK_TOWN: TownContextValue = {
  townId: 'mafikeng',
  townName: 'mafikeng',
  townDisplayName: 'Mafikeng',
  province: 'North West',
  role: 'coordinator',
  isAuthenticated: true,
  selectTown: () => {},
  setRole: () => {},
};

export function TownProvider({ children }: { children: ReactNode }) {
  const [context, setContext] = useState<TownContextValue>(MOCK_TOWN);

  const selectTown = (
    townId: string,
    name: string,
    displayName: string,
    province: string
  ) => {
    const newContext: TownContextValue = {
      townId,
      townName: name,
      townDisplayName: displayName,
      province,
      role: context && context.isAuthenticated ? 'coordinator' : null,
      isAuthenticated: context && context.isAuthenticated,
      selectTown,
      setRole,
    };
    setContext(newContext);
    window.sessionStorage.setItem(
      'northstar-town-context',
      JSON.stringify({
          townId,
          townName: name,
          townDisplayName: displayName,
          province,
        })
    );
  };

  const setRole = (role: TownRole) => {
    const newContext = {
      ...context,
      role,
    };
    setContext(newContext);
    window.sessionStorage.setItem(
      'northstar-town-context',
      JSON.stringify({
          townId: newContext.townId,
          townName: newContext.townName,
          townDisplayName: newContext.townDisplayName,
          province: newContext.province,
        })
    );
  };

  useEffect(() => {
    const saved = window.sessionStorage.getItem('northstar-town-context');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (
          typeof parsed.townId === 'string' &&
          typeof parsed.townName === 'string' &&
          typeof parsed.townDisplayName === 'string' &&
          typeof parsed.province === 'string'
        ) {
          setContext({
            ...MOCK_TOWN,
            townId: parsed.townId,
            townName: parsed.townName,
            townDisplayName: parsed.townDisplayName,
            province: parsed.province,
          });
        }
      } catch {
        console.error('Failed to load town context from session storage');
      }
    }
  }, []);

  return <TownContext.Provider value={context}>{children}</TownContext.Provider>;
}

export function useTownContext() {
  const ctx = useContext(TownContext);
  if (!ctx) {
    throw new Error('useTownContext must be used within a TownProvider');
  }
  return ctx;
}