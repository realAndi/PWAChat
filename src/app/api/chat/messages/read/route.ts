import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import Pusher from 'pusher';

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true
});

export async function POST(request: Request) {
  try {
    const { messageIds } = await request.json();
    const profileId = request.headers.get('X-Profile-Id');

    if (!profileId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await db.query(
      `UPDATE messages 
       SET read_by = array_append(read_by, $1::VARCHAR(256))
       WHERE id = ANY($2::integer[])
       AND NOT ($1::VARCHAR(256) = ANY(read_by))`,
      [profileId, messageIds.map((id: string) => parseInt(id, 10))]
    );

    // Broadcast read status to all clients on shared channel
    await pusher.trigger('chat', 'message-read', {
      messageIds,
      readerId: profileId
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to mark messages as read:', error);
    return NextResponse.json({ error: 'Failed to mark messages as read' }, { status: 500 });
  }
}