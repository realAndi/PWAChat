// src/hooks/use-profile-storage.ts
import { useEffect, useState } from 'react';

export function useProfileStorage() {
  const [profileId, setProfileId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const request = indexedDB.open('ShaftedTransit', 1);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('profile')) {
        db.createObjectStore('profile');
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['profile'], 'readonly');
      const store = transaction.objectStore('profile');
      const getRequest = store.get('id');

      getRequest.onsuccess = () => {
        setProfileId(getRequest.result);
        setIsLoading(false);
      };
    };

    request.onerror = () => {
      setIsLoading(false);
    };
  }, []);

  const saveProfileId = (id: string) => {
    const request = indexedDB.open('ShaftedTransit', 1);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['profile'], 'readwrite');
      const store = transaction.objectStore('profile');
      store.put(id, 'id');
      setProfileId(id);
    };
  };

  return { profileId, saveProfileId, isLoading };
}