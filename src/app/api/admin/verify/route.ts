import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const profileId = searchParams.get('profileId');

  if (!profileId) {
    return NextResponse.json({ isAdmin: false });
  }

  try {
    const { rows } = await db.query(
      'SELECT * FROM admins WHERE profile_id = $1',
      [profileId]
    );

    return NextResponse.json({ isAdmin: rows.length > 0 });
  } catch (error) {
    console.error('Admin verification error:', error);
    return NextResponse.json({ isAdmin: false });
  }
}