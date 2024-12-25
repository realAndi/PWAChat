import { db } from '@/lib/db';
import { randomBytes } from 'crypto';

async function regenerateInvite(username: string) {
  try {
    // Find the profile by username
    const { rows: profiles } = await db.query(
      'SELECT * FROM profiles WHERE username = $1',
      [username]
    );

    if (!profiles.length) {
      console.error('No profile found with that username');
      process.exit(1);
    }

    const profile = profiles[0];
    
    // Generate new invite key
    const newInviteKey = randomBytes(16).toString('hex');

    // Update the profile with new invite key
    await db.query(
      'UPDATE profiles SET invite_key = $1 WHERE id = $2',
      [newInviteKey, profile.id]
    );
    
    console.log('Successfully regenerated invite:');
    console.log('----------------------------');
    console.log(`Username: ${username}`);
    console.log(`New Invite Key: ${newInviteKey}`);
    console.log('----------------------------');
  } catch (error) {
    console.error('Failed to regenerate invite:', error);
  } finally {
    process.exit(0);
  }
}

const username = process.argv[2];
if (!username) {
  console.error('Please provide a username: npm run regenerate-invite <username>');
  process.exit(1);
}

regenerateInvite(username);