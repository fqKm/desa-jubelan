import React, { useState } from 'react';
import {
  LayoutDashboard,
  Newspaper,
  MapPin,
  Store,
  FileText,
  Bell,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  CheckCircle2,
  Globe,
  UploadCloud,
  LogOut,
  ShieldCheck,
  KeyRound,
  UserPlus
} from 'lucide-react';
import type { Dusun, UMKM, Berita, Dokumen, Pengumuman } from '../types';
import { dataService } from '../services/dataService';
import { MediumEditor } from './MediumEditor';
import { getAdminAccounts, saveAdminAccounts } from './AdminLogin';
import './AdminPanel.css';

interface AdminPanelProps {
  onBackToWebsite: () => void;
  dusunList: Dusun[];
  umkmList: UMKM[];
  beritaList: Berita[];
  dokumenList: Dokumen[];
  pengumumanList: Pengumuman[];
  onRefreshData: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  onBackToWebsite,
  dusunList,
  umkmList,
  beritaList,
  dokumenList,
  pengumumanList,
  onRefreshData
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'berita' | 'dusun' | 'umkm' | 'dokumen' | 'pengumuman' | 'admins'>('dashboard');

  // Admin Credential states
  const [adminAccounts, setAdminAccounts] = useState(() => getAdminAccounts());
  const [newAdminUser, setNewAdminUser] = useState('');
  const [newAdminPass, setNewAdminPass] = useState('');
  const [newAdminName, setNewAdminName] = useState('');

  // Modal states
  const [modalType, setModalType] = useState<'none' | 'berita' | 'dusun' | 'umkm' | 'dokumen' | 'pengumuman'>('none');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [umkmFoto, setUmkmFoto] = useState<string>('');
  const [uploadingFoto, setUploadingFoto] = useState<boolean>(false);

  // Form states
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Custom confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    message: string;
    onConfirm: () => void;
  }>({ open: false, message: '', onConfirm: () => {} });

  const showConfirm = (message: string, onConfirm: () => void) => {
    setConfirmModal({ open: true, message, onConfirm });
  };

  const closeConfirm = () => {
    setConfirmModal({ open: false, message: '', onConfirm: () => {} });
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Upload Foto UMKM ke Vercel Blob (dengan fallback Base64 Data URL)
  const handleUmkmFotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert ke Data URL untuk preview instan dan persistensi lokal
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setUmkmFoto(reader.result);
      }
    };
    reader.readAsDataURL(file);

    setUploadingFoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          setUmkmFoto(data.url);
        }
      }
    } catch {
      // Data URL fallback tetap aktif
    } finally {
      setUploadingFoto(false);
    }
  };

  // Kalkulasi statistik
  const totalJiwa = dusunList.reduce((acc, curr) => acc + (Number(curr.jumlah_jiwa) || 0), 0);
  const totalKk = dusunList.reduce((acc, curr) => acc + (Number(curr.jumlah_kk) || 0), 0);

  // Handlers CRUD Dusun (Hanya field sensus yang relevan)
  const handleSaveDusun = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const item: Partial<Dusun> = {
      id: editingItem?.id,
      nama: fd.get('nama') as string,
      kepala_dusun: fd.get('kepala_dusun') as string,
      rt: fd.get('rt') as string,
      rw: fd.get('rw') as string,
      jumlah_kk: Number(fd.get('jumlah_kk')) || 0,
      jumlah_jiwa: Number(fd.get('jumlah_jiwa')) || 0,
      link_maps: (fd.get('link_maps') as string) || ''
    };

    await dataService.saveItem('dusun', item);
    setModalType('none');
    setEditingItem(null);
    onRefreshData();
    showToast('Data dusun & sensus berhasil diperbarui!');
  };

  // Handlers CRUD UMKM
  const handleSaveUmkm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const item: Partial<UMKM> = {
      id: editingItem?.id,
      nama_usaha: fd.get('nama_usaha') as string,
      dusun_id: fd.get('dusun_id') as string,
      kategori: fd.get('kategori') as string,
      pemilik: fd.get('pemilik') as string,
      phone: fd.get('phone') as string,
      email: (fd.get('email') as string) || '',
      link_maps: (fd.get('link_maps') as string) || '',
      foto: umkmFoto || editingItem?.foto || 'https://images.unsplash.com/photo-1509785307050-d4066910ec1e?w=800',
      deskripsi: fd.get('deskripsi') as string,
      status: 'active'
    };

    await dataService.saveItem('umkm', item);
    setModalType('none');
    setEditingItem(null);
    setUmkmFoto('');
    onRefreshData();
    showToast('Data UMKM berhasil disimpan!');
  };

  // Handlers CRUD Dokumen
  const handleSaveDokumen = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const item: Partial<Dokumen> = {
      id: editingItem?.id,
      nama: fd.get('nama') as string,
      kategori: fd.get('kategori') as string,
      ukuran: (fd.get('ukuran') as string) || '1.5 MB',
      file_url: fd.get('file_url') as string,
      deskripsi: fd.get('deskripsi') as string,
      tanggal: new Date().toISOString().split('T')[0],
      status: 'public'
    };

    await dataService.saveItem('dokumen', item);
    setModalType('none');
    setEditingItem(null);
    onRefreshData();
    showToast('Dokumen publik berhasil diunggah!');
  };

  // Handlers CRUD Pengumuman
  const handleSavePengumuman = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const item: Partial<Pengumuman> = {
      id: editingItem?.id,
      judul: fd.get('judul') as string,
      konten: fd.get('konten') as string,
      is_penting: fd.get('is_penting') === 'true',
      status: (fd.get('status') as 'active' | 'inactive') || 'active',
      tanggal: new Date().toISOString().split('T')[0]
    };

    await dataService.saveItem('pengumuman', item);
    setModalType('none');
    setEditingItem(null);
    onRefreshData();
    showToast('Pengumuman berhasil dipasang!');
  };

  // Handlers Hapus
  const handleDelete = async (collection: 'berita' | 'dusun' | 'umkm' | 'dokumen' | 'pengumuman', id: string) => {
    showConfirm('Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.', async () => {
      closeConfirm();
      await dataService.deleteItem(collection, id);
      onRefreshData();
      showToast('Data berhasil dihapus.');
    });
  };



  // Handlers Kredensial Admin
  const handleAddAdminCredential = (e: React.FormEvent) => {
    e.preventDefault();
    const u = newAdminUser.trim();
    const p = newAdminPass.trim();
    if (!u || !p) {
      showToast('Username dan password tidak boleh kosong.');
      return;
    }
    if (adminAccounts.some(acc => acc.username.toLowerCase() === u.toLowerCase())) {
      showToast(`Username "${u}" sudah digunakan.`);
      return;
    }

    const updated = [
      ...adminAccounts,
      { username: u, password: p, name: newAdminName.trim() || `Admin (${u})` }
    ];
    setAdminAccounts(updated);
    saveAdminAccounts(updated);
    setNewAdminUser('');
    setNewAdminPass('');
    setNewAdminName('');
    showToast(`Akun admin "${u}" berhasil ditambahkan!`);
  };

  const handleDeleteAdminCredential = (username: string) => {
    if (adminAccounts.length <= 1) {
      showToast('Tidak dapat menghapus akun terakhir.');
      return;
    }
    showConfirm(`Hapus kredensial login admin "${username}"? Akun ini tidak akan dapat login lagi.`, () => {
      closeConfirm();
      const updated = adminAccounts.filter(acc => acc.username !== username);
      setAdminAccounts(updated);
      saveAdminAccounts(updated);
      showToast(`Akun admin "${username}" berhasil dihapus.`);
    });
  };

  return (
    <div className="admin-container">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="admin-toast">
          <CheckCircle2 size={18} color="#7ce39f" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {confirmModal.open && (
        <div className="modal-backdrop" style={{ zIndex: 9999 }} onClick={closeConfirm}>
          <div
            className="modal-dialog"
            style={{ maxWidth: 420 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 style={{ color: 'var(--color-danger, #e53935)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Trash2 size={20} />
                Konfirmasi Tindakan
              </h3>
              <button className="btn-close" onClick={closeConfirm}>&times;</button>
            </div>
            <div className="modal-body" style={{ padding: '20px 24px' }}>
              <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--text-primary)', margin: 0 }}>
                {confirmModal.message}
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={closeConfirm}>Batal</button>
              <button
                className="btn btn-primary"
                style={{ background: 'var(--color-danger, #e53935)', borderColor: 'var(--color-danger, #e53935)' }}
                onClick={confirmModal.onConfirm}
              >
                Ya, Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= SIDEBAR ================= */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <div className="village-badge-logo">
            <img
              src="/Logo_Kabupaten_Semarang.svg"
              alt="Logo Kabupaten Semarang"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
          <div>
            <div className="village-title">Desa Jubelan</div>
            <div className="village-subtitle">Portal Admin Desa</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">Menu Utama</div>

          <button
            className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard Ringkasan</span>
          </button>

          <button
            className={`nav-btn ${activeTab === 'berita' ? 'active' : ''}`}
            onClick={() => setActiveTab('berita')}
          >
            <Newspaper size={18} />
            <span>CMS Berita Desa</span>
          </button>

          <button
            className={`nav-btn ${activeTab === 'dusun' ? 'active' : ''}`}
            onClick={() => setActiveTab('dusun')}
          >
            <MapPin size={18} />
            <span>Sensus & Dusun</span>
          </button>

          <button
            className={`nav-btn ${activeTab === 'umkm' ? 'active' : ''}`}
            onClick={() => setActiveTab('umkm')}
          >
            <Store size={18} />
            <span>Potensi UMKM</span>
          </button>

          <button
            className={`nav-btn ${activeTab === 'dokumen' ? 'active' : ''}`}
            onClick={() => setActiveTab('dokumen')}
          >
            <FileText size={18} />
            <span>Dokumen Publik</span>
          </button>

          <button
            className={`nav-btn ${activeTab === 'pengumuman' ? 'active' : ''}`}
            onClick={() => setActiveTab('pengumuman')}
          >
            <Bell size={18} />
            <span>Pengumuman Warga</span>
          </button>

          <div className="nav-section-title">Pengaturan & Sistem</div>

          <button
            className={`nav-btn ${activeTab === 'admins' ? 'active' : ''}`}
            onClick={() => setActiveTab('admins')}
          >
            <ShieldCheck size={18} />
            <span>Kredensial Admin</span>
          </button>



          <button
            className="nav-btn nav-btn-exit"
            onClick={onBackToWebsite}
            title="Keluar dari sesi admin"
          >
            <Globe size={18} />
            <span>Buka Website Desa</span>
          </button>

          <button
            className="nav-btn nav-btn-logout"
            onClick={onBackToWebsite}
            title="Logout dari sesi admin"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="status-badge-box">
            <span className="status-dot green"></span>
            <div>
              <div className="status-title">Neon DB + Vercel Blob</div>
              <div className="status-desc">Tersimpan di cloud</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <main className="admin-main">
        <header className="admin-header">
          <div>
            <h1 className="header-title">
              {activeTab === 'dashboard' && 'Dashboard Pengelola'}
              {activeTab === 'berita' && 'CMS Berita & Kabar Desa'}
              {activeTab === 'dusun' && 'Data Sensus Wilayah Dusun'}
              {activeTab === 'umkm' && 'Data Pelaku Usaha & UMKM'}
              {activeTab === 'dokumen' && 'Repositori Dokumen Publik'}
              {activeTab === 'pengumuman' && 'Pemberitahuan & Pengumuman'}
              {activeTab === 'admins' && 'Kelola Akses Admin'}
            </h1>
            <p className="header-desc">Kelola dan perbarui informasi Desa Jubelan secara real-time</p>
          </div>

          <div className="header-actions">
            <button className="btn btn-outline" onClick={onRefreshData}>
              <RefreshCw size={15} />
              <span>Muat Ulang</span>
            </button>

            {activeTab === 'berita' && (
              <button className="btn btn-primary" onClick={() => { setEditingItem(null); setModalType('berita'); }}>
                <Plus size={16} />
                <span>Tulis Berita Baru</span>
              </button>
            )}
            {activeTab === 'dusun' && (
              <button className="btn btn-primary" onClick={() => { setEditingItem(null); setModalType('dusun'); }}>
                <Plus size={16} />
                <span>Tambah Dusun</span>
              </button>
            )}
            {activeTab === 'umkm' && (
              <button className="btn btn-primary" onClick={() => { setEditingItem(null); setUmkmFoto(''); setModalType('umkm'); }}>
                <Plus size={16} />
                <span>Tambah UMKM</span>
              </button>
            )}
            {activeTab === 'dokumen' && (
              <button className="btn btn-primary" onClick={() => { setEditingItem(null); setModalType('dokumen'); }}>
                <UploadCloud size={16} />
                <span>Unggah Dokumen</span>
              </button>
            )}
            {activeTab === 'pengumuman' && (
              <button className="btn btn-primary" onClick={() => { setEditingItem(null); setModalType('pengumuman'); }}>
                <Plus size={16} />
                <span>Buat Pengumuman</span>
              </button>
            )}
          </div>
        </header>

        <div className="admin-body">
          {/* TAB: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="tab-pane">
              <div className="stats-row">
                <div className="stat-card">
                  <div className="stat-label">TOTAL PENDUDUK</div>
                  <div className="stat-value">{totalJiwa.toLocaleString('id-ID')}</div>
                  <div className="stat-note">Jiwa di 4 Dusun Jubelan</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">KEPALA KELUARGA</div>
                  <div className="stat-value">{totalKk.toLocaleString('id-ID')}</div>
                  <div className="stat-note">Terdaftar pada sensus</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">UNIT UMKM AKTIF</div>
                  <div className="stat-value">{umkmList.length}</div>
                  <div className="stat-note">Kopi, Anyaman, Madu</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">ARTIKEL TERBIT</div>
                  <div className="stat-value">{beritaList.length}</div>
                  <div className="stat-note">Kabar & kegiatan desa</div>
                </div>
              </div>

              {/* Berita Preview */}
              <div className="content-card">
                <div className="card-header">
                  <h3 className="card-title">Kabar Berita Terkini</h3>
                  <button className="btn btn-outline btn-sm" onClick={() => setActiveTab('berita')}>Lihat Semua Berita</button>
                </div>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Judul Berita</th>
                      <th>Kategori</th>
                      <th>Tanggal</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {beritaList.slice(0, 4).map(b => (
                      <tr key={b.id}>
                        <td style={{ fontWeight: 600 }}>{b.judul}</td>
                        <td><span className="badge badge-subtle">{b.kategori}</span></td>
                        <td>{b.tanggal}</td>
                        <td>
                          <span className={`badge ${b.status === 'published' ? 'badge-green' : 'badge-amber'}`}>
                            {b.status === 'published' ? 'Terbit' : 'Draft'}
                          </span>
                        </td>
                        <td>
                          <button className="btn-icon" onClick={() => { setEditingItem(b); setModalType('berita'); }}>
                            <Edit2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: CMS BERITA */}
          {activeTab === 'berita' && (
            <div className="content-card">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Foto</th>
                    <th>Judul & Ringkasan</th>
                    <th>Kategori</th>
                    <th>Tanggal</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {beritaList.map(b => (
                    <tr key={b.id}>
                      <td>
                        <img src={b.thumbnail} alt="" className="table-thumb" />
                      </td>
                      <td style={{ maxWidth: 350 }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{b.judul}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{b.ringkasan}</div>
                      </td>
                      <td><span className="badge badge-subtle">{b.kategori}</span></td>
                      <td>{b.tanggal}</td>
                      <td>
                        <span className={`badge ${b.status === 'published' ? 'badge-green' : 'badge-amber'}`}>
                          {b.status === 'published' ? 'Terbit' : 'Draft'}
                        </span>
                      </td>
                      <td>
                        <div className="action-row">
                          <button className="btn-icon" title="Edit" onClick={() => { setEditingItem(b); setModalType('berita'); }}>
                            <Edit2 size={15} />
                          </button>
                          <button className="btn-icon danger" title="Hapus" onClick={() => handleDelete('berita', b.id)}>
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB: SENSUS & DUSUN */}
          {activeTab === 'dusun' && (
            <div className="content-card">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Nama Dusun</th>
                    <th>Nama Kadus</th>
                    <th>Jumlah RT / RW</th>
                    <th>Jumlah KK & Penduduk</th>
                    <th>Tautan Maps</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {dusunList.map(d => (
                    <tr key={d.id}>
                      <td style={{ fontWeight: 600 }}>{d.nama}</td>
                      <td>{d.kepala_dusun || '-'}</td>
                      <td>{d.rt || '-'} RT / {d.rw || '-'} RW</td>
                      <td>
                        <strong>{d.jumlah_kk} KK</strong> <br />
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{d.jumlah_jiwa} Penduduk</span>
                      </td>
                      <td>
                        {d.link_maps ? (
                          <a href={d.link_maps} target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: 12 }}>
                            📍 Buka Maps ↗
                          </a>
                        ) : '-'}
                      </td>
                      <td>
                        <div className="action-row">
                          <button className="btn-icon" title="Edit" onClick={() => { setEditingItem(d); setModalType('dusun'); }}>
                            <Edit2 size={15} />
                          </button>
                          <button className="btn-icon danger" title="Hapus" onClick={() => handleDelete('dusun', d.id)}>
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB: POTENSI UMKM */}
          {activeTab === 'umkm' && (
            <div className="content-card">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Nama Usaha & Produk</th>
                    <th>Wilayah Dusun</th>
                    <th>Pemilik & Kategori</th>
                    <th>Kontak (HP & Email)</th>
                    <th>Tautan Maps</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {umkmList.map(u => {
                    const dName = dusunList.find(d => d.id === u.dusun_id)?.nama || 'Jubelan';
                    return (
                      <tr key={u.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <img src={u.foto} alt="" className="table-thumb" />
                            <div>
                              <div style={{ fontWeight: 600 }}>{u.nama_usaha}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.deskripsi}</div>
                            </div>
                          </div>
                        </td>
                        <td>{dName}</td>
                        <td>
                          <div><strong>{u.pemilik}</strong></div>
                          <span className="badge badge-subtle">{u.kategori}</span>
                        </td>
                        <td>
                          <div style={{ fontSize: 12 }}>
                            <div>📞 {u.phone}</div>
                            {u.email && <div style={{ color: 'var(--text-muted)' }}>✉ {u.email}</div>}
                          </div>
                        </td>
                        <td>
                          {u.link_maps ? (
                            <a href={u.link_maps} target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: 12 }}>
                              Buka Peta ↗
                            </a>
                          ) : '-'}
                        </td>
                        <td>
                          <div className="action-row">
                            <button className="btn-icon" title="Edit" onClick={() => { setEditingItem(u); setUmkmFoto(u.foto || ''); setModalType('umkm'); }}>
                              <Edit2 size={15} />
                            </button>
                            <button className="btn-icon danger" title="Hapus" onClick={() => handleDelete('umkm', u.id)}>
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB: DOKUMEN */}
          {activeTab === 'dokumen' && (
            <div className="content-card">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Nama Dokumen</th>
                    <th>Kategori</th>
                    <th>Ukuran File</th>
                    <th>Tanggal Terbit</th>
                    <th>Akses Berkas</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {dokumenList.map(doc => (
                    <tr key={doc.id}>
                      <td style={{ fontWeight: 600 }}>{doc.nama}</td>
                      <td><span className="badge badge-subtle">{doc.kategori}</span></td>
                      <td>{doc.ukuran}</td>
                      <td>{doc.tanggal}</td>
                      <td>
                        <a href={doc.file_url} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
                          Unduh / Buka ↗
                        </a>
                      </td>
                      <td>
                        <button className="btn-icon danger" title="Hapus" onClick={() => handleDelete('dokumen', doc.id)}>
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB: PENGUMUMAN */}
          {activeTab === 'pengumuman' && (
            <div className="content-card">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Judul Pemberitahuan</th>
                    <th>Rincian Isi</th>
                    <th>Prioritas</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {pengumumanList.map(p => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>{p.judul}</td>
                      <td style={{ maxWidth: 350, fontSize: 13 }}>{p.konten}</td>
                      <td>
                        {p.is_penting ? (
                          <span className="badge badge-red">Penting / Darurat</span>
                        ) : (
                          <span className="badge badge-subtle">Normal</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${p.status === 'active' ? 'badge-green' : 'badge-subtle'}`}>
                          {p.status === 'active' ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td>
                        <button className="btn-icon danger" title="Hapus" onClick={() => handleDelete('pengumuman', p.id)}>
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}



          {/* TAB: KREDENSIAL LOGIN ADMIN */}
          {activeTab === 'admins' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Form Tambah Kredensial Baru */}
              <div className="content-card" style={{ padding: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: 'rgba(34, 197, 94, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-primary)'
                  }}>
                    <UserPlus size={22} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Tambah Kredensial Admin Baru</h3>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
                      Buat username dan password baru agar perangkat desa lain dapat login ke panel admin.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleAddAdminCredential} style={{ maxWidth: 650, marginTop: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Nama Perangkat / Pemegang Akun</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newAdminName}
                      onChange={e => setNewAdminName(e.target.value)}
                      placeholder="Contoh: Sekretaris Desa / Kaur Keuangan"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Username Login *</label>
                      <input
                        type="text"
                        required
                        className="form-control"
                        value={newAdminUser}
                        onChange={e => setNewAdminUser(e.target.value)}
                        placeholder="Contoh: sekdes_jubelan"
                        autoComplete="off"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Password *</label>
                      <input
                        type="password"
                        required
                        className="form-control"
                        value={newAdminPass}
                        onChange={e => setNewAdminPass(e.target.value)}
                        placeholder="Minimal 6 karakter aman"
                        autoComplete="new-password"
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                    <Plus size={16} />
                    <span>Tambahkan Akun Admin</span>
                  </button>
                </form>
              </div>

              {/* Daftar Akun Admin Tersimpan */}
              <div className="content-card" style={{ padding: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <KeyRound size={20} color="var(--color-primary)" />
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Daftar Kredensial Admin Aktif</h3>
                  </div>
                  <span style={{ fontSize: 12, background: 'var(--bg-muted, #f1f5f9)', padding: '4px 10px', borderRadius: 999, fontWeight: 600 }}>
                    Total: {adminAccounts.length} Akun
                  </span>
                </div>

                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>No</th>
                        <th>Nama Akun / Deskripsi</th>
                        <th>Username</th>
                        <th>Password</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'center' }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminAccounts.map((acc, idx) => (
                        <tr key={acc.username + idx}>
                          <td style={{ width: 50 }}>{idx + 1}</td>
                          <td>
                            <strong>{acc.name || 'Admin'}</strong>
                          </td>
                          <td>
                            <code style={{ background: '#e2e8f0', padding: '3px 8px', borderRadius: 6, fontWeight: 600, fontSize: 13 }}>
                              {acc.username}
                            </code>
                          </td>
                          <td>
                            <span style={{ letterSpacing: 2, color: 'var(--text-muted)' }}>••••••••</span>
                          </td>
                          <td>
                            <span className="badge badge-success" style={{ fontSize: 11, padding: '3px 8px' }}>
                              Aktif
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              className="btn-icon danger"
                              title="Hapus Kredensial Ini"
                              disabled={adminAccounts.length <= 1}
                              onClick={() => handleDeleteAdminCredential(acc.username)}
                              style={{ opacity: adminAccounts.length <= 1 ? 0.4 : 1, cursor: adminAccounts.length <= 1 ? 'not-allowed' : 'pointer' }}
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ================= MODALS & EDITORS ================= */}
      {modalType === 'berita' && (
        <MediumEditor
          initialItem={editingItem}
          onSave={async (item) => {
            await dataService.saveItem('berita', item);
            setModalType('none');
            setEditingItem(null);
            onRefreshData();
            showToast('Berita berhasil disimpan!');
          }}
          onClose={() => {
            setModalType('none');
            setEditingItem(null);
          }}
        />
      )}

      {/* MODAL: DUSUN */}
      {modalType === 'dusun' && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3>{editingItem ? 'Edit Data Dusun & Sensus' : 'Tambah Dusun Baru'}</h3>
              <button className="btn-close" onClick={() => setModalType('none')}>&times;</button>
            </div>
            <form onSubmit={handleSaveDusun}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nama Dusun *</label>
                  <input type="text" name="nama" required className="form-control" defaultValue={editingItem?.nama || ''} placeholder="Contoh: Dusun Watugandu" />
                </div>
                <div className="form-group">
                  <label className="form-label">Nama Kadus (Kepala Dusun)</label>
                  <input type="text" name="kepala_dusun" className="form-control" defaultValue={editingItem?.kepala_dusun || ''} placeholder="Contoh: Bpk. Ahmad Fauzi" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Jumlah RT</label>
                    <input type="text" name="rt" className="form-control" defaultValue={editingItem?.rt || ''} placeholder="Contoh: 04" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Jumlah RW</label>
                    <input type="text" name="rw" className="form-control" defaultValue={editingItem?.rw || ''} placeholder="Contoh: 02" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Jumlah KK (Kepala Keluarga) *</label>
                    <input type="number" name="jumlah_kk" required className="form-control" defaultValue={editingItem?.jumlah_kk || 0} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Jumlah Penduduk (Jiwa) *</label>
                    <input type="number" name="jumlah_jiwa" required className="form-control" defaultValue={editingItem?.jumlah_jiwa || 0} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Tautan Maps</label>
                  <input type="url" name="link_maps" className="form-control" defaultValue={editingItem?.link_maps || ''} placeholder="https://maps.google.com/?q=..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setModalType('none')}>Batal</button>
                <button type="submit" className="btn btn-primary">Simpan Data Dusun</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: UMKM */}
      {modalType === 'umkm' && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3>{editingItem ? 'Edit Data UMKM' : 'Tambah Potensi Usaha & UMKM'}</h3>
              <button className="btn-close" onClick={() => setModalType('none')}>&times;</button>
            </div>
            <form onSubmit={handleSaveUmkm}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nama UMKM / Produk *</label>
                  <input type="text" name="nama_usaha" required className="form-control" defaultValue={editingItem?.nama_usaha || ''} placeholder="Kopi Robusta Jubelan" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Wilayah Dusun *</label>
                    <select name="dusun_id" className="form-control" defaultValue={editingItem?.dusun_id || dusunList[0]?.id}>
                      {dusunList.map(d => (
                        <option key={d.id} value={d.id}>{d.nama}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Kategori Usaha</label>
                    <select name="kategori" className="form-control" defaultValue={editingItem?.kategori || 'Kuliner & Minuman'}>
                      <option value="Kuliner & Minuman">Kuliner & Minuman</option>
                      <option value="Kerajinan Tangan">Kerajinan Tangan</option>
                      <option value="Kesehatan & Pangan">Kesehatan & Pangan</option>
                      <option value="Pertanian">Pertanian</option>
                      <option value="Jasa & Perdagangan">Jasa & Perdagangan</option>
                      <option value="Lain-lain">Lain-lain</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Pemilik Usaha</label>
                  <input type="text" name="pemilik" className="form-control" defaultValue={editingItem?.pemilik || ''} placeholder="Contoh: Mas Danang Triyono" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Nomor HP / WhatsApp *</label>
                    <input type="text" name="phone" required className="form-control" defaultValue={editingItem?.phone || ''} placeholder="0812-xxxx-xxxx" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email (Opsional)</label>
                    <input type="email" name="email" className="form-control" defaultValue={editingItem?.email || ''} placeholder="umkm@gmail.com" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Foto Produk / Usaha (Upload Gambar)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <label style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 7,
                      backgroundColor: '#f2f2f2',
                      border: '1.5px dashed #c0c0c0',
                      borderRadius: 8,
                      padding: '8px 16px',
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#555',
                      cursor: 'pointer'
                    }}>
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleUmkmFotoUpload}
                        disabled={uploadingFoto}
                      />
                      <UploadCloud size={15} />
                      <span>{uploadingFoto ? 'Mengunggah...' : umkmFoto ? 'Ganti Foto' : 'Pilih Foto Produk'}</span>
                    </label>
                    {umkmFoto && (
                      <span style={{ fontSize: 12, color: 'var(--color-primary)', fontWeight: 600 }}>
                        {umkmFoto.startsWith('data:') ? 'Foto siap disimpan ✓' : 'Tersimpan ✓'}
                      </span>
                    )}
                  </div>
                  {umkmFoto && (
                    <div style={{ marginTop: 10, width: 90, height: 70, borderRadius: 8, overflow: 'hidden', border: '1px solid #ddd' }}>
                      <img src={umkmFoto} alt="Pratinjau" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Tautan Maps</label>
                  <input type="url" name="link_maps" className="form-control" defaultValue={editingItem?.link_maps || ''} placeholder="https://maps.google.com/?q=..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Deskripsi</label>
                  <textarea name="deskripsi" rows={3} className="form-control" defaultValue={editingItem?.deskripsi || ''} placeholder="Deskripsi produk, bahan, atau keunggulan usaha..."></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setModalType('none')}>Batal</button>
                <button type="submit" className="btn btn-primary">Simpan UMKM</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DOKUMEN */}
      {modalType === 'dokumen' && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3>Unggah Dokumen Publik</h3>
              <button className="btn-close" onClick={() => setModalType('none')}>&times;</button>
            </div>
            <form onSubmit={handleSaveDokumen}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nama Dokumen / Regulasi *</label>
                  <input type="text" name="nama" required className="form-control" placeholder="Contoh: Peraturan Desa No. 04 Tahun 2026" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Kategori Dokumen</label>
                    <select name="kategori" className="form-control">
                      <option value="Peraturan Desa">Peraturan Desa (Perdes)</option>
                      <option value="Transparansi Anggaran">Transparansi Anggaran (APBDes)</option>
                      <option value="Layanan Warga">Layanan Formulir Warga</option>
                      <option value="Rencana Pembangunan">Rencana Pembangunan (RKPDes)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Ukuran Berkas</label>
                    <input type="text" name="ukuran" className="form-control" defaultValue="1.5 MB" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Tautan Google Drive / PDF *</label>
                  <input type="url" name="file_url" required className="form-control" placeholder="https://drive.google.com/file/d/..." />
                  <small style={{ color: 'var(--text-muted)', fontSize: 11 }}>Pastikan izin file di Google Drive adalah 'Anyone with link can view'.</small>
                </div>
                <div className="form-group">
                  <label className="form-label">Deskripsi Dokumen</label>
                  <textarea name="deskripsi" rows={2} className="form-control" placeholder="Keterangan perihal isi dokumen"></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setModalType('none')}>Batal</button>
                <button type="submit" className="btn btn-primary">Simpan Dokumen</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PENGUMUMAN */}
      {modalType === 'pengumuman' && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3>Buat Pengumuman Warga</h3>
              <button className="btn-close" onClick={() => setModalType('none')}>&times;</button>
            </div>
            <form onSubmit={handleSavePengumuman}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Judul Pemberitahuan *</label>
                  <input type="text" name="judul" required className="form-control" placeholder="Perekaman KTP Elektronik Keliling" />
                </div>
                <div className="form-group">
                  <label className="form-label">Isi Pengumuman Lengkap *</label>
                  <textarea name="konten" rows={3} required className="form-control" placeholder="Jadwal, syarat berkas, dan lokasi kegiatan..."></textarea>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Prioritas Pengumuman</label>
                    <select name="is_penting" className="form-control">
                      <option value="false">Normal (Informasi Biasa)</option>
                      <option value="true">Penting (Ditampilkan di Banner Merah)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status Tayang</label>
                    <select name="status" className="form-control">
                      <option value="active">Aktif (Ditampilkan)</option>
                      <option value="inactive">Nonaktif</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setModalType('none')}>Batal</button>
                <button type="submit" className="btn btn-primary">Simpan Pengumuman</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
