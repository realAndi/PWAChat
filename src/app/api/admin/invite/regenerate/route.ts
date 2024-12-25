import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomBytes } from 'crypto';
import { headers } from 'next/headers';

export async function POST(request: Request) {
  try {
    const profileId = headers().get('X-Profile-Id');
    
    if (!profileId) {
      return NextResponse.json({ message: 'No profile ID provided' }, { status: 401 });
    }

    // Check if user is admin
    const { rows: adminCheck } = await db.query(
      'SELECT * FROM admins WHERE profile_id = $1',
      [profileId]
    );

    if (!adminCheck.length) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { username } = await request.json();
    
    if (!username) {
      return NextResponse.json({ message: 'Username is required' }, { status: 400 });
    }

    // Find the profile
    const { rows: profiles } = await db.query(
      'SELECT * FROM profiles WHERE username = $1',
      [username]
    );

    if (!profiles.length) {
      return NextResponse.json({ message: 'Profile not found' }, { status: 404 });
    }

    // Generate new invite key
    const inviteKey = randomBytes(16).toString('hex');

    // Update the profile with new invite key and status
    await db.query(
      'UPDATE profiles SET invite_key = $1, status = $2 WHERE username = $3',
      [inviteKey, 'regenerated', username]
    );

    return NextResponse.json({ inviteKey });
  } catch (error) {
    console.error('Failed to regenerate invite:', error);
    return NextResponse.json(
      { message: 'Failed to regenerate invite' }, 
      { status: 500 }
    );
  }
}