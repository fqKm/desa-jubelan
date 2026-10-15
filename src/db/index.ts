// src/db/index.ts
// Catatan: Seluruh konfigurasi backend dan schema telah dipusatkan di api/_db.ts
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

const connectionString =
  process.env.POSTGRES_URL ||
  process.env.JUBELAN_POSTGRES_URL ||
  process.env.DATABASE_URL ||
  process.env.JUBELAN_DATABASE_URL_UNPOOLED ||
  '';

const sql = neon(connectionString);
export const db = drizzle(sql);
