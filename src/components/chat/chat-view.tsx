"use client";

import { useEffect, useRef, useState } from 'react';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { Message } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChatMessage } from './chat-message';
import { Loader2 } from 'lucide-react';
import { useProfileStorage } from '@/hooks/use-profile-storage';
import { useUnreadStore } from '@/lib/stores/unread-store';

export function ChatView() {
  const { profileId } = useProfileStorage();
  const [message, setMessage] = useState('');
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [lastScrollHeight, setLastScrollHeight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const [totalParticipants, setTotalParticipants] = useState(1);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status
  } = useInfiniteQuery({
    queryKey: ['chat-messages'],
    queryFn: async ({ pageParam = null }) => {
      const url = pageParam 
        ? `/api/chat/messages?cursor=${pageParam}`
        : '/api/chat/messages';
      const res = await fetch(url);
      const data = await res.json();
      return data.sort((a: Message, b: Message) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage || lastPage.length < 20) return undefined;
      return lastPage[0]?.id;
    },
    initialPageParam: null,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60,
    enabled: !!profileId
  });

  useEffect(() => {
    if (data?.pages[0]) {
      const messages = data.pages.flat();
      const latestMessage = messages[messages.length - 1];
      if (latestMessage) {
        useUnreadStore.getState().updateLastReadMessageId(latestMessage.id);
        useUnreadStore.getState().resetUnreadCount();
      }
    }
  }, [data?.pages]);

  const { data: usernames = {} } = useQuery({
    queryKey: ['usernames'],
    queryFn: async () => {
      if (!data?.pages) return {};
      
      const uniqueUserIds = new Set<string>();
      data.pages.flat().forEach(message => {
        uniqueUserIds.add(message.userId);
        message.readBy?.forEach((readerId: string) => uniqueUserIds.add(readerId));
      });

      const response = await fetch('/api/profiles/usernames', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userIds: Array.from(uniqueUserIds)
        })
      });
      
      if (!response.ok) throw new Error('Failed to fetch usernames');
      return response.json();
    },
    enabled: !!data?.pages,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60, // 1 hour
  });

  const organizeMessages = (messages: Message[]) => {
    if (!messages) return [];
    
    // Sort all messages by date
    const sortedMessages = messages.sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    return sortedMessages.map((message, index, array) => {
      const prevMessage = array[index - 1];
      const nextMessage = array[index + 1];
      
      const isFirstInGroup = !isConsecutiveMessage(message, prevMessage);
      const isLastInGroup = !isConsecutiveMessage(nextMessage, message);
      const showTimeBreak = index === 0 || shouldShowTimeBreak(message, prevMessage);

      return {
        ...message,
        isFirstInGroup,
        isLastInGroup,
        showTimeBreak
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !profileId) return;

    try {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Profile-Id': profileId
        },
        body: JSON.stringify({ content: message })
      });
      
      if (!response.ok) throw new Error('Failed to send message');

      setMessage('');
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleScroll = async (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight } = e.currentTarget;
    
    if (scrollTop === 0 && hasNextPage && !isFetchingNextPage && !isLoadingMore) {
      setIsLoadingMore(true);
      setLastScrollHeight(scrollHeight);
      await fetchNextPage();
      setIsLoadingMore(false);
    }
  };

  function isConsecutiveMessage(current: Message | undefined, previous: Message | undefined): boolean {
    if (!current || !previous) return false;
    try {
      return (
        current.userId === previous.userId &&
        new Date(current.createdAt).getTime() - new Date(previous.createdAt).getTime() < 1000 * 60 * 5
      );
    } catch (error) {
      console.error('Error checking consecutive messages:', error);
      return false;
    }
  }

  useEffect(() => {
    if (!data?.pages || !profileId) return;

    const markMessagesAsRead = async () => {
      const allMessages = data.pages.flat();
      const unreadMessages = allMessages.filter(msg => 
        !msg.readBy?.includes(profileId)
      );

      if (unreadMessages.length === 0) return;

      try {
        await fetch('/api/chat/messages/read', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Profile-Id': profileId
          },
          body: JSON.stringify({
            messageIds: unreadMessages.map(msg => msg.id)
          })
        });
      } catch (error) {
        console.error('Failed to mark messages as read:', error);
      }
    };

    markMessagesAsRead();
  }, [data?.pages, profileId]);

  useEffect(() => {
    if (containerRef.current && lastScrollHeight > 0) {
      const newScrollHeight = containerRef.current.scrollHeight;
      const scrollDiff = newScrollHeight - lastScrollHeight;
      if (scrollDiff > 0) {
        containerRef.current.scrollTop = scrollDiff;
        setLastScrollHeight(0);
      }
    }
  }, [data?.pages.length, lastScrollHeight]);

  // Scroll to bottom on initial load
  useEffect(() => {
    if (data?.pages[0] && bottomRef.current) {
      bottomRef.current.scrollIntoView();
    }
  }, [data?.pages[0]]);

  const { data: activeUsersCount = 0 } = useQuery({
    queryKey: ['active-users-count'],
    queryFn: async () => {
      const response = await fetch('/api/chat/active-users');
      const data = await response.json();
      return data.count;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  useEffect(() => {
    if (data?.pages) {
      setTotalParticipants(activeUsersCount);
    }
  }, [data?.pages, activeUsersCount]);

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] overflow-hidden">
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto bg-background"
        onScroll={handleScroll}
      >
        {status === 'pending' ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-1 p-4">
            {organizeMessages(data?.pages.flat() || []).map((message: any, index, array) => (
              <ChatMessage
                key={message.id}
                message={message}
                showTimeBreak={message.showTimeBreak}
                isFirstInGroup={message.isFirstInGroup}
                isLastInGroup={message.isLastInGroup}
                totalParticipants={totalParticipants}
                usernames={usernames}
                previousReadBy={index > 0 ? array[index - 1].readBy : []}
                nextReadBy={index < array.length - 1 ? array[index + 1].readBy : []}
              />
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex gap-2">
          <Input
            type="text"
            inputMode='text'
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button type="submit" disabled={!message.trim()}>
            Send
          </Button>
        </div>
      </form>
    </div>
  );
}

function shouldShowTimeBreak(current: Message, previous: Message): boolean {
  if (!previous) return true;
  try {
    const currentDate = new Date(current.createdAt);
    const previousDate = new Date(previous.createdAt);
    return currentDate.getTime() - previousDate.getTime() > 1000 * 60 * 24; // 24 hours
  } catch (error) {
    console.error('Date parsing error:', error);
    return false;
  }
}