import { db } from '@/lib/db';

async function clearTickets() {
  try {
    await db.query('BEGIN');

    // First, delete all ticket views
    const viewsResult = await db.query(`
      DELETE FROM ticket_views
    `);

    // Then, delete all ticket uses
    const usesResult = await db.query(`
      DELETE FROM ticket_uses
    `);

    // Finally, delete all tickets
    const ticketsResult = await db.query(`
      DELETE FROM tickets
    `);

    await db.query('COMMIT');
    
    console.log('Successfully cleared tickets and related data');
    console.log('----------------------------');
    console.log(`Cleared ${viewsResult.rowCount} ticket views`);
    console.log(`Cleared ${usesResult.rowCount} ticket uses`);
    console.log(`Cleared ${ticketsResult.rowCount} tickets`);
    console.log('----------------------------');
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Failed to clear tickets:', error);
  } finally {
    process.exit(0);
  }
}

clearTickets();