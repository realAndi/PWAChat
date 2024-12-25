'use client';

import { useState } from 'react';
import { Unplug, Zap, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePusher } from '@/contexts/pusher-context';
import { useViewStore } from '@/lib/stores/view-store';

export function PusherStatus() {
  const { client, isConnected } = usePusher();
  const { currentView } = useViewStore();
  const status = client?.connection.state || 'disconnected';

  if (currentView === 'members') return null;

  const renderIcon = () => {
    switch (status) {
      case 'connected':
        return <Zap className="h-4 w-4 text-green-500" />;
      case 'disconnected':
        return <Unplug className="h-4 w-4 text-red-500" />;
      default:
        return <RefreshCw className={cn(
          "h-4 w-4 text-yellow-500",
          status === 'connecting' && "animate-spin"
        )} />;
    }
  };

  return (
    <div className="z-40 fixed top-2 right-0 flex items-center gap-2 text-xs text-muted-foreground">
      {renderIcon()}
      <style jsx global>{`
        .hide-pusher .z-40 {
          display: none;
        }
      `}</style>
    </div>
  );
}