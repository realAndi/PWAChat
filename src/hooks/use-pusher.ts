import { useEffect } from 'react';
import { getPusherClient } from '@/lib/pusher';

// Store connections by profileId
const connectionStore: { [key: string]: any } = {};

type PusherEvent = {
  channelName: string;
  eventName: string;
  callback: (data: any) => void;
};

export function usePusher(events: PusherEvent[], profileId?: string) {
  useEffect(() => {
    if (!profileId) return;

    // Get existing or create new connection
    if (!connectionStore[profileId]) {
      connectionStore[profileId] = getPusherClient();
    }

    const pusherClient = connectionStore[profileId];

    // Ensure connection is established
    if (pusherClient.connection.state === 'disconnected') {
      pusherClient.connect();
    }

    // Subscribe to all events
    const subscriptions = events.map(({ channelName, eventName, callback }) => {
      const channel = pusherClient.subscribe(channelName);
      channel.bind(eventName, callback);
      return { channel, eventName, callback };
    });

    return () => {
      // Cleanup all subscriptions
      subscriptions.forEach(({ channel, eventName, callback }) => {
        channel.unbind(eventName, callback);
        pusherClient.unsubscribe(channel.name);
      });
    };
  }, [events, profileId]);

  // Only try to access connection state if profileId exists
  const connectionState = profileId ? connectionStore[profileId]?.connection.state : 'disconnected';
  return connectionState;
}