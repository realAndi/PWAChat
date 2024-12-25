import { db } from '@/lib/db';

async function removeUser(username: string) {
  try {
    // Find the profile
    const { rows: profiles } = await db.query(
      'SELECT * FROM profiles WHERE username = $1',
      [username]
    );

    if (!profiles.length) {
      console.error('No profile found with that username');
      process.exit(1);
    }

    const profile = profiles[0];

    // Check if user is admin
    const { rows: adminCheck } = await db.query(
      'SELECT * FROM admins WHERE profile_id = $1',
      [profile.id]
    );

    if (adminCheck.length) {
      console.error('Cannot remove admin users');
      process.exit(1);
    }

    // Delete the profile and associated data
    await db.query('BEGIN');
    try {

      // Delete associated messages
      await db.query(
        'DELETE FROM messages WHERE user_id = $1',
        [profile.id]
      );

      // Delete the profile
      await db.query(
        'DELETE FROM profiles WHERE id = $1',
        [profile.id]
      );

      await db.query('COMMIT');
      
      console.log('Successfully removed user:');
      console.log('----------------------------');
      console.log(`Username: ${username}`);
      console.log('----------------------------');
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Failed to remove user:', error);
  } finally {
    process.exit(0);
  }
}

const username = process.argv[2];
if (!username) {
  console.error('Please provide a username: npm run remove-user <username>');
  process.exit(1);
}

removeUser(username);