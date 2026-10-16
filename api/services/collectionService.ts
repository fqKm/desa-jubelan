// api/services/collectionService.ts
import { collectionRepository, CollectionName, TABLES } from '../repositories/collectionRepository.js';

export class CollectionService {
  isValidCollection(name: string): name is CollectionName {
    return Object.prototype.hasOwnProperty.call(TABLES, name);
  }

  async getAll(collection: CollectionName) {
    return await collectionRepository.findAll(collection);
  }

  async getById(collection: CollectionName, id: string) {
    return await collectionRepository.findById(collection, id);
  }

  sanitizePayload(collection: CollectionName, body: Record<string, any>) {
    const id = body.id || `${collection}-${Date.now()}`;
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    switch (collection) {
      case 'dusun':
        if (!body.nama?.trim()) throw new Error('Nama dusun wajib diisi');
        return {
          id,
          nama: String(body.nama).trim(),
          kepala_dusun: String(body.kepala_dusun ?? '').trim(),
          rt: String(body.rt ?? '0'),
          rw: String(body.rw ?? '0'),
          jumlah_kk: Math.max(0, Number(body.jumlah_kk) || 0),
          jumlah_jiwa: Math.max(0, Number(body.jumlah_jiwa) || 0),
          link_maps: String(body.link_maps ?? ''),
          updated_at: now
        };

      case 'umkm':
        if (!body.nama_usaha?.trim()) throw new Error('Nama usaha UMKM wajib diisi');
        return {
          id,
          dusun_id: body.dusun_id || null,
          nama_usaha: String(body.nama_usaha).trim(),
          pemilik: String(body.pemilik ?? '').trim(),
          kategori: String(body.kategori ?? 'Umum').trim(),
          deskripsi: String(body.deskripsi ?? '').trim(),
          phone: String(body.phone ?? '').trim(),
          email: String(body.email ?? '').trim(),
          link_maps: String(body.link_maps ?? '').trim(),
          foto: String(body.foto ?? '').trim(),
          status: String(body.status ?? 'active'),
          updated_at: now
        };

      case 'berita':
        if (!body.judul?.trim()) throw new Error('Judul berita wajib diisi');
        return {
          id,
          judul: String(body.judul).trim(),
          kategori: String(body.kategori ?? 'Umum').trim(),
          penulis: String(body.penulis ?? 'Admin Desa').trim(),
          tanggal: body.tanggal || today,
          ringkasan: String(body.ringkasan ?? '').trim(),
          konten: String(body.konten ?? '').trim(),
          thumbnail: String(body.thumbnail ?? '').trim(),
          status: String(body.status ?? 'published'),
          created_at: body.created_at ? new Date(body.created_at) : now,
          updated_at: now
        };

      case 'dokumen':
        if (!body.nama?.trim()) throw new Error('Nama dokumen wajib diisi');
        return {
          id,
          nama: String(body.nama).trim(),
          kategori: String(body.kategori ?? 'Umum').trim(),
          ukuran: String(body.ukuran ?? '1.5 MB').trim(),
          tanggal: body.tanggal || today,
          deskripsi: String(body.deskripsi ?? '').trim(),
          file_url: String(body.file_url ?? '').trim(),
          status: String(body.status ?? 'public')
        };

      case 'pengumuman':
        if (!body.judul?.trim()) throw new Error('Judul pengumuman wajib diisi');
        return {
          id,
          judul: String(body.judul).trim(),
          konten: String(body.konten ?? '').trim(),
          tanggal: body.tanggal || today,
          is_penting: Boolean(body.is_penting),
          status: String(body.status ?? 'active')
        };

      default:
        throw new Error(`Koleksi ${collection} tidak didukung`);
    }
  }

  async save(collection: CollectionName, rawBody: Record<string, any>) {
    const sanitized = this.sanitizePayload(collection, rawBody);
    await collectionRepository.upsert(collection, sanitized);
    return sanitized.id;
  }

  async remove(collection: CollectionName, id: string) {
    if (!id) throw new Error('ID wajib diisi untuk menghapus data');
    return await collectionRepository.delete(collection, id);
  }
}

export const collectionService = new CollectionService();
