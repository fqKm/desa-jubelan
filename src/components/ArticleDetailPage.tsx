import React, { useEffect } from 'react';
import type { Berita } from '../types';
import { ArrowLeft, Share2, Mountain, Clock, Calendar, Bookmark, Heart, Sun, Moon } from 'lucide-react';
import './ArticleDetailPage.css';

interface ArticleDetailPageProps {
  article: Berita;
  allArticles: Berita[];
  onBack: () => void;
  onSelectArticle: (article: Berita) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const ArticleDetailPage: React.FC<ArticleDetailPageProps> = ({
  article,
  allArticles,
  onBack,
  onSelectArticle,
  theme,
  onToggleTheme
}) => {
  // Scroll to top when article opens
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [article.id]);

  // Calculate estimated reading time (~200 words per minute)
  const totalWords = (article.konten || '').split(/\s+/).filter(Boolean).length;
  const readTimeMinutes = Math.max(1, Math.ceil(totalWords / 180));

  // Related articles (excluding current one)
  const related = allArticles
    .filter(a => a.id !== article.id && a.status === 'published')
    .slice(0, 3);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.judul,
          text: article.ringkasan,
          url: window.location.href
        });
      } catch {
        // User cancelled share
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Tautan berita berhasil disalin ke clipboard!');
    }
  };

  // Format paragraphs nicely if user typed multiple lines or raw text
  const paragraphs = (article.konten || '')
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(Boolean);

  return (
    <div className="article-page-wrapper">
      {/* ================= 1. STICKY MINIMAL HEADER ================= */}
      <header className="article-nav-header">
        <div className="article-nav-inner">
          <button className="article-back-btn" onClick={onBack} title="Kembali ke Beranda">
            <ArrowLeft size={18} strokeWidth={2} />
            <span>Kembali ke Desa Jubelan</span>
          </button>

          <a href="#beranda" className="article-brand-link" onClick={onBack}>
            <Mountain size={18} color="var(--site-accent-green, #1b7a48)" />
            <span>Kabar Desa Jubelan</span>
          </a>

          <div className="article-nav-actions">
            <button
              className="article-back-btn"
              onClick={onToggleTheme}
              title={`Ubah ke mode ${theme === 'light' ? 'Gelap' : 'Terang'}`}
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            <button className="btn-article-share" onClick={handleShare}>
              <Share2 size={14} />
              <span>Bagikan</span>
            </button>
          </div>
        </div>
      </header>

      {/* ================= 2. MAIN STORY (MEDIUM STYLE) ================= */}
      <main className="article-container">
        {/* Category Pill */}
        <div className="article-category-badge">
          {article.kategori || 'Kabar Desa'}
        </div>

        {/* Title */}
        <h1 className="article-title">{article.judul}</h1>

        {/* Subtitle / Ringkasan */}
        {article.ringkasan && (
          <p className="article-subtitle">{article.ringkasan}</p>
        )}

        {/* Author & Meta Row */}
        <div className="article-author-row">
          <div className="author-info-left">
            <div className="author-avatar">
              {(article.penulis || 'S').charAt(0).toUpperCase()}
            </div>
            <div className="author-details">
              <span className="author-name">{article.penulis || 'Pemerintah Desa Jubelan'}</span>
              <div className="author-meta">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Calendar size={13} />
                  {article.tanggal}
                </span>
                <span className="meta-dot">·</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={13} />
                  {readTimeMinutes} menit baca
                </span>
              </div>
            </div>
          </div>

          <div className="author-actions-right">
            <button className="btn-article-share" title="Simpan artikel" onClick={() => alert('Artikel disimpan di bacaan Anda')}>
              <Bookmark size={15} />
            </button>
            <button className="btn-article-share" title="Apresiasi cerita" onClick={() => alert('Terima kasih atas apresiasinya!')}>
              <Heart size={15} />
            </button>
          </div>
        </div>

        {/* Lead Thumbnail (Medium Style: Clean single feature image) */}
        {article.thumbnail && (
          <figure className="article-hero-figure">
            <img
              src={article.thumbnail}
              alt={article.judul}
              className="article-hero-img"
            />
            <figcaption className="article-hero-caption">
              Dokumentasi Liputan Desa Jubelan • {article.kategori}
            </figcaption>
          </figure>
        )}

        {/* Article Body Content */}
        <div className="article-body-content">
          {paragraphs.length > 0 ? (
            paragraphs.map((p, idx) => (
              <p key={idx}>{p}</p>
            ))
          ) : (
            <p>{article.konten}</p>
          )}
        </div>

        {/* Article Footer & Tags */}
        <div className="article-footer-box">
          <div className="article-tags-wrap">
            <span className="article-tag-pill">#{article.kategori}</span>
            <span className="article-tag-pill">#DesaJubelan</span>
            <span className="article-tag-pill">#Sumowono</span>
            <span className="article-tag-pill">#KabarWarga</span>
          </div>

          <button className="btn-article-share" onClick={handleShare}>
            <Share2 size={14} />
            <span>Bagikan Berita</span>
          </button>
        </div>
      </main>

      {/* ================= 3. READ NEXT / RELATED STORIES ================= */}
      {related.length > 0 && (
        <section className="related-stories-section">
          <div className="related-stories-inner">
            <h3 className="related-stories-title">Cerita Terkini Lainnya</h3>
            <div className="related-stories-grid">
              {related.map(rel => (
                <article
                  key={rel.id}
                  className="news-card"
                  onClick={() => onSelectArticle(rel)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="news-image-wrap">
                    <img src={rel.thumbnail} alt={rel.judul} className="news-image" loading="lazy" />
                  </div>
                  <div className="news-metadata">
                    <span className="news-category">{rel.kategori}</span>
                    <span className="news-date">{rel.tanggal}</span>
                  </div>
                  <h4 className="news-headline" style={{ fontSize: 18 }}>{rel.judul}</h4>
                  <p className="news-summary-text">{rel.ringkasan}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
