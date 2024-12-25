import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    PUSHER_APP_ID: process.env.PUSHER_APP_ID?.slice(0, 4) + '...',
    PUSHER_SECRET: process.env.PUSHER_SECRET?.slice(0, 4) + '...',
    NEXT_PUBLIC_PUSHER_KEY: process.env.NEXT_PUBLIC_PUSHER_KEY?.slice(0, 4) + '...',
    NEXT_PUBLIC_PUSHER_CLUSTER: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
  });
}