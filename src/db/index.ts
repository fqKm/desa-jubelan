// src/db/index.ts
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema.js';

const connectionString =
  process.env.POSTGRES_URL ||
  process.env.JUBELAN_POSTGRES_URL ||
  process.env.DATABASE_URL ||
  process.env.JUBELAN_DATABASE_URL_UNPOOLED ||
  '';

const sql = neon(connectionString);
export const db = drizzle(sql, { schema });
