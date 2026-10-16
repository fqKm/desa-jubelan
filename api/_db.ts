// api/_db.ts
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { pgTable, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core';

// ── Schema Definitions ─────────────────────────────────────────

export const dusun = pgTable('dusun', {
  id: text('id').primaryKey(),
  nama: text('nama').notNull(),
  kepala_dusun: text('kepala_dusun').default(''),
  rt: text('rt').default('0'),
  rw: text('rw').default('0'),
  jumlah_kk: integer('jumlah_kk').default(0),
  jumlah_jiwa: integer('jumlah_jiwa').default(0),
  link_maps: text('link_maps').default(''),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

export const umkm = pgTable('umkm', {
  id: text('id').primaryKey(),
  dusun_id: text('dusun_id').references(() => dusun.id, { onDelete: 'set null' }),
  nama_usaha: text('nama_usaha').notNull(),
  pemilik: text('pemilik').default(''),
  kategori: text('kategori').default('Umum'),
  deskripsi: text('deskripsi').default(''),
  phone: text('phone').default(''),
  email: text('email').default(''),
  link_maps: text('link_maps').default(''),
  foto: text('foto').default(''),
  status: text('status').default('active'),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

export const berita = pgTable('berita', {
  id: text('id').primaryKey(),
  judul: text('judul').notNull(),
  kategori: text('kategori').default('Umum'),
  penulis: text('penulis').default('Admin Desa'),
  ringkasan: text('ringkasan').default(''),
  konten: text('konten').default(''),
  thumbnail: text('thumbnail').default(''),
  status: text('status').default('published'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

export const dokumen = pgTable('dokumen', {
  id: text('id').primaryKey(),
  nama: text('nama').notNull(),
  kategori: text('kategori').default('Umum'),
  ukuran: text('ukuran').default('1.5 MB'),
  deskripsi: text('deskripsi').default(''),
  file_url: text('file_url').notNull(),
  status: text('status').default('public'),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

export const pengumuman = pgTable('pengumuman', {
  id: text('id').primaryKey(),
  judul: text('judul').notNull(),
  konten: text('konten').notNull(),
  is_penting: boolean('is_penting').default(false),
  status: text('status').default('active'),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

export const config = pgTable('config', {
  key: text('key').primaryKey(),
  value: text('value').notNull()
});

const schema = { dusun, umkm, berita, dokumen, pengumuman, config };

// ── Database Connection ────────────────────────────────────────

const rawConn =
  process.env.POSTGRES_URL ||
  process.env.JUBELAN_POSTGRES_URL ||
  process.env.DATABASE_URL ||
  process.env.JUBELAN_DATABASE_URL_UNPOOLED ||
  process.env.JUBELAN_POSTGRES_URL_NON_POOLING ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.JUBELAN_POSTGRES_PRISMA_URL ||
  '';

const connectionString = rawConn.trim().replace(/^["']|["']$/g, '');

if (!connectionString) {
  console.warn('[DB WARNING] Database connection string tidak ditemukan di Environment Variables!');
}

const sql = neon(connectionString);
export const db = drizzle(sql, { schema });

