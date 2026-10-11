-- ============================================================
-- Schema Neon DB untuk Website Desa Jubelan
-- Jalankan di: Neon Console → SQL Editor
-- ============================================================

-- 1. Tabel Dusun
CREATE TABLE IF NOT EXISTS dusun (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  nama         TEXT NOT NULL,
  kepala_dusun TEXT NOT NULL DEFAULT '',
  rt           TEXT NOT NULL DEFAULT '0',
  rw           TEXT NOT NULL DEFAULT '0',
  jumlah_kk    INTEGER NOT NULL DEFAULT 0,
  jumlah_jiwa  INTEGER NOT NULL DEFAULT 0,
  link_maps    TEXT DEFAULT '',
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabel UMKM
CREATE TABLE IF NOT EXISTS umkm (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  dusun_id    TEXT REFERENCES dusun(id) ON DELETE SET NULL,
  nama_usaha  TEXT NOT NULL,
  pemilik     TEXT NOT NULL DEFAULT '',
  kategori    TEXT NOT NULL DEFAULT 'Umum',
  deskripsi   TEXT DEFAULT '',
  phone       TEXT DEFAULT '',
  email       TEXT DEFAULT '',
  link_maps   TEXT DEFAULT '',
  foto        TEXT DEFAULT '',
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabel Berita
CREATE TABLE IF NOT EXISTS berita (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  judul      TEXT NOT NULL,
  kategori   TEXT NOT NULL DEFAULT 'Umum',
  penulis    TEXT NOT NULL DEFAULT 'Admin Desa',
  tanggal    DATE NOT NULL DEFAULT CURRENT_DATE,
  ringkasan  TEXT DEFAULT '',
  konten     TEXT DEFAULT '',
  thumbnail  TEXT DEFAULT '',
  status     TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('published','draft')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabel Dokumen
CREATE TABLE IF NOT EXISTS dokumen (
  id        TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  nama      TEXT NOT NULL,
  kategori  TEXT NOT NULL DEFAULT 'Umum',
  ukuran    TEXT DEFAULT '1 MB',
  tanggal   DATE NOT NULL DEFAULT CURRENT_DATE,
  deskripsi TEXT DEFAULT '',
  file_url  TEXT NOT NULL DEFAULT '',
  status    TEXT NOT NULL DEFAULT 'public' CHECK (status IN ('public','private'))
);

-- 5. Tabel Pengumuman
CREATE TABLE IF NOT EXISTS pengumuman (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  judul      TEXT NOT NULL,
  konten     TEXT NOT NULL DEFAULT '',
  tanggal    DATE NOT NULL DEFAULT CURRENT_DATE,
  is_penting BOOLEAN NOT NULL DEFAULT FALSE,
  status     TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive'))
);

-- 6. Tabel Config
CREATE TABLE IF NOT EXISTS config (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);

INSERT INTO config (key, value) VALUES
  ('kepala_desa', 'Bapak Kepala Desa'),
  ('mode', 'neon')
ON CONFLICT (key) DO NOTHING;
