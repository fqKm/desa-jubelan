import { db, dusun, umkm, berita, dokumen, pengumuman } from '../_db.js';
import { desc } from 'drizzle-orm';

/**
 * Vercel Serverless Function (Node.js & Edge compatible)
 * Route: GET  /api/collection/[collection]
 *        POST /api/collection/[collection]
 */

const ALLOWED = ['dusun', 'umkm', 'berita', 'dokumen', 'pengumuman'] as const;
type AllowedCollection = typeof ALLOWED[number];

function sendResponse(res: any, status: number, data: any, headers: Record<string, string> = {}) {
  // Jika Vercel Node.js Serverless runtime (res object tersedia)
  if (res && typeof res.status === 'function') {
    Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v));
    return res.status(status).json(data);
  }
  // Fallback jika Web API standard / Edge
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers }
  });
}

export default async function handler(req: any, res?: any) {
  const method = req.method || 'GET';
  console.log(`[API START] Method: ${method}, URL: ${req.url}`);

  try {
    // Ambil parameter collection dari req.query (Node.js Vercel) atau URL pathname
    let collectionName = req.query?.collection as string | undefined;
    if (!collectionName && req.url) {
      try {
        const url = new URL(req.url, 'http://localhost');
        collectionName = url.searchParams.get('collection') || url.pathname.split('/').filter(Boolean).pop();
      } catch {
        collectionName = req.url.split('?')[0].split('/').filter(Boolean).pop();
      }
    }

    const collection = collectionName as AllowedCollection;
    console.log(`[API COLLECTION] Target: ${collection}`);

    if (!ALLOWED.includes(collection)) {
      console.warn(`[API REJECTED] Koleksi tidak valid: ${collection}`);
      return sendResponse(res, 400, {
        error: `Invalid collection: ${collection}. Allowed: ${ALLOWED.join(', ')}`
      });
    }

    // GET — ambil semua data urut descending
    if (method === 'GET') {
      try {
        let rows: any[] = [];
        if (collection === 'dusun') {
          rows = await db.select().from(dusun).orderBy(desc(dusun.updated_at));
        } else if (collection === 'umkm') {
          rows = await db.select().from(umkm).orderBy(desc(umkm.updated_at));
        } else if (collection === 'berita') {
          rows = await db.select().from(berita).orderBy(desc(berita.updated_at));
        } else if (collection === 'dokumen') {
          rows = await db.select().from(dokumen).orderBy(desc(dokumen.updated_at));
        } else if (collection === 'pengumuman') {
          rows = await db.select().from(pengumuman).orderBy(desc(pengumuman.updated_at));
        }

        console.log(`[API GET SUCCESS] Collection: ${collection}, Total: ${rows.length} records`);
        return sendResponse(
          res,
          200,
          { status: 'success', data: rows },
          { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600' }
        );
      } catch (err: any) {
        console.error(`[API GET ERROR] Collection ${collection}:`, err);
        return sendResponse(res, 500, {
          error: err?.message || 'Database query error',
          details: String(err)
        });
      }
    }

    // POST — tambah / update (upsert) data
    if (method === 'POST') {
      try {
        // Ambil body data
        let body: any = req.body;
        if (typeof body === 'string') {
          try {
            body = JSON.parse(body);
          } catch {
            body = {};
          }
        } else if (!body && typeof req.json === 'function') {
          body = await req.json();
        }
        body = body || {};

        console.log(`[API POST PAYLOAD] Collection: ${collection}`, JSON.stringify(body));

        const id = body.id || `${collection}-${Date.now()}`;
        const now = new Date();

        if (collection === 'dusun') {
          await db.insert(dusun)
            .values({
              id,
              nama: body.nama,
              kepala_dusun: body.kepala_dusun ?? '',
              rt: body.rt ?? '0',
              rw: body.rw ?? '0',
              jumlah_kk: Number(body.jumlah_kk) || 0,
              jumlah_jiwa: Number(body.jumlah_jiwa) || 0,
              link_maps: body.link_maps ?? '',
              updated_at: now
            })
            .onConflictDoUpdate({
              target: dusun.id,
              set: {
                nama: body.nama,
                kepala_dusun: body.kepala_dusun ?? '',
                rt: body.rt ?? '0',
                rw: body.rw ?? '0',
                jumlah_kk: Number(body.jumlah_kk) || 0,
                jumlah_jiwa: Number(body.jumlah_jiwa) || 0,
                link_maps: body.link_maps ?? '',
                updated_at: now
              }
            });
        } else if (collection === 'umkm') {
          await db.insert(umkm)
            .values({
              id,
              dusun_id: body.dusun_id ?? null,
              nama_usaha: body.nama_usaha,
              pemilik: body.pemilik ?? '',
              kategori: body.kategori ?? 'Umum',
              deskripsi: body.deskripsi ?? '',
              phone: body.phone ?? '',
              email: body.email ?? '',
              link_maps: body.link_maps ?? '',
              foto: body.foto ?? '',
              status: body.status ?? 'active',
              updated_at: now
            })
            .onConflictDoUpdate({
              target: umkm.id,
              set: {
                dusun_id: body.dusun_id ?? null,
                nama_usaha: body.nama_usaha,
                pemilik: body.pemilik ?? '',
                kategori: body.kategori ?? 'Umum',
                deskripsi: body.deskripsi ?? '',
                phone: body.phone ?? '',
                email: body.email ?? '',
                link_maps: body.link_maps ?? '',
                foto: body.foto ?? '',
                status: body.status ?? 'active',
                updated_at: now
              }
            });
        } else if (collection === 'berita') {
          await db.insert(berita)
            .values({
              id,
              judul: body.judul,
              kategori: body.kategori ?? 'Umum',
              penulis: body.penulis ?? 'Admin Desa',
              ringkasan: body.ringkasan ?? '',
              konten: body.konten ?? '',
              thumbnail: body.thumbnail ?? '',
              status: body.status ?? 'published',
              created_at: now,
              updated_at: now
            })
            .onConflictDoUpdate({
              target: berita.id,
              set: {
                judul: body.judul,
                kategori: body.kategori ?? 'Umum',
                penulis: body.penulis ?? 'Admin Desa',
                ringkasan: body.ringkasan ?? '',
                konten: body.konten ?? '',
                thumbnail: body.thumbnail ?? '',
                status: body.status ?? 'published',
                updated_at: now
              }
            });
        } else if (collection === 'dokumen') {
          await db.insert(dokumen)
            .values({
              id,
              nama: body.nama,
              kategori: body.kategori ?? 'Umum',
              ukuran: body.ukuran ?? '1.5 MB',
              deskripsi: body.deskripsi ?? '',
              file_url: body.file_url ?? '',
              status: body.status ?? 'public',
              updated_at: now
            })
            .onConflictDoUpdate({
              target: dokumen.id,
              set: {
                nama: body.nama,
                kategori: body.kategori ?? 'Umum',
                ukuran: body.ukuran ?? '1.5 MB',
                deskripsi: body.deskripsi ?? '',
                file_url: body.file_url ?? '',
                status: body.status ?? 'public',
                updated_at: now
              }
            });
        } else if (collection === 'pengumuman') {
          await db.insert(pengumuman)
            .values({
              id,
              judul: body.judul,
              konten: body.konten ?? '',
              is_penting: Boolean(body.is_penting),
              status: body.status ?? 'active',
              updated_at: now
            })
            .onConflictDoUpdate({
              target: pengumuman.id,
              set: {
                judul: body.judul,
                konten: body.konten ?? '',
                is_penting: Boolean(body.is_penting),
                status: body.status ?? 'active',
                updated_at: now
              }
            });
        }

        console.log(`[API POST SUCCESS] Saved ${collection} with ID: ${id}`);
        return sendResponse(res, 200, { status: 'success', id });
      } catch (err: any) {
        console.error(`[API POST ERROR] Collection ${collection}:`, err);
        return sendResponse(res, 500, {
          error: err?.message || 'Database insert error',
          details: String(err)
        });
      }
    }

    return sendResponse(res, 405, { error: `Method ${method} not allowed` });
  } catch (fatalErr: any) {
    console.error('[API FATAL ERROR]', fatalErr);
    return sendResponse(res, 500, {
      error: fatalErr?.message || 'Internal server error',
      details: String(fatalErr)
    });
  }
}
