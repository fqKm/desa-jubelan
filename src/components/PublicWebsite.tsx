import React, { useState } from 'react';
import type {
  Dusun,
  UMKM,
  Berita,
  Dokumen,
  Pengumuman
} from '../types';
import {
  Sun,
  Moon,
  Menu,
  X,
  ArrowRight,
  ArrowUpRight,
  MapPin,
  Phone,
  Download,
  Compass
} from 'lucide-react';
import { InteractiveKmlMap } from './InteractiveKmlMap';
import './PublicWebsite.css';

interface PublicWebsiteProps {
  onOpenAdmin: () => void;
  dusunList: Dusun[];
  umkmList: UMKM[];
  beritaList: Berita[];
  dokumenList: Dokumen[];
  pengumumanList: Pengumuman[];
  onSelectNews?: (berita: Berita) => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  kepalaDesa?: string;
}

export const PublicWebsite: React.FC<PublicWebsiteProps> = ({
  onOpenAdmin,
  dusunList,
  umkmList,
  beritaList,
  dokumenList,
  pengumumanList,
  onSelectNews,
  theme: propTheme,
  onToggleTheme: propToggleTheme,
  kepalaDesa,
}) => {
  // Theme state: synced with prop or fallback to localStorage
  const [internalTheme, setInternalTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('desa_jubelan_theme') as 'light' | 'dark') || 'light';
  });

  const theme = propTheme || internalTheme;

  const toggleTheme = () => {
    if (propToggleTheme) {
      propToggleTheme();
    } else {
      const nextTheme = theme === 'light' ? 'dark' : 'light';
      setInternalTheme(nextTheme);
      document.documentElement.setAttribute('data-theme', nextTheme);
      localStorage.setItem('desa_jubelan_theme', nextTheme);
    }
  };

  // Mobile menu open state
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Selected Dusun for Cadastral Map
  const [selectedDusunId, setSelectedDusunId] = useState<string>('desa-jubelan');

  // Selected News for Modal Read Story
  const [selectedNews, setSelectedNews] = useState<Berita | null>(null);

  const handleNavClick = () => {
    setMobileMenuOpen(false);
  };

  // Find active dusun data (flexible matcher for KML polygon IDs and dusun records)
  // Returns undefined if Desa Jubelan (village-level) is selected
  const isDesaView = selectedDusunId === 'desa-jubelan' || selectedDusunId === 'desa-jubelan-boundary';
  const currentDusun = isDesaView ? undefined : (
    dusunList.find(d =>
      d.id === selectedDusunId ||
      (selectedDusunId.includes('watugandu') && d.nama.toLowerCase().includes('watugandu')) ||
      (selectedDusunId.includes('logung') && d.nama.toLowerCase().includes('logung')) ||
      (selectedDusunId.includes('jubelan') && d.nama.toLowerCase().includes('jubelan')) ||
      (selectedDusunId.includes('suruhan') && d.nama.toLowerCase().includes('suruhan'))
    )
  );

  // Statistics calculation
  const totalJiwa = dusunList.reduce((acc, curr) => acc + (Number(curr.jumlah_jiwa) || 0), 0);
  const totalKk = dusunList.reduce((acc, curr) => acc + (Number(curr.jumlah_kk) || 0), 0);

  return (
    <div className="public-wrapper">
      {/* ================= 2. VILLAGE HEADER (1440x82 Desktop / 390x72 Mobile) ================= */}
      <header className="village-header">
        <div className="site-container header-inner">
          {/* Brand: Village Mark (Circle with Mountain) + Brand Text */}
          <a href="#beranda" className="village-brand">
            <div className="village-mark">
              <img
                src="/Logo_Kabupaten_Semarang.svg"
                alt="Logo Kabupaten Semarang"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
            <div className="brand-text">
              <span className="village-name">Desa Jubelan</span>
              <span className="village-municipality">Kecamatan Sumowono</span>
            </div>
          </a>

          {/* Desktop Navigation */}
          <nav className="village-nav">
            <a href="#tentang" className="nav-item">Tentang Kami</a>
            <a href="#berita" className="nav-item">Berita</a>
            <a href="#peta-desa" className="nav-item">Peta Desa</a>
            <a href="#umkm" className="nav-item">Potensi UMKM</a>
            <a href="#dokumen" className="nav-item">Dokumen</a>
          </nav>

          {/* Desktop Actions */}
          <div className="header-actions">
            {/* Theme Toggle */}
            <button
              className="theme-toggle-btn"
              onClick={toggleTheme}
              aria-label="Toggle visual theme"
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            >
              {theme === 'light' ? (
                <>
                  <Moon size={15} strokeWidth={1.8} />
                  <span>Dark</span>
                </>
              ) : (
                <>
                  <Sun size={15} strokeWidth={1.8} />
                  <span>Light</span>
                </>
              )}
            </button>
          </div>

          {/* Mobile Controls */}
          <div className="mobile-controls">
            <button
              className="mobile-icon-btn"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon size={17} strokeWidth={1.8} /> : <Sun size={17} strokeWidth={1.8} />}
            </button>
            <button
              className="mobile-icon-btn"
              onClick={() => setMobileMenuOpen(prev => !prev)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={20} strokeWidth={1.8} /> : <Menu size={20} strokeWidth={1.8} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <div className={`mobile-menu-drawer ${mobileMenuOpen ? 'open' : ''}`}>
          <div className="mobile-nav-links">
            <a href="#tentang" className="mobile-nav-item" onClick={handleNavClick}>Tentang Kami</a>
            <a href="#berita" className="mobile-nav-item" onClick={handleNavClick}>Kabar Berita</a>
            <a href="#peta-desa" className="mobile-nav-item" onClick={handleNavClick}>Peta Persebaran Dusun</a>
            <a href="#umkm" className="mobile-nav-item" onClick={handleNavClick}>Potensi UMKM</a>
            <a href="#dokumen" className="mobile-nav-item" onClick={handleNavClick}>Dokumen Publik</a>
          </div>
        </div>
      </header>

      {/* ================= 3. VILLAGE HERO ================= */}
      <section
        id="beranda"
        className="village-hero"
        style={{
          backgroundImage: `url('/hero-desa-jubelan.jpg')`
        }}
      >
        <div className="hero-overlay"></div>
        <div className="site-container hero-content">
          <h1 className="hero-title">
            Selamat Datang<br />
            Di Desa Jubelan
          </h1>
          <p className="hero-lead">
            Menjaga kearifan tradisi dan keelokan lembah alam Jubelan,
            sembari melangkah optimis menuju tata kelola desa modern, transparan, dan berdaya saing.
          </p>
          <div className="hero-actions">
            <a href="#tentang" className="btn-primary-action">
              <span>Jelajahi Desa</span>
              <ArrowRight size={16} strokeWidth={2} />
            </a>
            <a href="#peta-desa" className="btn-secondary-action">
              <Compass size={16} strokeWidth={1.8} />
              <span>Peta Persebaran Dusun</span>
            </a>
          </div>
        </div>
      </section>

      {/* ================= 4. VILLAGE OVERVIEW (TENTANG KAMI) ================= */}
      <section id="tentang" className="village-overview">
        <div className="site-container">
          <div className="overview-intro">
            <div className="overview-heading">
              <h2>Sangkan Paraning Dumadi</h2>
            </div>
            <div className="overview-copy">
              <h3>Visi</h3>
              <p className="visi-text">"Menjadi desa yang maju, mandiri, dan berkelanjutan."</p>
              <h3>Misi</h3>
              <ul className="misi-list-simple">
                <li>Meningkatkan kesejahteraan masyarakat melalui pembangunan infrastruktur.</li>
                <li>Mendorong pertumbuhan ekonomi lokal dengan mendukung UMKM.</li>
                <li>Melestarikan budaya dan lingkungan alam desa.</li>
              </ul>
            </div>
          </div>

          {/* 4 Statistics Items */}
          <div className="village-statistics">
            <div className="statistic-card">
              <div className="stat-value">{totalJiwa ? totalJiwa.toLocaleString('id-ID') : '1.842'}</div>
              <div className="stat-label">Penduduk</div>
            </div>
            <div className="statistic-card">
              <div className="stat-value">{totalKk ? totalKk.toLocaleString('id-ID') : '612'}</div>
              <div className="stat-label">Rumah Tangga</div>
            </div>
            <div className="statistic-card">
              <div className="stat-value">{dusunList.length || '4'}</div>
              <div className="stat-label">Dusun</div>
            </div>
            <div className="statistic-card">
              <div className="stat-value">{umkmList.length ? `${umkmList.length} +` : '20 +'}</div>
              <div className="stat-label">UMKM Aktif</div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 5. LATEST NEWS ================= */}
      <section id="berita" className="village-news-section">
        <div className="site-container">
          <div className="section-head-row">
            <div>
              {/* <div className="eyebrow-tag">
                <span className="eyebrow-dot"></span>
                <span>From the village</span>
              </div> */}
              <h2 className="section-head-title">Berita Terkini</h2>
            </div>
            <a href="#berita" className="btn-outline-pill">
              <span>Semua Berita</span>
              <ArrowRight size={15} strokeWidth={2} />
            </a>
          </div>

          <div className="news-grid">
            {beritaList.filter(b => b.status === 'published').slice(0, 3).map(news => (
              <article
                key={news.id}
                className="news-card"
                onClick={() => {
                  if (onSelectNews) {
                    onSelectNews(news);
                  } else {
                    setSelectedNews(news);
                  }
                }}
              >
                <div className="news-image-wrap">
                  <img src={news.thumbnail} alt={news.judul} className="news-image" loading="lazy" />
                </div>
                <div className="news-metadata">
                  <span className="news-category">{news.kategori}</span>
                  <span className="news-date">{news.tanggal}</span>
                </div>
                <h3 className="news-headline">{news.judul}</h3>
                <p className="news-summary-text">{news.ringkasan}</p>
                <div className="news-read-link">
                  <span>Baca cerita</span>
                  <ArrowUpRight size={16} strokeWidth={2} />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ================= 6. INTERACTIVE VILLAGE MAP (PETA PERSEBARAN DUSUN) ================= */}
      <section id="peta-desa" className="village-map-section">
        <div className="site-container">
          <div className="map-intro-row">
            <div className="map-intro-text">
              {/* <div className="eyebrow-tag">
                <span className="eyebrow-dot"></span>
                <span>Village map</span>
              </div> */}
              <h2>Peta Persebaran Dusun</h2>
              <p>Pilih dusun untuk melihat rincian demografi, batas wilayah, dan Potensi UMKM.</p>
            </div>
            {/* <div className="status-badge">
              <span className="status-beacon"></span>
              <span>Dataset Publik · Terverifikasi</span>
            </div> */}
          </div>

          <div className="map-workspace">
            {/* Left: Interactive Real KML Map */}
            <div className="map-col-left">
              <InteractiveKmlMap
                selectedDusunId={selectedDusunId}
                onSelectDusun={(id) => setSelectedDusunId(id)}
                theme={theme}
              />
            </div>

            {/* Right: Selected Block Details Card */}
            {isDesaView ? (
              /* === DESA JUBELAN VIEW: Total KK + Jiwa === */
              <div className="selected-block-card">
                <div>
                  <div className="selection-meta">Desa</div>
                  <h3 className="selection-block-title">Desa Jubelan</h3>
                </div>

                <div className="block-facts-list">
                  <div className="block-fact-item">
                    <span className="fact-key">Kepala Desa</span>
                    <span className="fact-val">{kepalaDesa || 'Bapak Kepala Desa'}</span>
                  </div>
                  <div className="block-fact-item">
                    <span className="fact-key">Total Kepala Keluarga</span>
                    <span className="fact-val">{totalKk.toLocaleString('id-ID')} KK</span>
                  </div>
                  <div className="block-fact-item">
                    <span className="fact-key">Total Penduduk</span>
                    <span className="fact-val">{totalJiwa.toLocaleString('id-ID')} Jiwa</span>
                  </div>
                  <div className="block-fact-item">
                    <span className="fact-key">Jumlah Dusun</span>
                    <span className="fact-val">{dusunList.length} Dusun</span>
                  </div>
                </div>

                <div className="block-action-btns">
                  <a
                    href="https://maps.google.com/?q=Desa+Jubelan,+Sumowono,+Semarang"
                    target="_blank"
                    rel="noreferrer"
                    className="btn-block-action primary"
                  >
                    <MapPin size={15} strokeWidth={2} />
                    <span>Buka di Google Maps</span>
                  </a>
                </div>
              </div>
            ) : currentDusun ? (
              /* === DUSUN VIEW: Sensus info Dusun === */
              <div className="selected-block-card">
                <div>
                  <div className="selection-meta">Dusun</div>
                  <h3 className="selection-block-title">{currentDusun.nama}</h3>
                </div>

                <div className="block-facts-list">
                  <div className="block-fact-item">
                    <span className="fact-key">Kepala Dusun</span>
                    <span className="fact-val">{currentDusun.kepala_dusun || '-'}</span>
                  </div>
                  <div className="block-fact-item">
                    <span className="fact-key">Jumlah RT</span>
                    <span className="fact-val">{currentDusun.rt || '-'} RT</span>
                  </div>
                  <div className="block-fact-item">
                    <span className="fact-key">Jumlah RW</span>
                    <span className="fact-val">{currentDusun.rw || '-'} RW</span>
                  </div>
                  <div className="block-fact-item">
                    <span className="fact-key">Jumlah KK</span>
                    <span className="fact-val">{currentDusun.jumlah_kk} KK</span>
                  </div>
                  <div className="block-fact-item">
                    <span className="fact-key">Jumlah Penduduk</span>
                    <span className="fact-val">{currentDusun.jumlah_jiwa} Jiwa</span>
                  </div>
                </div>

                <div className="block-action-btns">
                  {currentDusun.link_maps && (
                    <a
                      href={currentDusun.link_maps}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-block-action primary"
                    >
                      <MapPin size={15} strokeWidth={2} />
                      <span>Buka Titik Peta Google Maps</span>
                    </a>
                  )}
                  {/* Scroll to UMKM section */}
                  <a href="#umkm" className="btn-block-action secondary">
                    <span>Lihat Potensi UMKM ↓</span>
                  </a>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* ================= 7. POTENSI UMKM DESA ================= */}
      <section id="umkm" className="village-umkm-section">
        <div className="site-container">
          <div className="section-head-row">
            <div>
              {/* <div className="eyebrow-tag">
                <span className="eyebrow-dot"></span>
                <span>Pemberdayaan Ekonomi</span>
              </div> */}
              <h2 className="section-head-title">Potensi dan UMKM Desa</h2>
              {/* Dynamic subtitle based on selected dusun */}
              {!isDesaView && currentDusun ? (
                <p className="umkm-section-subtitle">
                  Menampilkan UMKM di <strong>{currentDusun.nama}</strong>
                  {' · '}
                  <a
                    href="#peta-desa"
                    className="umkm-reset-link"
                    onClick={() => setSelectedDusunId('desa-jubelan')}
                  >Lihat semua</a>
                </p>
              ) : (
                <p className="umkm-section-subtitle">Semua UMKM aktif di Desa Jubelan</p>
              )}
            </div>
          </div>

          {(() => {
            const filteredUmkm = isDesaView
              ? umkmList.filter(u => u.status === 'active')
              : umkmList.filter(u => u.dusun_id === currentDusun?.id && u.status === 'active');

            if (filteredUmkm.length === 0) {
              return (
                <div className="umkm-empty-state">
                  <p>Belum ada UMKM aktif {!isDesaView && currentDusun ? `di ${currentDusun.nama}` : 'di Desa Jubelan'}.</p>
                </div>
              );
            }

            return (
              <div className="umkm-grid">
                {filteredUmkm.map(item => {
                  const dusunName = dusunList.find(d => d.id === item.dusun_id)?.nama || 'Jubelan';
                  return (
                    <div key={item.id} className="umkm-card">
                      <div className="umkm-thumb-wrap">
                        <img src={item.foto} alt={item.nama_usaha} className="umkm-thumb" loading="lazy" />
                      </div>
                      <div className="umkm-body">
                        <span className="umkm-category-badge">{item.kategori}</span>
                        <h3 className="umkm-name">{item.nama_usaha}</h3>
                        <p className="umkm-desc">{item.deskripsi}</p>

                        <div className="umkm-meta-row">
                          <span><strong>Pemilik:</strong> {item.pemilik}</span>
                          <span><strong>Dusun:</strong> {dusunName}</span>
                        </div>

                        {/* Contact info: phone & email */}
                        {(item.phone || item.email) && (
                          <div className="umkm-contact-row">
                            {item.phone && (
                              <a
                                href={`https://wa.me/${item.phone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="umkm-contact-item"
                              >
                                <Phone size={12} strokeWidth={2} />
                                <span>{item.phone}</span>
                              </a>
                            )}
                            {item.email && (
                              <a
                                href={`mailto:${item.email}`}
                                className="umkm-contact-item"
                              >
                                <span>✉</span>
                                <span>{item.email}</span>
                              </a>
                            )}
                          </div>
                        )}

                        {item.link_maps && (
                          <a
                            href={item.link_maps}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-umkm-order"
                          >
                            <MapPin size={13} strokeWidth={2} />
                            <span>Buka di Maps ↗</span>
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

        </div>
      </section>

      {/* ================= 8. DOCUMENTS AND ANNOUNCEMENTS ================= */}
      <section id="dokumen" className="village-docs-section">
        <div className="site-container">
          <div className="section-head-row" style={{ marginBottom: 40 }}>
            <div>
              {/* <div className="eyebrow-tag">
                <span className="eyebrow-dot"></span>
                <span>Open government</span>
              </div> */}
              <h2 className="section-head-title">Dokumen Publik & Informasi</h2>
            </div>
          </div>

          <div className="docs-grid-layout">
            {/* Legal Documents List */}
            <div className="legal-docs-panel">
              <div className="docs-list-head">
                <span className="docs-list-title">Dokumen Publik</span>
                <a href="#dokumen" className="docs-archive-link">Lihat arsip lengkap →</a>
              </div>

              <div className="docs-list-items">
                {dokumenList.map(doc => (
                  <div key={doc.id} className="doc-row-card">
                    <div className="doc-info">
                      <span className="doc-name">{doc.nama}</span>
                      <span className="doc-file-badge">{doc.deskripsi} • {doc.ukuran}</span>
                    </div>
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-doc-download"
                      title="Unduh Berkas Dokumen"
                    >
                      <Download size={16} strokeWidth={2} />
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Announcements Panel */}
            <div className="announcements-panel">
              <div className="announcements-head">
                <span className="announcements-title">Pengumuman</span>
                <span className="status-beacon"></span>
              </div>

              {pengumumanList.map(ann => (
                <div key={ann.id} className="announcement-item">
                  <span className="announcement-date">
                    {ann.tanggal} {ann.is_penting && '• PENTING'}
                  </span>
                  <div className="announcement-heading">{ann.judul}</div>
                  <div className="announcement-body">{ann.konten}</div>
                </div>
              ))}

              <div className="office-hours-snippet">
                <div><strong>Jam Pelayanan Balai Desa:</strong></div>
                <div>Senin – Kamis : 08.00 – 14.30 WIB</div>
                <div>Jumat : 08.00 – 11.30 WIB</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 9. VILLAGE FOOTER (1440x410 Desktop / 390x636 Mobile) ================= */}
      <footer className="village-footer">
        <div className="site-container">
          {/* Main Row: Brand + Navigation */}
          <div className="footer-main-row">
            <a href="#beranda" className="village-brand">
              <div className="village-mark">
                <img
                  src="/Logo_Kabupaten_Semarang.svg"
                  alt="Logo Kabupaten Semarang"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>
              <div className="brand-text">
                <span className="village-name">Desa Jubelan</span>
                <span className="village-municipality">Kecamatan Sumowono</span>
              </div>
            </a>

            <div className="footer-nav-links">
              <a href="#tentang" className="footer-nav-link">Tentang Kami</a>
              <a href="#berita" className="footer-nav-link">Berita</a>
              <a href="#peta-desa" className="footer-nav-link">Peta Desa</a>
              <a href="#umkm" className="footer-nav-link">Potensi UMKM</a>
              <a href="#dokumen" className="footer-nav-link">Dokumen Publik</a>
              <button onClick={onOpenAdmin} className="footer-nav-link footer-admin-link">Login Admin</button>
            </div>
          </div>

          {/* Contact Strip Row */}
          <div className="footer-contact-strip">
            <div className="office-address-block">
              <div className="office-title">Kantor Kepala Desa Jubelan</div>
              <div className="office-address">
                Jl. Pangeran Diponegoro No. 36, Jubelan, Kecamatan Sumowono, Kabupaten Semarang (50662)
              </div>
            </div>

            <div className="contact-methods-block">
              <a href="tel:0298713313" className="contact-method-item">
                <span>Telp: (0298) 713313</span>
              </a>
              <a href="mailto:desajubelan04@gmail.com" className="contact-method-item">
                <span>Email: desajubelan04@gmail.com</span>
              </a>
            </div>
          </div>

          {/* Base Row: Copyright & Emergency */}
          <div className="footer-base-row">
            <span>© 2026 Pemerintah Desa Jubelan. Hak Cipta Dilindungi.</span>
            <span className="emergency-hotline">
              Puskesmas Sumowono (0298) 173197
            </span>
          </div>
        </div>
      </footer>

      {/* ================= 10. NEWS DETAIL MODAL ================= */}
      {selectedNews && (
        <div className="modal-overlay" onClick={() => setSelectedNews(null)}>
          <div className="modal-content-box" onClick={e => e.stopPropagation()}>
            <div className="modal-img-wrap">
              <img src={selectedNews.thumbnail} alt={selectedNews.judul} className="modal-img" />
            </div>
            <div className="modal-body">
              <div className="news-metadata">
                <span className="news-category">{selectedNews.kategori}</span>
                <span className="news-date">{selectedNews.tanggal} • {selectedNews.penulis}</span>
              </div>
              <h2 className="modal-story-title">{selectedNews.judul}</h2>
              <div className="modal-story-text">{selectedNews.konten}</div>
              <div className="modal-footer">
                <button className="btn-outline-pill" onClick={() => setSelectedNews(null)}>
                  Tutup Cerita
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
