import PusherServer from 'pusher';
import { config } from 'dotenv';

// Load environment variables
config();

const pusher = new PusherServer({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true
});

async function terminateConnections() {
  try {
    // Get channel info including connected users
    const channelInfo = await pusher.get({
      path: '/channels/tickets',
      params: {
        info: ['user_count', 'subscription_count', 'user_info']
      }
    });

    console.log('Channel Info:', await channelInfo.json());

    // Get list of users
    const users = await pusher.get({
      path: '/channels/tickets/users',
      params: {}
    });

    console.log('Connected Users:', await users.json());

    // Try to terminate each user's connection
    const usersData = await users.json();
    if (usersData.users) {
      for (const user of usersData.users) {
        try {
          await pusher.terminateUserConnections(user.id);
          console.log(`Terminated connections for user: ${user.id}`);
        } catch (userError) {
          console.log(`Failed to terminate user ${user.id}:`, userError);
        }
      }
    }

  } catch (error) {
    console.error('Failed to terminate connections:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
    }
  } finally {
    process.exit(0);
  }
}

terminateConnections();