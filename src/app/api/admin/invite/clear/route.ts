export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { headers } from 'next/headers';

export async function POST(request: Request) {
  try {
    const profileId = headers().get('X-Profile-Id');
    
    if (!profileId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { rows: adminCheck } = await db.query(
      'SELECT * FROM admins WHERE profile_id = $1',
      [profileId]
    );

    if (!adminCheck.length) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Clear invite keys for pending profiles only
    const { rowCount } = await db.query(`
      UPDATE profiles 
      SET invite_key = NULL 
      WHERE status = 'pending' 
      AND invite_key IS NOT NULL
    `);

    return NextResponse.json({ 
      message: `Cleared ${rowCount} unused invites`,
      count: rowCount 
    });
  } catch (error) {
    console.error('Failed to clear invites:', error);
    return NextResponse.json(
      { message: 'Failed to clear unused invites' }, 
      { status: 500 }
    );
  }
}