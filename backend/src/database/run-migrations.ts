import { AppDataSource } from './data-source';

async function runMigrations() {
  console.log('Initializing PostgreSQL DataSource...');
  try {
    await AppDataSource.initialize();
    console.log('PostgreSQL DataSource initialized successfully.');
    console.log('Running pending migrations...');
    const migrations = await AppDataSource.runMigrations();
    console.log(`Executed ${migrations.length} migration(s) successfully.`);
    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
