import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
});

export const db = {
  query: async (text: string, params?: any[]) => {
    try {
      const result = await pool.query(text, params);
      return result;
    } catch (error) {
      console.error('Query error:', error);
      throw error;
    }
  },
  pool
}; 