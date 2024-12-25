"use client";

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Settings2 } from 'lucide-react';
import { useProfileStorage } from '@/hooks/use-profile-storage';
import { usePusher } from '@/contexts/pusher-context';

export function NotificationHandler({ children }: { children: React.ReactNode }) {
  const { profileId } = useProfileStorage();
  const { client, isConnected } = usePusher();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [showPrompt, setShowPrompt] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isIOSPWA, setIsIOSPWA] = useState(false);

  useEffect(() => {
    console.log('NotificationHandler: Starting setup...');

    // Check if running as PWA on iOS
    const isIOS = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        (window.navigator as any).standalone ||
                        document.referrer.includes('android-app://');
    
    console.log('Device checks:', { 
      isIOS, 
      isStandalone,
      userAgent: window.navigator.userAgent,
      standalone: (window.navigator as any).standalone,
      displayMode: window.matchMedia('(display-mode: standalone)').matches
    });
    
    setIsIOSPWA(isIOS && isStandalone);

    // Only proceed if we're in a PWA context
    if (!isStandalone) {
      console.log('Not running as PWA, skipping notification setup');
      return;
    }

    // Check if the browser supports notifications
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return;
    }

    // Check localStorage for user preference
    const notificationsWanted = localStorage.getItem('notificationsWanted');
    console.log('Current notification state:', {
      notificationsWanted,
      currentPermission: Notification.permission,
      isStandalone
    });
    
    // Show settings instructions if notifications are denied but user wanted them
    if (Notification.permission === 'denied' && notificationsWanted === 'true') {
      console.log('Notifications denied but wanted, showing settings instructions');
      setShowSettings(true);
      return;
    }

    // Show initial prompt if conditions are met
    if (notificationsWanted === null && 
        Notification.permission === 'default' && 
        isStandalone) {
      console.log('All conditions met, will show notification prompt');
      setTimeout(() => {
        console.log('Showing notification prompt now');
        setShowPrompt(true);
      }, 1000);
    }

    // Update permission state
    setPermission(Notification.permission);
  }, []);

  const handleSubscribe = async () => {
    try {
      console.log('Requesting notification permission...');
      const result = await Notification.requestPermission();
      console.log('Permission result:', result);
      setPermission(result);

      if (result === 'granted') {
        localStorage.setItem('notificationsWanted', 'true');
        
        // Test notification
        new Notification('Notifications Enabled', {
          body: 'You will now receive notifications for new messages when the app is in the background.',
          icon: '/icon-192x192.png',
        });
      }
      
      setShowPrompt(false);
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  const handleDecline = () => {
    localStorage.setItem('notificationsWanted', 'false');
    setShowPrompt(false);
  };

  if (showSettings) {
    return (
      <>
        {children}
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 space-y-4">
            <div className="flex flex-col items-center space-y-3">
              <Settings2 className="h-12 w-12 text-primary" />
              <h2 className="text-xl font-semibold text-center">Enable Notifications</h2>
              <div className="space-y-2 text-center">
                <p className="text-muted-foreground">
                  To receive notifications, you'll need to enable them in your device settings:
                </p>
                <ol className="text-sm space-y-2 text-left list-decimal list-inside">
                  <li>Open your iPhone Settings</li>
                  <li>Scroll down and tap on this app&apos;s name</li>
                  <li>Tap Notifications</li>
                  <li>Toggle Allow Notifications on</li>
                </ol>
              </div>
            </div>
            <Button 
              className="w-full"
              onClick={() => setShowSettings(false)}
            >
              Close
            </Button>
          </Card>
        </div>
      </>
    );
  }

  if (!showPrompt) {
    return children;
  }

  return (
    <>
      {children}
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
        <Card className="w-full max-w-md p-6 space-y-4">
          <div className="flex flex-col items-center space-y-3">
            <Bell className="h-12 w-12 text-primary" />
            <h2 className="text-xl font-semibold text-center">Enable Notifications</h2>
            <p className="text-center text-muted-foreground">
              Get notified about new messages when the app is in the background
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={handleDecline}
            >
              Not Now
            </Button>
            <Button 
              className="flex-1"
              onClick={handleSubscribe}
            >
              Enable
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}