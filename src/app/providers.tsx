"use client";

import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { ThemeProvider } from "@/components/theme-provider";
import { PusherProvider } from '@/contexts/pusher-context';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <PusherProvider>
          {children}
        </PusherProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}