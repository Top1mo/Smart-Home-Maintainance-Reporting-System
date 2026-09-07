import { getDb } from './index';
import { seedDatabase } from './seed-data';

export { seedDatabase };

// Standalone execution runner
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('seed')) {
  const force = process.argv.includes('--force');
  const db = getDb();
  seedDatabase(db, force);
  console.log('Database successfully seeded!');
}
