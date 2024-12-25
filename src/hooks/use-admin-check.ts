import { useQuery } from '@tanstack/react-query';
import { useProfileStorage } from './use-profile-storage';

export function useAdminCheck() {
  const { profileId } = useProfileStorage();

  return useQuery({
    queryKey: ['isAdmin', profileId],
    queryFn: async () => {
      if (!profileId) return false;
      const response = await fetch('/api/admin/users', {
        headers: { 'X-Profile-Id': profileId || '' }
      });
      
      if (!response.ok) return false;
      
      const data = await response.json();
      return data.users.some((user: any) => 
        user.id === profileId && user.is_admin
      );
    },
    staleTime: Infinity,
  });
}