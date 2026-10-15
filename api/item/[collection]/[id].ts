import { db, dusun, umkm, berita, dokumen, pengumuman } from '../../_db.js';
import { eq } from 'drizzle-orm';

/**
 * Vercel Serverless Function (Node.js)
 * Route: DELETE /api/item/[collection]/[id]
 */

const ALLOWED = ['dusun', 'umkm', 'berita', 'dokumen', 'pengumuman'] as const;
type AllowedCollection = typeof ALLOWED[number];

export default async function handler(req: any) {
  try {
    if (req.method !== 'DELETE') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const url = new URL(req.url || '', 'http://localhost');
    const parts = url.pathname.split('/').filter(Boolean);
    // /api/item/[collection]/[id]  → parts = ['api','item','collection','id']
    const collection = (url.searchParams.get('collection') || parts[2]) as AllowedCollection;
    const id = url.searchParams.get('id') || parts[3];

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
    } catch (err: any) {
      console.error('[DELETE DB error]', err);
      return Response.json({ error: err?.message || 'DB error' }, { status: 500 });
    }
  } catch (fatalErr: any) {
    console.error('[Item Fatal Error]', fatalErr);
    return Response.json({ error: fatalErr?.message || 'Server error' }, { status: 500 });
  }
}
