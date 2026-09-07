import { getDb } from './index';
import { seedDatabase, seedTaxonomyOnly } from './seed-data';

export { seedDatabase, seedTaxonomyOnly };

// Standalone execution runner
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('seed')) {
  const withDemo = process.argv.includes('--demo');
  const force = process.argv.includes('--force');
  const db = getDb();
  if (withDemo) {
    seedDatabase(db, force);
    console.log('Database seeded with demo data!');
  } else {
    seedTaxonomyOnly(db);
    console.log('Database successfully initialized with clean taxonomy (zero demo data)!');
  }
}
