import { db } from '@/lib/db';
import * as dotenv from 'dotenv';

dotenv.config();

async function testConnection() {
  try {
    // Test the connection and get database name
    const result = await db.query(`
      SELECT current_database(), 
             current_user, 
             inet_server_addr() as server_ip,
             inet_server_port() as server_port;
    `);
    console.log('Connection info:', result.rows[0]);
    
    // List all tables
    const tables = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    console.log('\nTables in database:');
    console.log(tables.rows);

    // Show contents of each table
    console.log('\nProfiles in database:');
    const profiles = await db.query('SELECT * FROM profiles');
    console.log(profiles.rows);

    console.log('\nMessages in database:');
    const messages = await db.query('SELECT * FROM messages');
    console.log(messages.rows);

    console.log('\nAdmins in database:');
    const admins = await db.query('SELECT * FROM admins');
    console.log(admins.rows);

  } catch (error) {
    console.error('Database connection error:', error);
  }
}

testConnection();