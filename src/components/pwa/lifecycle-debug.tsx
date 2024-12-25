'use client';

import { useEffect, useState } from 'react';

export function LifecycleDebug() {
  const [status, setStatus] = useState<string>('active');

  useEffect(() => {
    const handleVisibilityChange = () => {
      setStatus(document.visibilityState);
    };

    const handlePageHide = () => {
      setStatus('pagehide');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, []);

  return (
    <div className="fixed bottom-2 left-2 text-xs text-muted-foreground">
      Lifecycle: {status}
    </div>
  );
}