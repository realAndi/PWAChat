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
    const { content } = await request.json();
    const profileId = request.headers.get('X-Profile-Id');

    if (!profileId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get username from profiles
    const { rows: profiles } = await db.query(
      'SELECT username FROM profiles WHERE id = $1::VARCHAR(256)',
      [profileId]
    );

    if (!profiles.length) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Insert message with read_by initialized to include the author
    const { rows } = await db.query(
      `INSERT INTO messages (user_id, username, content, read_by) 
       VALUES ($1::VARCHAR(256), $2, $3, ARRAY[$1]::VARCHAR(256)[]) 
       RETURNING id, user_id as "userId", username, content, created_at as "createdAt", read_by as "readBy"`,
      [profileId, profiles[0].username, content]
    );

    const newMessage = rows[0];

    // Broadcast to all clients using a shared channel
    await pusher.trigger('chat', 'new-message', newMessage);

    return NextResponse.json(newMessage);
  } catch (error) {
    console.error('Failed to send message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const limit = 20;

    let query = `
      SELECT 
        m.id,
        m.user_id as "userId",
        m.username,
        m.content,
        m.created_at as "createdAt",
        m.read_by as "readBy",
        json_object_agg(p.id, p.username) FILTER (WHERE p.id IS NOT NULL) as usernames
      FROM messages m
      LEFT JOIN profiles p ON p.id = ANY(m.read_by)
      GROUP BY m.id, m.user_id, m.username, m.content, m.created_at, m.read_by
    `;

    let messages;
    if (cursor) {
      query += ` HAVING m.id < $1 ORDER BY m.created_at DESC LIMIT $2`;
      const { rows } = await db.query(query, [cursor, limit]);
      messages = rows.reverse();
    } else {
      query += ` ORDER BY m.created_at DESC LIMIT $1`;
      const { rows } = await db.query(query, [limit]);
      messages = rows.reverse();
    }

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Failed to fetch messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}