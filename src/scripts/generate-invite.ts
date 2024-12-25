import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { randomBytes } from 'crypto';

async function generateInviteKey(username: string) {
  const inviteKey = randomBytes(16).toString('hex');
  const profileId = uuidv4();

  try {
    await db.query(
      'INSERT INTO profiles (id, username, invite_key) VALUES ($1, $2, $3)',
      [profileId, username, inviteKey]
    );

    // Verify the invite key was stored
    const { rows } = await db.query(
      'SELECT * FROM profiles WHERE invite_key = $1',
      [inviteKey]
    );
    
    console.log('Successfully generated invite key:');
    console.log('----------------------------');
    console.log(`Username: ${username}`);
    console.log(`Invite Key: ${inviteKey}`);
    console.log('Profile in database:', rows[0]);
    console.log('----------------------------');
  } catch (error) {
    console.error('Failed to generate invite key:', error);
  }
}
const username = process.argv[2];
if (!username) {
  console.error('Please provide a username: npm run generate-invite <username>');
  process.exit(1);
}

generateInviteKey(username);