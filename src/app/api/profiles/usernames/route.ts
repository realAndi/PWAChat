import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { userIds } = await request.json();

    const { rows } = await db.query(
      `SELECT id, username 
       FROM profiles 
       WHERE id = ANY($1::VARCHAR(256)[])`,
      [userIds]
    );

    // Convert to a map of id -> username
    const usernameMap = rows.reduce((acc: Record<string, string>, row) => {
      acc[row.id] = row.username;
      return acc;
    }, {});

    return NextResponse.json(usernameMap);
  } catch (error) {
    console.error('Failed to fetch usernames:', error);
    return NextResponse.json({ error: 'Failed to fetch usernames' }, { status: 500 });
  }
}