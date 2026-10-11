import { neon } from '@neondatabase/serverless';

/**
 * Vercel Serverless Function
 * Route: GET /api/config        → ambil semua config sebagai key-value object
 *        PUT /api/config        → update/upsert config keys
 */
export const config_runtime = { runtime: 'edge' };

function getDb() {
  return neon(process.env.POSTGRES_URL!);
}

export default async function handler(req: Request) {
  const sql = getDb();

  // GET — return { kepala_desa: '...', mode: '...' }
  if (req.method === 'GET') {
    try {
      const rows = await sql`SELECT key, value FROM config`;
      const result: Record<string, string> = {};
      for (const row of rows) {
        result[row.key as string] = row.value as string;
      }
      return Response.json({ status: 'success', data: result });
    } catch (err) {
      console.error(err);
      return Response.json({ error: 'DB error' }, { status: 500 });
    }
  }

  // PUT — upsert one or more keys: { kepala_desa: '...', ... }
  if (req.method === 'PUT') {
    try {
      const body: Record<string, string> = await req.json();
      for (const [key, value] of Object.entries(body)) {
        await sql`
          INSERT INTO config (key, value) VALUES (${key}, ${value})
          ON CONFLICT (key) DO UPDATE SET value = ${value}
        `;
      }
      return Response.json({ status: 'success' });
    } catch (err) {
      console.error(err);
      return Response.json({ error: 'DB error' }, { status: 500 });
    }
  }

  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}
