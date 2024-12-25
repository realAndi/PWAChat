export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { headers } from 'next/headers';

export async function GET() {
  try {
    const profileId = headers().get('X-Profile-Id');
    console.log('Checking admin status for:', profileId);

    if (!profileId) {
      return NextResponse.json({ 
        isAdmin: false, 
        reason: 'No profile ID' 
      });
    }

    const { rows } = await db.query(
      'SELECT * FROM admins WHERE profile_id = $1',
      [profileId]
    );


    return NextResponse.json({ 
      isAdmin: rows.length > 0,
      profileId,
      adminRecord: rows[0] || null
    });
  } catch (error) {
    console.error('Admin check error:', error);
    return NextResponse.json({ 
      isAdmin: false, 
      error: 'Check failed' 
    });
  }
}