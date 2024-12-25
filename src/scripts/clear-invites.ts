import { db } from '@/lib/db';

async function clearInviteKeys() {
  try {
    // Only clear invite keys for pending profiles
    const result = await db.query(`
      UPDATE profiles 
      SET invite_key = NULL 
      WHERE status = 'pending' 
      AND invite_key IS NOT NULL
    `);
    
    console.log('Successfully cleared unused invites');
    console.log('----------------------------');
    console.log(`Cleared ${result.rowCount} unused invites`);
    console.log('----------------------------');
  } catch (error) {
    console.error('Failed to clear invite keys:', error);
  } finally {
    process.exit(0);
  }
}

clearInviteKeys();