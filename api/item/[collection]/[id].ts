import { db, dusun, umkm, berita, dokumen, pengumuman } from '../../_db.js';
import { eq } from 'drizzle-orm';

/**
 * Vercel Serverless Function (Node.js & Edge compatible)
 * Route: DELETE /api/item/[collection]/[id]
 */

const ALLOWED = ['dusun', 'umkm', 'berita', 'dokumen', 'pengumuman'] as const;
type AllowedCollection = typeof ALLOWED[number];

function sendResponse(res: any, status: number, data: any) {
  if (res && typeof res.status === 'function') {
    return res.status(status).json(data);
  }
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

export default async function handler(req: any, res?: any) {
  const method = req.method || 'DELETE';
  console.log(`[ITEM START] Method: ${method}, URL: ${req.url}`);

  try {
    if (method !== 'DELETE') {
      return sendResponse(res, 405, { error: 'Method not allowed' });
    }

    let collection = req.query?.collection as AllowedCollection | undefined;
    let id = req.query?.id as string | undefined;

    if ((!collection || !id) && req.url) {
      try {
        const url = new URL(req.url, 'http://localhost');
        const parts = url.pathname.split('/').filter(Boolean);
        collection = (url.searchParams.get('collection') || parts[2]) as AllowedCollection;
        id = url.searchParams.get('id') || parts[3];
      } catch {}
    }

    console.log(`[ITEM DELETE TARGET] Collection: ${collection}, ID: ${id}`);

    if (!collection || !id || !ALLOWED.includes(collection)) {
      return sendResponse(res, 400, { error: `Invalid params: collection=${collection}, id=${id}` });
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

      console.log(`[ITEM DELETE SUCCESS] ${collection} ID: ${id}`);
      return sendResponse(res, 200, { status: 'success' });
    } catch (err: any) {
      console.error('[ITEM DELETE ERROR]', err);
      return sendResponse(res, 500, {
        error: err?.message || 'DB error',
        details: String(err)
      });
    }
  } catch (fatalErr: any) {
    console.error('[ITEM FATAL ERROR]', fatalErr);
    return sendResponse(res, 500, {
      error: fatalErr?.message || 'Server error',
      details: String(fatalErr)
    });
  }
}
