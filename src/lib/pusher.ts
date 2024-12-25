import PusherClient from 'pusher-js';

let globalPusherClient: PusherClient | null = null;
let connectionPromise: Promise<PusherClient> | null = null;

export async function initializePusher() {
  if (connectionPromise) return connectionPromise;

  connectionPromise = new Promise((resolve, reject) => {
    try {
      const pusher = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
        enabledTransports: ['ws', 'wss'],
      });

      pusher.connection.bind('connected', () => {
        console.log('Pusher connected');
        globalPusherClient = pusher;
        resolve(pusher);
      });

      pusher.connection.bind('error', (err: any) => {
        console.error('Pusher connection error:', err);
        // The PusherStatus component will automatically show the connection state
      });

    } catch (error) {
      reject(error);
    }
  });

  return connectionPromise;
}

export function getPusherClient() {
  if (!globalPusherClient) {
    throw new Error('Pusher not initialized');
  }
  return globalPusherClient;
}

export { globalPusherClient };