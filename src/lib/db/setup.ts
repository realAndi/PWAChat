import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

async function setupDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false
  });

  try {
    // Drop existing tables if they exist
    await pool.query('DROP TABLE IF EXISTS messages, admins CASCADE');
    await pool.query('DROP TABLE IF EXISTS profiles CASCADE');

    // Create profiles table
    await pool.query(`
      CREATE TABLE profiles (
        id VARCHAR(256) PRIMARY KEY,
        username VARCHAR(256) NOT NULL,
        invite_key VARCHAR(256) UNIQUE,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_seen TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create messages table with read_by array
    await pool.query(`
      CREATE TABLE messages (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(256) REFERENCES profiles(id),
        username VARCHAR(256) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        read_by VARCHAR(256)[] DEFAULT ARRAY[]::VARCHAR(256)[]
      );
    `);

    // Create admins table
    await pool.query(`
      CREATE TABLE admins (
        profile_id VARCHAR(256) PRIMARY KEY REFERENCES profiles(id),
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Database tables created successfully');
  } catch (error) {
    console.error('Error setting up database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

setupDatabase().catch(console.error); 