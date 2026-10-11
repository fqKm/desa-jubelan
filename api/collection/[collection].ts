import { neon } from '@neondatabase/serverless';

/**
 * Vercel Serverless Function
 * Route: GET /api/collection/[collection]
 *        POST /api/collection/[collection]
 */
export const config = { runtime: 'edge' };

const ALLOWED = ['dusun', 'umkm', 'berita', 'dokumen', 'pengumuman'];

function getDb() {
  return neon(process.env.POSTGRES_URL!);
}

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const parts = url.pathname.split('/');
  const collection = parts[parts.length - 1];

  if (!ALLOWED.includes(collection)) {
    return Response.json({ error: 'Invalid collection' }, { status: 400 });
  }

  const sql = getDb();

  // GET — ambil semua data
  if (req.method === 'GET') {
    try {
      const rows = await sql(`SELECT * FROM ${collection} ORDER BY updated_at DESC NULLS LAST`);
      return Response.json({ status: 'success', data: rows });
    } catch (err) {
      console.error(err);
      return Response.json({ error: 'DB error' }, { status: 500 });
    }
  }

  // POST — tambah data baru
  if (req.method === 'POST') {
    try {
      const body = await req.json();
      const id = body.id || `${collection}-${Date.now()}`;
      const now = new Date().toISOString();

      if (collection === 'dusun') {
        await sql`
          INSERT INTO dusun (id, nama, kepala_dusun, rt, rw, jumlah_kk, jumlah_jiwa, link_maps, updated_at)
          VALUES (${id}, ${body.nama}, ${body.kepala_dusun ?? ''}, ${body.rt ?? '0'}, ${body.rw ?? '0'},
                  ${body.jumlah_kk ?? 0}, ${body.jumlah_jiwa ?? 0}, ${body.link_maps ?? ''}, ${now})
          ON CONFLICT (id) DO UPDATE SET
            nama=${body.nama}, kepala_dusun=${body.kepala_dusun ?? ''},
            rt=${body.rt ?? '0'}, rw=${body.rw ?? '0'},
            jumlah_kk=${body.jumlah_kk ?? 0}, jumlah_jiwa=${body.jumlah_jiwa ?? 0},
            link_maps=${body.link_maps ?? ''}, updated_at=${now}
        `;
      } else if (collection === 'umkm') {
        await sql`
          INSERT INTO umkm (id, dusun_id, nama_usaha, pemilik, kategori, deskripsi, phone, email, link_maps, foto, status, updated_at)
          VALUES (${id}, ${body.dusun_id ?? null}, ${body.nama_usaha}, ${body.pemilik ?? ''},
                  ${body.kategori ?? 'Umum'}, ${body.deskripsi ?? ''}, ${body.phone ?? ''},
                  ${body.email ?? ''}, ${body.link_maps ?? ''}, ${body.foto ?? ''},
                  ${body.status ?? 'active'}, ${now})
          ON CONFLICT (id) DO UPDATE SET
            dusun_id=${body.dusun_id ?? null}, nama_usaha=${body.nama_usaha},
            pemilik=${body.pemilik ?? ''}, kategori=${body.kategori ?? 'Umum'},
            deskripsi=${body.deskripsi ?? ''}, phone=${body.phone ?? ''},
            email=${body.email ?? ''}, link_maps=${body.link_maps ?? ''},
            foto=${body.foto ?? ''}, status=${body.status ?? 'active'}, updated_at=${now}
        `;
      } else if (collection === 'berita') {
        await sql`
          INSERT INTO berita (id, judul, kategori, penulis, tanggal, ringkasan, konten, thumbnail, status, updated_at)
          VALUES (${id}, ${body.judul}, ${body.kategori ?? 'Umum'}, ${body.penulis ?? 'Admin Desa'},
                  ${body.tanggal ?? now.split('T')[0]}, ${body.ringkasan ?? ''}, ${body.konten ?? ''},
                  ${body.thumbnail ?? ''}, ${body.status ?? 'draft'}, ${now})
          ON CONFLICT (id) DO UPDATE SET
            judul=${body.judul}, kategori=${body.kategori ?? 'Umum'},
            penulis=${body.penulis ?? 'Admin Desa'}, tanggal=${body.tanggal ?? now.split('T')[0]},
            ringkasan=${body.ringkasan ?? ''}, konten=${body.konten ?? ''},
            thumbnail=${body.thumbnail ?? ''}, status=${body.status ?? 'draft'}, updated_at=${now}
        `;
      } else if (collection === 'dokumen') {
        await sql`
          INSERT INTO dokumen (id, nama, kategori, ukuran, tanggal, deskripsi, file_url, status)
          VALUES (${id}, ${body.nama}, ${body.kategori ?? 'Umum'}, ${body.ukuran ?? '1 MB'},
                  ${body.tanggal ?? now.split('T')[0]}, ${body.deskripsi ?? ''},
                  ${body.file_url ?? ''}, ${body.status ?? 'public'})
          ON CONFLICT (id) DO UPDATE SET
            nama=${body.nama}, kategori=${body.kategori ?? 'Umum'},
            ukuran=${body.ukuran ?? '1 MB'}, deskripsi=${body.deskripsi ?? ''},
            file_url=${body.file_url ?? ''}, status=${body.status ?? 'public'}
        `;
      } else if (collection === 'pengumuman') {
        await sql`
          INSERT INTO pengumuman (id, judul, konten, tanggal, is_penting, status)
          VALUES (${id}, ${body.judul}, ${body.konten ?? ''},
                  ${body.tanggal ?? now.split('T')[0]}, ${body.is_penting ?? false},
                  ${body.status ?? 'active'})
          ON CONFLICT (id) DO UPDATE SET
            judul=${body.judul}, konten=${body.konten ?? ''},
            is_penting=${body.is_penting ?? false}, status=${body.status ?? 'active'}
        `;
      }

      return Response.json({ status: 'success', id });
    } catch (err) {
      console.error(err);
      return Response.json({ error: 'DB error' }, { status: 500 });
    }
  }

  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}
