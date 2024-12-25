import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ message: 'Profile ID required' }, { status: 400 });
  }

  try {
    // First check if profile exists
    const { rows: profiles } = await db.query(
      'SELECT * FROM profiles WHERE id = $1',
      [id]
    );

    const profile = profiles[0];
    if (!profile) {
      return NextResponse.json({ message: 'Profile not found' }, { status: 404 });
    }

    // Update last seen
    await db.query(
      'UPDATE profiles SET last_seen = NOW() WHERE id = $1',
      [id]
    );

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error('Profile verification error:', error);
    return NextResponse.json({ message: 'Failed to verify profile' }, { status: 500 });
  }
}