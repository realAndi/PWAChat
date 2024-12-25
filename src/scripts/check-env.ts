import * as dotenv from 'dotenv';
import { db } from '@/lib/db';

dotenv.config();

async function checkConnection() {
  console.log('DATABASE_URL:', process.env.DATABASE_URL);
  
  try {
    const result = await db.query('SELECT current_database()');
    console.log('Connected to database:', result.rows[0].current_database);
  } catch (error) {
    console.error('Connection error:', error);
  }
}

checkConnection();