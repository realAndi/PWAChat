import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { headers } from 'next/headers';

export async function POST(request: Request) {
  try {
    const profileId = headers().get('X-Profile-Id');
    
    if (!profileId) {
      return NextResponse.json({ message: 'No profile ID provided' }, { status: 401 });
    }

    // Check if requester is admin
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

    // Find the profile to be removed
    const { rows: profiles } = await db.query(
      'SELECT * FROM profiles WHERE username = $1',
      [username]
    );

    if (!profiles.length) {
      return NextResponse.json({ message: 'Profile not found' }, { status: 404 });
    }

    // Check if target user is admin
    const { rows: targetAdminCheck } = await db.query(
      'SELECT * FROM admins WHERE profile_id = $1',
      [profiles[0].id]
    );

    if (targetAdminCheck.length) {
      return NextResponse.json({ message: 'Cannot remove admin users' }, { status: 403 });
    }

    // Delete the profile and associated data
    await db.query('BEGIN');
    try {

      // Delete associated messages
      await db.query(
        'DELETE FROM messages WHERE user_id = $1',
        [profiles[0].id]
      );

      // Delete the profile
      await db.query(
        'DELETE FROM profiles WHERE id = $1',
        [profiles[0].id]
      );

      await db.query('COMMIT');
      
      return NextResponse.json({ 
        message: `Successfully removed user ${username} and all associated data` 
      });
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Failed to remove user:', error);
    return NextResponse.json(
      { message: 'Failed to remove user' }, 
      { status: 500 }
    );
  }
}