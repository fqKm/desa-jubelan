import { db } from '../../../src/db';
import { dusun, umkm, berita, dokumen, pengumuman } from '../../../src/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Vercel Serverless Function (Node.js)
 * Route: DELETE /api/item/[collection]/[id]
 */

const ALLOWED = ['dusun', 'umkm', 'berita', 'dokumen', 'pengumuman'] as const;
type AllowedCollection = typeof ALLOWED[number];

export default async function handler(req: Request) {
  if (req.method !== 'DELETE') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const url = new URL(req.url);
  const parts = url.pathname.split('/').filter(Boolean);
  // /api/item/[collection]/[id]  → parts = ['api','item','collection','id']
  const collection = parts[2] as AllowedCollection;
  const id = parts[3];

  if (!collection || !id || !ALLOWED.includes(collection)) {
    return Response.json({ error: 'Invalid params' }, { status: 400 });
  }

  try {
    if (collection === 'dusun') {
      await db.delete(dusun).where(eq(dusun.id, id));
    } else if (collection === 'umkm') {
      await db.delete(umkm).where(eq(umkm.id, id));
    } else if (collection === 'berita') {
      await db.delete(berita).where(eq(berita.id, id));
    } else if (collection === 'dokumen') {
      await db.delete(dokumen).where(eq(dokumen.id, id));
    } else if (collection === 'pengumuman') {
      await db.delete(pengumuman).where(eq(pengumuman.id, id));
    }

    return Response.json({ status: 'success' });
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'DB error' }, { status: 500 });
  }
}
