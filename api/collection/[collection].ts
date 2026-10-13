import { db } from '../../src/db';
import { dusun, umkm, berita, dokumen, pengumuman } from '../../src/db/schema';
import { desc, eq } from 'drizzle-orm';

/**
 * Vercel Serverless Function (Node.js)
 * Route: GET  /api/collection/[collection]
 *        POST /api/collection/[collection]
 */

const ALLOWED = ['dusun', 'umkm', 'berita', 'dokumen', 'pengumuman'] as const;
type AllowedCollection = typeof ALLOWED[number];

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const parts = url.pathname.split('/');
  const collection = parts[parts.length - 1] as AllowedCollection;

  if (!ALLOWED.includes(collection)) {
    return Response.json({ error: 'Invalid collection' }, { status: 400 });
  }

  // GET — ambil semua data urut descending
  if (req.method === 'GET') {
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
      return Response.json(
        { status: 'success', data: rows },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600'
          }
        }
      );
    } catch (err) {
      console.error(err);
      return Response.json({ error: 'DB error' }, { status: 500 });
    }
  }

  // POST — tambah / update (upsert) data
  if (req.method === 'POST') {
    try {
      const body = await req.json();
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
            status: body.status ?? 'draft',
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
              status: body.status ?? 'draft',
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

      return Response.json({ status: 'success', id });
    } catch (err) {
      console.error(err);
      return Response.json({ error: 'DB error' }, { status: 500 });
    }
  }

  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}
