// api/repositories/collectionRepository.ts
import { db, dusun, umkm, berita, dokumen, pengumuman } from '../_db.js';
import { desc, eq } from 'drizzle-orm';

export const TABLES = {
  dusun,
  umkm,
  berita,
  dokumen,
  pengumuman
} as const;

export type CollectionName = keyof typeof TABLES;

export class CollectionRepository {
  async findAll(collection: CollectionName) {
    const table = TABLES[collection];
    if (!table) throw new Error(`Tabel tidak ditemukan untuk koleksi: ${collection}`);
    
    // Urutkan descending berdasarkan field waktu yang tersedia
    if ('updated_at' in table) {
      return await db.select().from(table as any).orderBy(desc((table as any).updated_at));
    }
    if ('tanggal' in table) {
      return await db.select().from(table as any).orderBy(desc((table as any).tanggal));
    }
    return await db.select().from(table as any);
  }

  async findById(collection: CollectionName, id: string) {
    const table = TABLES[collection];
    if (!table) throw new Error(`Tabel tidak ditemukan untuk koleksi: ${collection}`);
    const rows = await db.select().from(table as any).where(eq((table as any).id, id));
    return rows[0] || null;
  }

  async upsert(collection: CollectionName, values: Record<string, any>) {
    const table = TABLES[collection];
    if (!table) throw new Error(`Tabel tidak ditemukan untuk koleksi: ${collection}`);

    const id = values.id;
    if (!id) throw new Error('ID harus disediakan untuk upsert');

    // Kolom target update (seluruh kolom kecuali id dan created_at)
    const { id: _, created_at: __, ...updateFields } = values;

    return await db.insert(table as any)
      .values(values)
      .onConflictDoUpdate({
        target: (table as any).id,
        set: updateFields
      });
  }

  async delete(collection: CollectionName, id: string) {
    const table = TABLES[collection];
    if (!table) throw new Error(`Tabel tidak ditemukan untuk koleksi: ${collection}`);
    return await db.delete(table as any).where(eq((table as any).id, id));
  }
}

export const collectionRepository = new CollectionRepository();
