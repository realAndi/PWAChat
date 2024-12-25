"use client";

import { cn } from "@/lib/utils";
import { MessageCircleIcon, InfoIcon, UsersIcon } from "lucide-react";
import { useUnreadStore } from "@/lib/stores/unread-store";
import { useViewStore } from "@/lib/stores/view-store";
import type { ViewType } from "@/lib/types";

const BottomNav = () => {
  const { currentView, setView } = useViewStore();
  const unreadCount = useUnreadStore((state) => state.unreadCount);

  const tabs: { name: string; view: ViewType; icon: any }[] = [
    {
      name: "Home",
      view: "members",
      icon: UsersIcon,
    },
    {
      name: "Chat",
      view: "chat",
      icon: MessageCircleIcon,
    },
    {
      name: "About",
      view: "about",
      icon: InfoIcon,
    },
  ];

  return (
    <div className="fixed bottom-0 justify-center left-0 right-0 bg-background border-t border-border h-20">
      <nav className="flex h-full pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.name}
            onClick={() => setView(tab.view)}
            className={cn(
              "flex-1 flex flex-col items-center justify-center relative",
              currentView === tab.view
                ? "text-primary"
                : "text-muted-foreground hover:text-primary"
            )}
          >
            <tab.icon className="h-6 w-6" />
            {tab.view === 'chat' && unreadCount > 0 && (
              <span className="absolute top-0 right-4 bg-blue-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                {unreadCount}
              </span>
            )}
            <span className="text-xs mt-2">{tab.name}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default BottomNav;