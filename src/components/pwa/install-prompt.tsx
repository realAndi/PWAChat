"use client";

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export function InstallPrompt({ children }: { children: React.ReactNode }) {
  const [isStandalone, setIsStandalone] = useState(true);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const inDevelopment = localStorage.getItem('inDevelopment') === 'true';
    if (inDevelopment) {
      setIsStandalone(true);
      return;
    }

    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                      (window.navigator as any).standalone ||
                      document.referrer.includes('android-app://');

    const ios = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());

    setIsStandalone(standalone);
    setIsIOS(ios);
  }, []);

  if (!isStandalone && isIOS) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-background">
        <Card className="max-w-md p-6 space-y-6">
          <div className="flex flex-col items-center space-y-2">
            <AlertTriangle className="w-12 h-12 text-primary" />
            <h1 className="text-xl font-semibold text-center">Install This App</h1>
          </div>
          
          <p className="text-center text-muted-foreground">
            To install this app on your iPhone:
          </p>

          <Card className="space-y-3 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                1
              </div>
              <p>Tap the share button at the bottom of your screen</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                2
              </div>
              <p>Scroll down and tap "Add to Home Screen"</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                3
              </div>
              <p>Tap "Add" to install</p>
            </div>
          </Card>

          <p className="text-xs text-center text-muted-foreground">
            Once installed, you'll be able to enter your invite key and start using the app.
          </p>
        </Card>
      </div>
    );
  }

  return children;
}