"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProfileStorage } from "@/hooks/use-profile-storage";
import { Loader2 } from "lucide-react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { usePusher } from '@/contexts/pusher-context';

export function ProfileCheck({ children }: { children: React.ReactNode }) {
  const { profileId, saveProfileId, isLoading: isStorageLoading } = useProfileStorage();
  const [inviteKey, setInviteKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showReload, setShowReload] = useState(false);
  const queryClient = useQueryClient();


  const { client, isConnected } = usePusher();
  const { isLoading: isVerifying } = useQuery({
    queryKey: ['profile-verify', profileId],
    queryFn: async () => {
      if (!profileId) return null;

      const response = await fetch(`/api/profiles/verify?id=${profileId}`);
      if (!response.ok) {
        localStorage.removeItem('profileId');
        saveProfileId('');
        throw new Error('Invalid profile');
      }
      return response.json();
    },
    enabled: !!profileId,
    staleTime: Infinity,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
  
    try {
      const response = await fetch('/api/profiles/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteKey })
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.message || 'Invalid invite key');
      }
  
      document.cookie = `profileId=${data.id}; path=/; max-age=31536000; SameSite=Strict`;
      localStorage.setItem('profileId', data.id);
      saveProfileId(data.id);
      setShowReload(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to verify invite key');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isStorageLoading || isVerifying) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!profileId) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-md p-6 space-y-4">
          {showReload ? (
            <div className="text-center space-y-4">
              <h2 className="text-xl font-semibold text-green-600">Invite Key Accepted!</h2>
              <p className="text-muted-foreground">
                Your account is ready. Please reload the page to continue.
              </p>
              <Button 
                className="w-full"
                onClick={() => window.location.reload()}
              >
                Reload Page
              </Button>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-semibold">You are not authorized to use this app.</h1>
              <p className="text-muted-foreground">
                To use this app, you need an invite key.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  type="text"
                  placeholder="Enter invite key"
                  value={inviteKey}
                  onChange={(e) => setInviteKey(e.target.value)}
                  disabled={isSubmitting}
                />
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button 
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Verifying...</span>
                    </div>
                  ) : (
                    'Confirm'
                  )}
                </Button>
              </form>
            </>
          )}
        </Card>
      </div>
    );
  }

  return children;
}