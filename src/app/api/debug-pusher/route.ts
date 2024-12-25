import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasAppId: !!process.env.PUSHER_APP_ID,
    hasKey: !!process.env.PUSHER_KEY,
    hasSecret: !!process.env.PUSHER_SECRET,
    hasPublicKey: !!process.env.NEXT_PUBLIC_PUSHER_KEY,
    hasCluster: !!process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    // Add more detailed debugging
    appIdPrefix: process.env.PUSHER_APP_ID?.slice(0, 4),
    secretPrefix: process.env.PUSHER_SECRET?.slice(0, 4),
    keyPrefix: process.env.PUSHER_KEY?.slice(0, 4),
    publicKeyPrefix: process.env.NEXT_PUBLIC_PUSHER_KEY?.slice(0, 4),
  });
}
