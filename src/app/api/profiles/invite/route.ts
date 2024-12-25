import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import Pusher from "pusher";

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true
});

export async function POST(request: Request) {
  const { inviteKey } = await request.json();
  console.log('Received invite key:', inviteKey);

  try {
    // Find profile with matching invite key
    const { rows } = await db.query(
      'SELECT * FROM profiles WHERE invite_key = $1',
      [inviteKey]
    );
    console.log('Found profiles:', rows);

    const profile = rows[0];
    if (!profile) {
      console.log('No profile found for invite key');
      return NextResponse.json({ message: 'Invalid invite key' }, { status: 400 });
    }

    // Clear the invite key
    await db.query(
      'UPDATE profiles SET invite_key = NULL WHERE id = $1',
      [profile.id]
    );
    console.log('Updated profile:', profile.id);

    // Update the profile status when verified
    await db.query(
      'UPDATE profiles SET status = $1 WHERE id = $2',
      ['registered', profile.id]
    );

    // Notify clients about user status change
    await pusher.trigger('chat', 'user-status-change', {});

    return NextResponse.json({ id: profile.id });
  } catch (error) {
    console.error('Profile invite error:', error);
    return NextResponse.json({ message: 'Failed to process invite key' }, { status: 500 });
  }
}