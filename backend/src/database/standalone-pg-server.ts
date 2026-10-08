import { PGlite } from '@electric-sql/pglite';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { createServer } = require('pglite-server');
import * as path from 'path';
import * as fs from 'fs';
import * as net from 'net';

const dataDir = path.resolve(__dirname, '../../.pgdata');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export async function startDatabaseServer(port = 5432): Promise<net.Server | null> {
  const isAvailable = await new Promise<boolean>((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(800);
    socket.on('connect', () => {
      socket.destroy();
      resolve(false); // Port is in use
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(true); // Port is free
    });
    socket.on('error', () => {
      resolve(true); // Port is free
    });
    socket.connect(port, '127.0.0.1');
  });

  if (!isAvailable) {
    console.log(`[Database] Port ${port} is already active. Using existing database service.`);
    return null;
  }

  const db = new PGlite(dataDir);
  await db.waitReady;

  try {
    await db.query(`
      CREATE OR REPLACE FUNCTION uuid_generate_v4() RETURNS uuid AS $$
        SELECT gen_random_uuid();
      $$ LANGUAGE sql;
    `);
  } catch (err) {
    console.warn('Could not create uuid_generate_v4 function:', err);
  }

  const server = createServer(db, { logLevel: 0 });

  await new Promise<void>((resolve, reject) => {
    server.listen(port, '0.0.0.0', () => {
      console.log(`✓ Embedded PostgreSQL server listening on 0.0.0.0:${port}`);
      console.log(`✓ Data directory: ${dataDir}`);
      resolve();
    });
    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`[Database] Port ${port} is already in use by PostgreSQL.`);
        resolve();
      } else {
        reject(err);
      }
    });
  });

  return server;
}

if (require.main === module) {
  const port = parseInt(process.env.PG_PORT || '5432', 10);
  startDatabaseServer(port).catch((err) => {
    console.error('Failed to launch PostgreSQL server:', err);
    process.exit(1);
  });
}

