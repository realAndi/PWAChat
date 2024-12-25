"use client";

import { useAdminCheck } from '@/hooks/use-admin-check';  
import { AdminPanel } from './admin-panel';

export function AboutView() {
  const { data: isAdmin = false } = useAdminCheck();

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <header className="px-4 py-3 border-b">
        <h1 className="text-xl font-semibold">About</h1>
      </header>

      <div className="flex-1 p-4 space-y-4 overflow-auto">
        {isAdmin && <AdminPanel />}

        <section>
          <h2 className="text-lg font-semibold mb-2">Group Chat App</h2>
          <p className="text-muted-foreground">
            A simple and modern group chat application.
            <br/><br/>
            Please report any bugs or suggestions to your administrator.
          </p>
        </section>
      </div>
    </div>
  );
}