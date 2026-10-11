import type { Dusun, UMKM, Berita, Dokumen, Pengumuman } from '../types';

export const INITIAL_DUSUN: Dusun[] = [
  {
    id: 'dusun-jubelan',
    nama: 'Dusun Jubelan',
    kepala_dusun: 'Bpk. Supardi',
    rt: '04',
    rw: '02',
    jumlah_kk: 142,
    jumlah_jiwa: 486,
    phone: '0812-3456-7891',
    email: 'jubelan@jubelan.desa.id',
    link_maps: 'https://maps.google.com/?q=Desa+Jubelan+Sumowono',
    foto: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80',
    deskripsi: 'Pusat administrasi desa, balai pertemuan warga, dan sentra kerajinan anyaman bambu.'
  },
  {
    id: 'dusun-watugandu',
    nama: 'Dusun Watugandu',
    kepala_dusun: 'Bpk. Ahmad Fauzi',
    rt: '03',
    rw: '01',
    jumlah_kk: 118,
    jumlah_jiwa: 395,
    phone: '0813-9876-5432',
    email: 'watugandu@jubelan.desa.id',
    link_maps: 'https://maps.google.com/?q=Desa+Jubelan+Sumowono',
    foto: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=800&auto=format&fit=crop&q=80',
    deskripsi: 'Wilayah perbukitan dengan persawahan berundak terasering dan mata air alami pegunungan.'
  },
  {
    id: 'dusun-logung',
    nama: 'Dusun Logung',
    kepala_dusun: 'Bpk. Bambang Sutrisno',
    rt: '05',
    rw: '02',
    jumlah_kk: 135,
    jumlah_jiwa: 460,
    phone: '0857-1122-3344',
    email: 'logung@jubelan.desa.id',
    link_maps: 'https://maps.google.com/?q=Desa+Jubelan+Sumowono',
    foto: 'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?w=800&auto=format&fit=crop&q=80',
    deskripsi: 'Sentra perkebunan kopi robusta lereng gunung, cengkeh, dan peternakan kambing etawa mandiri.'
  },
  {
    id: 'dusun-suruhan',
    nama: 'Dusun Suruhan',
    kepala_dusun: 'Bpk. Mulyono',
    rt: '03',
    rw: '01',
    jumlah_kk: 98,
    jumlah_jiwa: 320,
    phone: '0819-5566-7788',
    email: 'suruhan@jubelan.desa.id',
    link_maps: 'https://maps.google.com/?q=Desa+Jubelan+Sumowono',
    foto: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80',
    deskripsi: 'Dataran tinggi dengan panorama lembah terbuka, pertanian sayuran organik, dan agrowisata.'
  }
];

export const INITIAL_UMKM: UMKM[] = [
  {
    id: 'umkm-1',
    dusun_id: 'dusun-jubelan',
    nama_usaha: 'Kopi Jubelan Robusta Roastery',
    pemilik: 'Mas Danang Triyono',
    kategori: 'Kuliner & Minuman',
    deskripsi: 'Biji kopi robusta petik merah asli lereng pegunungan Jubelan dengan karakter rasa mantap.',
    phone: '0812-4455-8899',
    email: 'kopijubelan@gmail.com',
    link_maps: 'https://maps.google.com/?q=Desa+Jubelan+Sumowono',
    foto: 'https://images.unsplash.com/photo-1509785307050-d4066910ec1e?w=800&auto=format&fit=crop&q=80',
    status: 'active'
  },
  {
    id: 'umkm-2',
    dusun_id: 'dusun-jubelan',
    nama_usaha: 'Kerajinan Anyaman Anyar Bambu',
    pemilik: 'Ibu Warsiti',
    kategori: 'Kerajinan Tangan',
    deskripsi: 'Produk wadah ramah lingkungan, besek hampers, dan perabot hiasan dari bambu apus pilihan.',
    phone: '0858-7711-2244',
    email: 'anyambambu.jubelan@gmail.com',
    link_maps: 'https://maps.google.com/?q=Desa+Jubelan+Sumowono',
    foto: 'https://images.unsplash.com/photo-1584589167171-541ce45f1eea?w=800&auto=format&fit=crop&q=80',
    status: 'active'
  },
  {
    id: 'umkm-3',
    dusun_id: 'dusun-watugandu',
    nama_usaha: 'Madu Lanceng Klanceng Rimba',
    pemilik: 'Pak Joko Purnomo',
    kategori: 'Kesehatan & Pangan',
    deskripsi: 'Madu murni lebah trigona/klanceng kaya propolis dari vegetasi bunga hutan desa.',
    phone: '0877-3344-9900',
    email: 'maduklanceng.jubelan@gmail.com',
    link_maps: 'https://maps.google.com/?q=Desa+Jubelan+Sumowono',
    foto: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&auto=format&fit=crop&q=80',
    status: 'active'
  },
  {
    id: 'umkm-4',
    dusun_id: 'dusun-watugandu',
    nama_usaha: 'Beras Merah Organik Watugandu',
    pemilik: 'Kelompok Tani Subur',
    kategori: 'Pertanian',
    deskripsi: 'Beras merah pulen dari sawah terasering dengan pengairan mata air alami pegunungan.',
    phone: '0813-8899-7711',
    email: 'beraswatugandu@gmail.com',
    link_maps: 'https://maps.google.com/?q=Desa+Jubelan+Sumowono',
    foto: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&auto=format&fit=crop&q=80',
    status: 'active'
  },
  {
    id: 'umkm-5',
    dusun_id: 'dusun-logung',
    nama_usaha: 'Susu Kambing Etawa Segar Logung',
    pemilik: 'Pak Tri Mulyadi',
    kategori: 'Kesehatan & Pangan',
    deskripsi: 'Susu kambing etawa segar higienis tanpa bahan pengawet dari peternakan hijau Logung.',
    phone: '0857-4433-2211',
    email: 'etawalogung@gmail.com',
    link_maps: 'https://maps.google.com/?q=Desa+Jubelan+Sumowono',
    foto: 'https://images.unsplash.com/photo-1527153857715-3908f2ae5e81?w=800&auto=format&fit=crop&q=80',
    status: 'active'
  },
  {
    id: 'umkm-6',
    dusun_id: 'dusun-suruhan',
    nama_usaha: 'Sayuran Organik & Selada Suruhan',
    pemilik: 'Mbak Rina Lestari',
    kategori: 'Pertanian',
    deskripsi: 'Sayuran hidroponik dan tanaman holtikultura segar hasil panen harian dataran tinggi Suruhan.',
    phone: '0819-2233-4455',
    email: 'sayursuruhan@gmail.com',
    link_maps: 'https://maps.google.com/?q=Desa+Jubelan+Sumowono',
    foto: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80',
    status: 'active'
  }
];

export const INITIAL_BERITA: Berita[] = [
  {
    id: 'berita-1',
    judul: 'Pencanangan Program Digitalisasi Desa dan Verifikasi Sensus Dusun 2026',
    kategori: 'Pemerintahan',
    penulis: 'Sekretariat Desa',
    tanggal: '2026-09-28',
    ringkasan: 'Pemerintah Desa Jubelan meluncurkan portal informasi cloud terpadu guna mempercepat pendataan kependudukan.',
    konten: 'Dalam rangka mewujudkan tata kelola desa yang akuntabel dan modern, Pemerintah Desa Jubelan resmi memulai integrasi basis data kependudukan dan pemetaan potensi UMKM berbasis cloud spreadsheet.',
    thumbnail: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&auto=format&fit=crop&q=80',
    status: 'published'
  },
  {
    id: 'berita-2',
    judul: 'Panen Raya Kopi Lereng Jubelan Capai Rekor Produksi Terbaik',
    kategori: 'Pertanian',
    penulis: 'Kelompok Tani Makmur',
    tanggal: '2026-09-24',
    ringkasan: 'Curah hujan yang bersahabat dan pemupukan organik mengantarkan petani kopi Jubelan meraih panen melimpah.',
    konten: 'Musim panen kopi tahun ini membawa kebahagiaan bagi para petani Dusun Gedad dan Glodogan. Kerjasama kelompok tani mengantarkan kualitas biji kopi petik merah grade premium.',
    thumbnail: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80',
    status: 'published'
  },
  {
    id: 'berita-3',
    judul: 'Kerja Bakti Massal Penataan Saluran Air Bersih Dusun Kalitengah',
    kategori: 'Kegiatan Warga',
    penulis: 'Karang Taruna Tunas Harapan',
    tanggal: '2026-09-18',
    ringkasan: 'Puluhan pemuda desa bersama perangkat RW bergotong royong membersihkan jalur mata air pegunungan.',
    konten: 'Semangat gotong royong warga Dusun Kalitengah kembali terlihat pada akhir pekan lalu. Pembersihan sedimentasi mata air pegunungan dilakukan untuk menjamin pasokan air konsumsi tetap bersih.',
    thumbnail: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&auto=format&fit=crop&q=80',
    status: 'published'
  }
];

export const INITIAL_DOKUMEN: Dokumen[] = [
  {
    id: 'dok-1',
    nama: 'Peraturan Desa No. 04 Tahun 2026 tentang RKPDesa',
    kategori: 'Peraturan Desa',
    ukuran: '2.4 MB',
    tanggal: '2026-09-15',
    deskripsi: 'Rencana Kerja Pemerintah Desa Jubelan Tahun Anggaran 2026.',
    file_url: 'https://drive.google.com',
    status: 'public'
  },
  {
    id: 'dok-2',
    nama: 'Laporan Realisasi APBDes Jubelan Semester I 2026',
    kategori: 'Transparansi Anggaran',
    ukuran: '1.8 MB',
    tanggal: '2026-07-20',
    deskripsi: 'Publikasi transparansi anggaran belanja dan pendapatan desa semester pertama.',
    file_url: 'https://drive.google.com',
    status: 'public'
  },
  {
    id: 'dok-3',
    nama: 'Formulir Permohonan Surat Keterangan Domisili & Usaha',
    kategori: 'Layanan Warga',
    ukuran: '420 KB',
    tanggal: '2026-05-10',
    deskripsi: 'Blangko cetak permohonan surat keterangan pengantar desa.',
    file_url: 'https://drive.google.com',
    status: 'public'
  }
];

export const INITIAL_PENGUMUMAN: Pengumuman[] = [
  {
    id: 'peng-1',
    judul: 'Pelayanan Perekaman KTP-El Keliling di Balai Desa Jubelan',
    konten: 'Disdukcapil akan mengadakan layanan jemput bola perekaman KTP Elektronik pada hari Kamis, 8 Oktober 2026, pukul 08.30 - 14.00 WIB di Balai Pertemuan Desa.',
    tanggal: '2026-09-29',
    is_penting: true,
    status: 'active'
  },
  {
    id: 'peng-2',
    judul: 'Jadwal Penyaluran Bantuan Cadangan Pangan Pemerintah Tahap III',
    konten: 'Penerima manfaat diimbau membawa KTP asli dan KK ke balai pertemuan masing-masing dusun sesuai jadwal pembagian terlampir.',
    tanggal: '2026-09-25',
    is_penting: false,
    status: 'active'
  }
];
