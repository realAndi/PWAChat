"use client";

import { useEffect } from 'react';
import { usePusher } from '@/contexts/pusher-context';
import { useQueryClient } from '@tanstack/react-query';
import { Message } from '@/lib/types';
import { useUnreadStore } from '@/lib/stores/unread-store';
import { useViewStore } from '@/lib/stores/view-store';
export function PusherEventsHandler() {
  const { client } = usePusher();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!client) return;

    // Subscribe to main channel for tickets
    const mainChannel = client.subscribe('main-channel');
    const subscribedChannels = new Set<string>();


    // Function to subscribe to a ticket channel
    const subscribeToTicketChannel = (ticketId: string) => {
      const channelName = `ticket-${ticketId}`;
      if (subscribedChannels.has(channelName)) return;

      const ticketChannel = client.subscribe(channelName);
      subscribedChannels.add(channelName);

      ticketChannel.bind('ticket-used', ({ username, used_at }: { username: string, used_at: string }) => {
        // Update the cache directly instead of invalidating
        queryClient.setQueryData(['ticket-uses', ticketId], (oldData: any) => ({
          users: [
            { username, used_at },
            ...(oldData?.users || [])
          ]
        }));
      });

      ticketChannel.bind('ticket-viewed', ({ username, viewed_at }: { username: string, viewed_at: string }) => {
        queryClient.invalidateQueries({ 
          queryKey: ['ticket-views', ticketId] 
        });
      });
    };


    // Chat events
    const chatChannel = client.subscribe('chat');
    chatChannel.bind('new-message', async (message: Message) => {
      console.log('Received new message:', message);
      
      // Update React Query cache
      queryClient.setQueryData(['chat-messages'], (oldData: any) => {
        if (!oldData?.pages) return oldData;
        
        return {
          ...oldData,
          pages: oldData.pages.map((page: Message[], index: number) => 
            index === oldData.pages.length - 1 
              ? [...page, message].sort((a, b) => 
                  new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                )
              : page
          )
        };
      });

      // Show notification if page is hidden
      if (
        document.visibilityState === 'hidden' && 
        'Notification' in window && 
        Notification.permission === 'granted'
      ) {
        // Get username from cache or fetch it
        const usernames = queryClient.getQueryData(['usernames']) as Record<string, string>;
        let username = usernames?.[message.userId] || message.username;
        
        if (!username) {
          try {
            const response = await fetch('/api/profiles/usernames', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userIds: [message.userId] })
            });
            const data = await response.json();
            username = data[message.userId];
          } catch (error) {
            username = 'Someone';
          }
        }

        new Notification('New Message', {
          body: `${username}: ${message.content}`,
          icon: '/icon-192x192.png', // Add your PWA icon path
          tag: 'chat-message',
          requireInteraction: false,
          silent: false
        });
      }

      // Update usernames cache
      queryClient.setQueryData(['usernames'], (oldData: Record<string, string> = {}) => {
        if (!oldData[message.userId] && message.username) {
          return { ...oldData, [message.userId]: message.username };
        }
        return oldData;
      });

      const currentView = useViewStore.getState().currentView;
      const lastReadMessageId = useUnreadStore.getState().lastReadMessageId;

      if (currentView !== 'chat' && (!lastReadMessageId || message.id !== lastReadMessageId)) {
    useUnreadStore.getState().incrementUnreadCount();
    }
    });

    chatChannel.bind('message-read', ({ messageIds, readerId }: { messageIds: string[], readerId: string }) => {
      console.log('Received read update:', { messageIds, readerId });
      queryClient.setQueryData(['chat-messages'], (oldData: any) => {
        if (!oldData?.pages) return oldData;
        
        return {
          ...oldData,
          pages: oldData.pages.map((page: Message[]) =>
            page.map(msg => ({
              ...msg,
              readBy: messageIds.includes(msg.id)
                ? [...(msg.readBy || []), readerId]
                : msg.readBy
            }))
          )
        };
      });

      // Invalidate usernames query if we don't have this reader's username
      queryClient.setQueryData(['usernames'], (oldData: Record<string, string> = {}) => {
        if (!oldData[readerId]) {
          queryClient.invalidateQueries({ queryKey: ['usernames'] });
        }
        return oldData;
      });
    });

    // Connection handling
    client.connection.bind('connected', () => {
      console.log('Connected to Pusher');
    });

    client.connection.bind('disconnected', () => {
      console.log('Disconnected from Pusher');
    });

    return () => {
      mainChannel.unbind_all();
      client.unsubscribe('main-channel');

      // Unsubscribe from all ticket channels
      subscribedChannels.forEach(channelName => {
        client.unsubscribe(channelName);
      });
      subscribedChannels.clear();

      chatChannel.unbind_all();
      client.unsubscribe('chat');
    };
  }, [client, queryClient]);

  return null;
}