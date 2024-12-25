import { db } from '@/lib/db';

async function addAdmin(profileId: string) {
  try {
    // First verify the profile exists
    const { rows: profiles } = await db.query(
      'SELECT * FROM profiles WHERE id = $1',
      [profileId]
    );

    if (!profiles.length) {
      console.error('Profile not found');
      process.exit(1);
    }

    // Add to admins table
    await db.query(
      'INSERT INTO admins (profile_id) VALUES ($1) ON CONFLICT (profile_id) DO NOTHING',
      [profileId]
    );
    
    console.log('Successfully added admin:');
    console.log('----------------------------');
    console.log(`Profile ID: ${profileId}`);
    console.log(`Username: ${profiles[0].username}`);
    console.log('----------------------------');
  } catch (error) {
    console.error('Failed to add admin:', error);
  } finally {
    process.exit(0);
  }
}

const profileId = process.argv[2];
if (!profileId) {
  console.error('Please provide a profile ID: npm run add-admin <profile-id>');
  process.exit(1);
}

addAdmin(profileId);