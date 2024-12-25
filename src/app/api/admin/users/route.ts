export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { headers } from 'next/headers';

export async function GET(request: Request) {
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

    // Get all users with their admin status and registration status
    const { rows: users } = await db.query(`
      SELECT 
        p.id,
        p.username,
        p.invite_key,
        p.created_at,
        p.status,
        CASE WHEN a.profile_id IS NOT NULL THEN true ELSE false END as is_admin
      FROM profiles p
      LEFT JOIN admins a ON p.id = a.profile_id
      ORDER BY p.created_at DESC
    `);

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json(
      { message: 'Failed to fetch users' }, 
      { status: 500 }
    );
  }
}