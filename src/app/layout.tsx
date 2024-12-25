import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { GesturePrevention } from "@/components/pwa/gesture-prevention";
import { PusherProvider } from "@/contexts/pusher-context";
import { PusherEventsHandler } from "@/components/pusher-events-handler";
import { NotificationHandler } from "@/components/notification-handler";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#ddd" id="theme-color" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body className={inter.className}>
        <Providers>
          <GesturePrevention />
          <PusherProvider>
            <NotificationHandler>
              <PusherEventsHandler />
              {children}
            </NotificationHandler>
          </PusherProvider>
        </Providers>
      </body>
    </html>
  );
}