import { neon } from '@neondatabase/serverless';

/**
 * Vercel Serverless Function
 * Route: DELETE /api/item/[collection]/[id]
 */
export const config = { runtime: 'edge' };

const ALLOWED = ['dusun', 'umkm', 'berita', 'dokumen', 'pengumuman'];

function getDb() {
  return neon(process.env.POSTGRES_URL!);
}

export default async function handler(req: Request) {
  if (req.method !== 'DELETE') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const url = new URL(req.url);
  const parts = url.pathname.split('/').filter(Boolean);
  // /api/item/[collection]/[id]  → parts = ['api','item','collection','id']
  const collection = parts[2];
  const id = parts[3];

  if (!collection || !id || !ALLOWED.includes(collection)) {
    return Response.json({ error: 'Invalid params' }, { status: 400 });
  }

  const sql = getDb();

  try {
    await sql(`DELETE FROM ${collection} WHERE id = $1`, [id]);
    return Response.json({ status: 'success' });
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'DB error' }, { status: 500 });
  }
}
