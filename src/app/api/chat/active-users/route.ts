import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const { rows } = await db.query(`
      SELECT COUNT(*) as count 
      FROM profiles 
      WHERE invite_key IS NULL 
      AND status = 'registered'
    `);

    return NextResponse.json({ count: parseInt(rows[0].count) });
  } catch (error) {
    console.error('Failed to fetch active users count:', error);
    return NextResponse.json({ error: 'Failed to fetch active users count' }, { status: 500 });
  }
}