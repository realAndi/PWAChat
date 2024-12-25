import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const profileId = request.headers.get('X-Profile-Id');
        
        if (!profileId) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Check if user is admin by checking admins table
        const { rows: adminCheck } = await db.query(
            'SELECT profile_id FROM admins WHERE profile_id = $1',
            [profileId]
        );

        if (!adminCheck.length) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Delete all messages
        await db.query('TRUNCATE TABLE messages');

        return NextResponse.json({ 
            message: 'All chat messages have been deleted' 
        });
    } catch (error) {
        console.error('Failed to clear chat:', error);
        return NextResponse.json(
            { message: 'Failed to clear chat' },
            { status: 500 }
        );
    }
}