"use client";

import { useEffect } from 'react';
import { usePusher } from '@/contexts/pusher-context';
import { useQueryClient } from '@tanstack/react-query';
import { Message } from '@/lib/types';

export function usePusherEvents() {
  const { client } = usePusher();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!client) return;

    const channel = client.subscribe('chat');

    // Handle new messages
    channel.bind('new-message', (message: Message) => {
      console.log('Received new message:', message);
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

      // Update usernames cache if needed
      queryClient.setQueryData(['usernames'], (oldData: Record<string, string> = {}) => {
        if (!oldData[message.userId] && message.username) {
          return { ...oldData, [message.userId]: message.username };
        }
        return oldData;
      });
    });

    // Handle message read updates
    channel.bind('message-read', ({ messageIds, readerId }: { messageIds: string[], readerId: string }) => {
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

    return () => {
      channel.unbind_all();
      client.unsubscribe('chat');
    };
  }, [client, queryClient]);
}