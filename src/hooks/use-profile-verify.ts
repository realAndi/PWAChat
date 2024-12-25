import { useQuery } from '@tanstack/react-query';
import { useProfileStorage } from './use-profile-storage';

export function useProfileVerify() {
  const { profileId } = useProfileStorage();

  return useQuery({
    queryKey: ['profile-verify', profileId],
    queryFn: async () => {
      if (!profileId) return null;
      const res = await fetch(`/api/profiles/verify?id=${profileId}`);
      if (!res.ok) {
        throw new Error('Profile verification failed');
      }
      return res.json();
    },
    enabled: !!profileId,
    staleTime: Infinity, // Only refetch when explicitly invalidated
    gcTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: false
  });
}