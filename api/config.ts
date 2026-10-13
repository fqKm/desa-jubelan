import { db } from '../src/db';
import { config } from '../src/db/schema';

/**
 * Vercel Serverless Function (Node.js)
 * Route: GET /api/config   → Ambil semua config sebagai key-value object
 *        PUT /api/config   → Update/upsert config keys
 */

export default async function handler(req: Request) {
  // GET — return { kepala_desa: '...', mode: '...' }
  if (req.method === 'GET') {
    try {
      const rows = await db.select().from(config);
      const result: Record<string, string> = {};
      for (const row of rows) {
        result[row.key] = row.value;
      }
      return Response.json(
        { status: 'success', data: result },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=900'
          }
        }
      );
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
        await db.insert(config)
          .values({ key, value })
          .onConflictDoUpdate({
            target: config.key,
            set: { value }
          });
      }
      return Response.json({ status: 'success' });
    } catch (err) {
      console.error(err);
      return Response.json({ error: 'DB error' }, { status: 500 });
    }
  }

  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}
