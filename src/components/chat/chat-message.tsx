import { Message } from '@/lib/types';
import { format } from 'date-fns';
import { useProfileStorage } from '@/hooks/use-profile-storage';
import { cn } from '@/lib/utils';
import { useMemo, useEffect } from 'react';
import { CheckCheck } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';

interface ChatMessageProps {
  message: Message;
  showTimeBreak?: boolean;
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
  totalParticipants: number;
  usernames?: Record<string, string>;
  previousReadBy?: string[];
  nextReadBy?: string[];
}

export function ChatMessage({ 
    message, 
    showTimeBreak,
    isFirstInGroup = true,
    isLastInGroup = true,
    totalParticipants,
    usernames = {},
    previousReadBy = [],
    nextReadBy = []
  }: ChatMessageProps) {
    const { profileId } = useProfileStorage();
    const queryClient = useQueryClient();
    const isAuthor = String(message.userId) === String(profileId);
    const [showReadByDialog, setShowReadByDialog] = useState(false);
    
    const missingUserIds = useMemo(() => {
      const allUserIds = new Set([
        ...(message.readBy || []),
        message.userId
      ]);
      return Array.from(allUserIds).filter(id => !usernames[id]);
    }, [message.readBy, message.userId, usernames]);

    const { data: newUsernames } = useQuery({
      queryKey: ['usernames', missingUserIds.sort().join(',')],
      queryFn: async () => {
        if (missingUserIds.length === 0) return {};
        
        const res = await fetch('/api/profiles/usernames', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userIds: missingUserIds }),
        });
        
        if (!res.ok) throw new Error('Failed to fetch usernames');
        return res.json();
      },
      enabled: missingUserIds.length > 0,
      staleTime: Infinity,
      gcTime: 1000 * 60 * 60,
    });

    useEffect(() => {
      if (newUsernames) {
        queryClient.setQueryData(['usernames'], (oldData: Record<string, string> = {}) => ({
          ...oldData,
          ...newUsernames
        }));
      }
    }, [newUsernames, queryClient]);
    
    const messageTime = useMemo(() => {
      try {
        return format(new Date(message.createdAt), 'HH:mm');
      } catch (error) {
        console.error('Error formatting time:', error);
        return '--:--';
      }
    }, [message.createdAt]);
    
    const dateBreakTime = useMemo(() => {
      try {
        return format(new Date(message.createdAt), 'MMMM d, yyyy');
      } catch (error) {
        console.error('Error formatting date:', error);
        return '';
      }
    }, [message.createdAt]);
  
    const readCount = message.readBy?.length || 0;
    const unreadCount = useMemo(() => {
      return Math.max(0, totalParticipants - readCount);
    }, [totalParticipants, readCount]);

    const hasSameReaders = useMemo(() => {
      const currentReaders = message.readBy || [];
      const prevReaders = previousReadBy || [];

      if (currentReaders.length !== prevReaders.length) return false;

      const sortedCurrent = [...currentReaders].sort();
      const sortedPrev = [...prevReaders].sort();

      return sortedCurrent.every((reader, index) => reader === sortedPrev[index]);
    }, [message.readBy, previousReadBy]);

    const hasSameReadersAsNext = useMemo(() => {
      const currentReaders = message.readBy || [];
      const nextReaders = nextReadBy || [];

      if (currentReaders.length !== nextReaders.length) return false;

      const sortedCurrent = [...currentReaders].sort();
      const sortedNext = [...nextReaders].sort();

      return sortedCurrent.every((reader, index) => reader === sortedNext[index]);
    }, [message.readBy, nextReadBy]);

    const shouldHideNumber = useMemo(() => {
      const currentReaders = message.readBy || [];
      const nextReaders = nextReadBy || [];
      
      // Only hide if the next message has more readers
      // This way, we show checkmarks for all messages that are fully read
      return nextReaders.length > currentReaders.length && 
             currentReaders.every(reader => nextReaders.includes(reader));
    }, [message.readBy, nextReadBy]);

    const animationKey = useMemo(() => {
      if (!message.readBy?.length) return `unread-${unreadCount}`;
      return `${message.readBy.sort().join(',')}-${unreadCount}`;
    }, [message.readBy, unreadCount]);

    const handleReadByClick = () => {
      if (readCount > 0) {
        setShowReadByDialog(true);
      }
    };

    const renderReadStatus = () => {
      if (shouldHideNumber) return null;

      return (
        <span 
          className={cn(
            "text-xs font-medium text-muted-foreground self-center mb-4",
            "relative overflow-hidden"
          )}
        >
          {unreadCount > 0 ? (
            <span 
              key={animationKey}
              className="inline-block animate-[numberChange_200ms_ease-out]"
            >
              {unreadCount}
            </span>
          ) : (
            <>
              <span 
                className="inline-block animate-[fadeOutLeft_200ms_ease-out]"
                style={{
                  position: 'absolute',
                  left: 0,
                  animationFillMode: 'forwards'
                }}
              >
                {1}
              </span>
              <CheckCheck 
                className="w-4 h-4 animate-[slideFromRight_300ms_ease-out] opacity-0" 
                style={{
                  animationDelay: '150ms',
                  animationFillMode: 'forwards'
                }}
              />
            </>
          )}
        </span>
      );
    };

    return (
      <>
        <div className={cn(
          "space-y-2",
          !isFirstInGroup && "mt-0.5"
        )}>
          {showTimeBreak && (
            <div className="text-xs text-center text-muted-foreground py-2">
              {dateBreakTime}
            </div>
          )}
          <div className={cn(
            "flex items-end gap-1",
            isAuthor ? "justify-end" : "justify-start"
          )}>
            {isAuthor && renderReadStatus()}
            <div 
              className="flex flex-col max-w-[80%]"
              onDoubleClick={handleReadByClick}
            >
              <div className={cn(
                "relative px-3 py-1.5",
                "bg-muted text-sm rounded-lg w-fit",
                isAuthor ? [
                  "bg-primary text-primary-foreground",
                  isFirstInGroup && isLastInGroup ? "rounded-lg" : [
                    isFirstInGroup && "rounded-br-sm",
                    !isFirstInGroup && !isLastInGroup && "rounded-tr-sm rounded-br-sm", 
                    isLastInGroup && "rounded-tr-sm",
                  ]
                ] : [
                  "bg-muted",
                  isFirstInGroup && isLastInGroup ? "rounded-lg" : [
                    isFirstInGroup && "rounded-bl-none",
                    !isFirstInGroup && !isLastInGroup && "rounded-tl-sm rounded-bl-sm",
                    isLastInGroup && "rounded-tl-sm",
                  ]
                ]
              )}>
                {(!isAuthor && isFirstInGroup) && (
                  <span className="block text-xs font-medium text-muted-foreground mb-0.5">
                    {message.username}
                  </span>
                )}
                <p className="break-words whitespace-pre-wrap">
                  {message.content}
                </p>
              </div>
              
              {/* Time */}
              {isLastInGroup && (
                <div className={cn(
                  "flex mt-1 text-xs text-muted-foreground",
                  isAuthor ? "justify-end" : "justify-start"
                )}>
                  <span>{messageTime}</span>
                </div>
              )}
            </div>
            {!isAuthor && renderReadStatus()}
          </div>
        </div>

        <Dialog open={showReadByDialog} onOpenChange={setShowReadByDialog}>
          <DialogContent className="sm:max-w-md w-[270px]">
            <DialogHeader>
              <DialogTitle>Read by</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              {message.readBy?.map((readerId) => (
                <div 
                  key={readerId} 
                  className="flex items-center justify-between py-1"
                >
                  <span className="text-sm">
                    {readerId === profileId 
                      ? 'You' 
                      : (usernames[readerId] || 'Unknown user')}
                  </span>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }