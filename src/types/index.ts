// ==========================================================================
// Types & Interfaces untuk Website Desa Jubelan
// ==========================================================================

export interface Dusun {
  id: string;
  nama: string;
  kepala_dusun: string;
  rt: string;
  rw: string;
  jumlah_kk: number;
  jumlah_jiwa: number;
  link_maps: string;
  deskripsi?: string;
  phone?: string;
  email?: string;
  foto?: string;
  updated_at?: string;
}

export interface UMKM {
  id: string;
  dusun_id: string;
  nama_usaha: string;
  pemilik: string;
  kategori: string;
  deskripsi: string;
  phone: string;
  email?: string;
  link_maps: string;
  foto: string;
  status?: 'active' | 'inactive';
  updated_at?: string;
}

export interface Berita {
  id: string;
  judul: string;
  kategori: string;
  penulis: string;
  tanggal: string;
  ringkasan: string;
  konten: string;
  thumbnail: string;
  status: 'published' | 'draft';
  created_at?: string;
  updated_at?: string;
}

export interface Dokumen {
  id: string;
  nama: string;
  kategori: string;
  ukuran: string;
  tanggal: string;
  deskripsi: string;
  file_url: string;
  status: 'public' | 'private';
}

export interface Pengumuman {
  id: string;
  judul: string;
  konten: string;
  tanggal: string;
  is_penting: boolean;
  status: 'active' | 'inactive';
}

export interface AppConfig {
  mode: 'local' | 'google_sheets' | 'neon';
  appsScriptUrl: string;
  spreadsheetId: string;
  kepala_desa?: string;
}
