export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { randomBytes } from 'crypto';
import { headers } from 'next/headers';

export async function POST(request: Request) {
  try {
    // Get profile ID from request headers (we'll set this on the client side)
    const profileId = headers().get('X-Profile-Id');
    console.log('Profile ID from header:', profileId);
    
    if (!profileId) {
      return NextResponse.json({ message: 'No profile ID provided' }, { status: 401 });
    }

    // Check if user is admin
    const { rows: adminCheck } = await db.query(
      'SELECT * FROM admins WHERE profile_id = $1',
      [profileId]
    );

    console.log('Admin check result:', adminCheck);

    if (!adminCheck.length) {
      return NextResponse.json({ message: 'Profile not found in admins table' }, { status: 401 });
    }

    // Get username from request body
    const { username } = await request.json();
    
    if (!username) {
      return NextResponse.json({ message: 'Username is required' }, { status: 400 });
    }

    // Generate invite key and profile ID
    const inviteKey = randomBytes(16).toString('hex');
    const newProfileId = uuidv4();

    // Create new profile with invite key
    await db.query(
      'INSERT INTO profiles (id, username, invite_key) VALUES ($1, $2, $3)',
      [newProfileId, username, inviteKey]
    );

    return NextResponse.json({ inviteKey });
  } catch (error) {
    console.error('Failed to generate invite:', error);
    return NextResponse.json(
      { message: 'Failed to generate invite' }, 
      { status: 500 }
    );
  }
}