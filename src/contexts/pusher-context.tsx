'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { initializePusher } from '@/lib/pusher';
import type PusherClient from 'pusher-js';

interface PusherContextType {
  client: PusherClient | null;
  isConnected: boolean;
}

const PusherContext = createContext<PusherContextType>({ client: null, isConnected: false });

export function PusherProvider({ children }: { children: React.ReactNode }) {
  const [client, setClient] = useState<PusherClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let pusherClient: PusherClient | null = null;

    async function setupPusher() {
      try {
        pusherClient = await initializePusher();
        setClient(pusherClient);
        setIsConnected(true);

        pusherClient.connection.bind('state_change', ({ current }: { current: string }) => {
          setIsConnected(current === 'connected');
        });
      } catch (error) {
        console.error('Failed to initialize Pusher:', error);
      }
    }

    setupPusher();

    // Handle cleanup
    return () => {
      if (pusherClient) {
        console.log('Cleaning up Pusher connection');
        pusherClient.unbind_all();
        pusherClient.disconnect();
        setClient(null);
        setIsConnected(false);
      }
    };
  }, []);

  return (
    <PusherContext.Provider value={{ client, isConnected }}>
      {children}
    </PusherContext.Provider>
  );
}

export const usePusher = () => useContext(PusherContext);