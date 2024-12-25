"use client";

import { ChatView } from "@/components/chat/chat-view";
import { AboutView } from "@/components/about/about-view";
import BottomNav from "@/components/navigation/bottom-nav";
import { useViewStore } from "@/lib/stores/view-store";
import { ProfileCheck } from "@/components/auth/profile-check";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { PusherStatus } from '@/components/pusher-status';
import { usePusher } from "@/contexts/pusher-context";

export default function HomePage() {
  const currentView = useViewStore((state) => state.currentView);
  const { isConnected } = usePusher();  

  const renderView = () => {
    switch (currentView) {
      case 'members':
        return (
          <div className="flex flex-col h-[calc(100vh-4rem)]">
            <header className="px-4 py-3 border-b">
              <h1 className="text-xl font-semibold">Home</h1>
            </header>
            <div className="flex-1 p-4 space-y-4 overflow-auto">
              <p className="text-muted-foreground text-center">
                Welcome to the group chat app!
              </p>
            </div>
          </div>
        );
      case 'chat':
        return <ChatView />;
      case 'about':
        return <AboutView />;
      default:
        return (
          <div className="flex flex-col h-[calc(100vh-4rem)]">
            <header className="px-4 py-3 border-b">
              <h1 className="text-xl font-semibold">Home</h1>
            </header>
            <div className="flex-1 p-4 space-y-4 overflow-auto">
              <p className="text-muted-foreground text-center">
                Welcome to the group chat app!
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <InstallPrompt>
      <ProfileCheck>
        {isConnected && <PusherStatus />}
        <div className="flex flex-col h-screen">
          <main className="flex-1 overflow-auto">
            {renderView()}
          </main>
          <BottomNav />
        </div>
      </ProfileCheck>
    </InstallPrompt>
  );
}