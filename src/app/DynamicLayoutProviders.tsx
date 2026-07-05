'use client';
import React, { Suspense } from 'react';

import { Toaster as SonnerToaster } from 'sonner';
import { ThemeProvider, useTheme } from 'next-themes';
import { AppProgressBar as ProgressBar } from 'next-nprogress-bar';

function CustomerToaster() {
  const theme = useTheme();
  const currentTheme = theme.theme === 'light' ? 'light' : 'dark';
  return <SonnerToaster richColors theme={currentTheme} />;
}

/**
 * App-wide providers: theme, react-query, supabase listener, progress bar.
 *
 * Ubuntu Town OS CI is light-default: enableSystem is disabled so first paint
 * is the cream/light theme regardless of OS preference; users opt into dark
 * via the ThemeToggle (persisted by next-themes).
 */
export function DynamicLayoutProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider
      attribute="class"
      enableSystem={false}
      themes={['light', 'dark']}
      defaultTheme="light"
    >
      {children}
      <Suspense>
        <ProgressBar
          height="4px"
          color="#6B1F66"
          options={{ showSpinner: false }}
          shallowRouting
        />
        <CustomerToaster />
      </Suspense>
    </ThemeProvider>
  );
}
