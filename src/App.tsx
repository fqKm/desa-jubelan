import React, { useState, useEffect } from 'react';
import { PublicWebsite } from './components/PublicWebsite';
import { AdminPanel } from './components/AdminPanel';
import { AdminLogin, isAdminSessionValid, destroyAdminSession } from './components/AdminLogin';
import { ArticleDetailPage } from './components/ArticleDetailPage';
import type { Dusun, UMKM, Berita, Dokumen, Pengumuman } from './types';
import { dataService } from './services/dataService';

// ─────────────────────────────────────────────────────────────
// View states:
//   'public'  — Halaman utama publik
//   'login'   — Login portal (sebelum masuk admin)
//   'admin'   — Dashboard admin (sudah login)
// ─────────────────────────────────────────────────────────────
type AppView = 'public' | 'login' | 'admin';

export const App: React.FC = () => {
  const [view, setView] = useState<AppView>('public');
  const [activeArticle, setActiveArticle] = useState<Berita | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('desa_jubelan_theme') as 'light' | 'dark') || 'light';
  });

  // Sync theme with HTML root element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('desa_jubelan_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Data states
  const [dusunList, setDusunList] = useState<Dusun[]>([]);
  const [umkmList, setUmkmList] = useState<UMKM[]>([]);
  const [beritaList, setBeritaList] = useState<Berita[]>([]);
  const [dokumenList, setDokumenList] = useState<Dokumen[]>([]);
  const [pengumumanList, setPengumumanList] = useState<Pengumuman[]>([]);
  const [kepalaDesa, setKepalaDesa] = useState<string>('Bapak Kepala Desa');

  const loadData = async () => {
    setLoading(true);
    try {
      const [dusun, umkm, berita, dokumen, pengumuman, cfg] = await Promise.all([
        dataService.getCollection<Dusun>('dusun'),
        dataService.getCollection<UMKM>('umkm'),
        dataService.getCollection<Berita>('berita'),
        dataService.getCollection<Dokumen>('dokumen'),
        dataService.getCollection<Pengumuman>('pengumuman'),
        dataService.loadConfig(),
      ]);
      setDusunList(dusun);
      setUmkmList(umkm);
      setBeritaList(berita);
      setDokumenList(dokumen);
      setPengumumanList(pengumuman);
      if (cfg?.kepala_desa) setKepalaDesa(cfg.kepala_desa);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Silent refresh: membaca data dari cache yang terupdate instan
  const silentRefresh = async () => {
    try {
      const [dusun, umkm, berita, dokumen, pengumuman, cfg] = await Promise.all([
        dataService.getCollection<Dusun>('dusun'),
        dataService.getCollection<UMKM>('umkm'),
        dataService.getCollection<Berita>('berita'),
        dataService.getCollection<Dokumen>('dokumen'),
        dataService.getCollection<Pengumuman>('pengumuman'),
        dataService.loadConfig(true),
      ]);
      setDusunList(dusun);
      setUmkmList(umkm);
      setBeritaList(berita);
      setDokumenList(dokumen);
      setPengumumanList(pengumuman);
      if (cfg?.kepala_desa) setKepalaDesa(cfg.kepala_desa);
    } catch (err) {
      console.error('Error refreshing data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ── Handlers ─────────────────────────────────────────────
  // Dipanggil dari PublicWebsite saat user klik tombol admin
  const handleOpenAdmin = () => {
    if (isAdminSessionValid()) {
      // Sudah login, langsung ke admin
      setView('admin');
    } else {
      // Tampilkan halaman login
      setView('login');
    }
  };

  const handleLoginSuccess = () => {
    setView('admin');
  };

  const handleLogout = () => {
    destroyAdminSession();
    setView('public');
  };

  // ── Loading Screen ────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f7f4',
        color: '#2d5a43',
        gap: 12
      }}>
        <div style={{ fontSize: 32 }}>🌿</div>
        <div style={{ fontWeight: 700, fontSize: 16 }}>Memuat Website Desa Jubelan...</div>
      </div>
    );
  }

  return (
    <>
      {/* ── LOGIN PORTAL ── */}
      {view === 'login' && (
        <AdminLogin
          onLoginSuccess={handleLoginSuccess}
          onBack={() => setView('public')}
        />
      )}

      {/* ── ADMIN DASHBOARD ── */}
      {view === 'admin' && (
        <AdminPanel
          onBackToWebsite={handleLogout}
          dusunList={dusunList}
          umkmList={umkmList}
          beritaList={beritaList}
          dokumenList={dokumenList}
          pengumumanList={pengumumanList}
          onRefreshData={silentRefresh}
        />
      )}

      {/* ── PUBLIC WEBSITE ── */}
      {view === 'public' && !activeArticle && (
        <PublicWebsite
          onOpenAdmin={handleOpenAdmin}
          dusunList={dusunList}
          umkmList={umkmList}
          beritaList={beritaList}
          dokumenList={dokumenList}
          pengumumanList={pengumumanList}
          onSelectNews={(news) => setActiveArticle(news)}
          theme={theme}
          onToggleTheme={toggleTheme}
          kepalaDesa={kepalaDesa}
        />
      )}

      {/* ── ARTICLE DETAIL ── */}
      {view === 'public' && activeArticle && (
        <ArticleDetailPage
          article={activeArticle}
          allArticles={beritaList}
          onBack={() => setActiveArticle(null)}
          onSelectArticle={(art) => setActiveArticle(art)}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}
    </>
  );
};

export default App;
