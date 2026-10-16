import React, { useState } from 'react';
import type { Berita } from '../types';
import { ArrowLeft, Image as ImageIcon, Send } from 'lucide-react';
import './MediumEditor.css';

interface MediumEditorProps {
  initialItem?: Berita | null;
  onSave: (berita: Partial<Berita>) => Promise<void>;
  onClose: () => void;
}

export const MediumEditor: React.FC<MediumEditorProps> = ({
  initialItem,
  onSave,
  onClose
}) => {
  const [judul, setJudul] = useState(initialItem?.judul || '');
  const [ringkasan, setRingkasan] = useState(initialItem?.ringkasan || '');
  const [konten, setKonten] = useState(initialItem?.konten || '');
  const [thumbnail, setThumbnail] = useState(
    initialItem?.thumbnail || ''
  );
  const [kategori, setKategori] = useState(initialItem?.kategori || 'Pemerintahan');
  const [penulis, setPenulis] = useState(initialItem?.penulis || 'Sekretariat Desa');
  const [tanggal, setTanggal] = useState(
    initialItem?.tanggal || new Date().toISOString().split('T')[0]
  );
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const words = konten.trim() ? konten.trim().split(/\s+/).length : 0;

  // Handle image file upload to Vercel Blob (with base64 Data URL fallback)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to base64 Data URL so image persists in localStorage even without server
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setThumbnail(reader.result);
      }
    };
    reader.readAsDataURL(file);

    setUploading(true);
    console.groupCollapsed(
      `%c[UPLOAD REQUEST] POST /api/upload (Berita)`,
      'color: #9333ea; font-weight: bold; background: #faf5ff; padding: 2px 6px; border-radius: 4px;'
    );
    console.log('File:', file.name, `(${file.size} bytes)`, file.type);
    console.groupEnd();

    try {
      const uploadUrl = `/api/upload?filename=${encodeURIComponent(file.name)}`;
      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Content-Type': file.type || 'application/octet-stream'
        },
        body: file
      });
      const data = await res.json().catch(() => ({}));

      console.groupCollapsed(
        `%c[UPLOAD RESPONSE ${res.status}] POST /api/upload (Berita)`,
        res.ok ? 'color: #16a34a; font-weight: bold;' : 'color: #dc2626; font-weight: bold;'
      );
      console.log('Response:', data);
      console.groupEnd();

      if (res.ok && data.url) {
        setThumbnail(data.url);
      } else {
        alert('Gagal upload thumbnail ke Blob: ' + (data.error || `HTTP ${res.status}`));
      }
    } catch (err: any) {
      console.error('[MediumEditor] Upload error:', err);
      // Keep base64 data URL if /api/upload endpoint is not available yet
    } finally {
      setUploading(false);
    }
  };

  const handlePublish = async (status: 'published' | 'draft') => {
    if (!judul.trim()) {
      alert('Mohon isi judul cerita sebelum menyimpan.');
      return;
    }
    if (!konten.trim()) {
      alert('Mohon tulis isi konten berita.');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        id: initialItem?.id,
        judul,
        kategori,
        penulis,
        tanggal,
        ringkasan: ringkasan || judul.slice(0, 100),
        konten,
        thumbnail,
        status
      });
      onClose();
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan berita.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="medium-editor-overlay">
      {/* Top Navigation Bar */}
      <div className="medium-editor-topbar">
        <div className="medium-editor-left">
          <button className="btn-editor-back" onClick={onClose} disabled={saving}>
            <ArrowLeft size={16} />
            <span>Kembali ke Panel Admin</span>
          </button>
          <span className="editor-status-indicator">
            {initialItem ? 'Sedang mengedit naskah' : 'Draf naskah baru'}
          </span>
        </div>

        <div className="medium-editor-right">
          <button
            type="button"
            className="btn-medium-draft"
            onClick={() => handlePublish('draft')}
            disabled={saving}
          >
            Simpan sebagai Draf
          </button>

          <button
            type="button"
            className="btn-medium-publish"
            onClick={() => handlePublish('published')}
            disabled={saving}
          >
            {saving ? (
              <span>Menyimpan...</span>
            ) : (
              <>
                <Send size={14} />
                <span>Publikasikan Sekarang</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor Canvas */}
      <div className="medium-editor-canvas">
        {/* Story Metadata Strip */}
        <div className="editor-meta-strip">
          <div className="meta-field-group">
            <span className="meta-field-label">Kategori:</span>
            <select
              className="meta-field-select"
              value={kategori}
              onChange={e => setKategori(e.target.value)}
            >
              <option value="Pemerintahan">Pemerintahan</option>
              <option value="Pertanian">Pertanian</option>
              <option value="Kegiatan Warga">Kegiatan Warga</option>
              <option value="Pembangunan">Pembangunan</option>
              <option value="Pemberdayaan">Pemberdayaan</option>
              <option value="Pariwisata">Pariwisata & Budaya</option>
            </select>
          </div>

          <div className="meta-field-group">
            <span className="meta-field-label">Penulis:</span>
            <input
              type="text"
              className="meta-field-input"
              value={penulis}
              onChange={e => setPenulis(e.target.value)}
              placeholder="Nama penulis / redaksi"
            />
          </div>

          <div className="meta-field-group">
            <span className="meta-field-label">Tanggal:</span>
            <input
              type="date"
              className="meta-field-input"
              value={tanggal}
              onChange={e => setTanggal(e.target.value)}
            />
          </div>
        </div>

        {/* Thumbnail Manager Section */}
        <div className="thumbnail-manager-box">
          <div className="thumbnail-header-row">
            <div className="thumbnail-title">
              <ImageIcon size={16} />
              <span>Gambar Utama</span>
            </div>
            {uploading && (
              <span className="thumbnail-notice-pill">Mengunggah...</span>
            )}
          </div>

          <div className="thumbnail-input-row">
            <label className="thumbnail-upload-label">
              <input
                type="file"
                accept="image/*"
                className="thumbnail-file-input"
                onChange={handleImageUpload}
                disabled={uploading}
              />
              <span className="thumbnail-upload-btn">
                <ImageIcon size={14} />
                {uploading ? 'Mengunggah...' : thumbnail ? 'Ganti Gambar' : 'Pilih Gambar'}
              </span>
              {thumbnail && (
                <span className="thumbnail-upload-filename">
                  {thumbnail.startsWith('blob:') ? 'Pratinjau lokal' : 'Tersimpan ✓'}
                </span>
              )}
            </label>
          </div>

          {thumbnail && (
            <div className="thumbnail-preview-wrap">
              <img
                src={thumbnail}
                alt="Pratinjau Thumbnail"
                className="thumbnail-preview-img"
                onError={e => {
                  (e.currentTarget as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800';
                }}
              />
            </div>
          )}
        </div>

        {/* Distraction-Free Medium Title */}
        <textarea
          rows={1}
          className="medium-title-input"
          placeholder="Judul Berita..."
          value={judul}
          onChange={e => {
            setJudul(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
          }}
        />

        {/* Medium Subtitle / Ringkasan */}
        <textarea
          rows={2}
          className="medium-subtitle-input"
          placeholder="Tulis sub-judul atau ringkasan cerita (opsional)..."
          value={ringkasan}
          onChange={e => {
            setRingkasan(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
          }}
        />

        {/* Medium Body Editor (Pure Text, No inline image attachment) */}
        <textarea
          className="medium-content-textarea"
          placeholder="Tulis cerita desa Anda di sini... Gunakan baris baru untuk paragraf terpisah layaknya di Medium."
          value={konten}
          onChange={e => setKonten(e.target.value)}
        />
      </div>

      {/* Floating Word Counter */}
      <div className="editor-word-count">
        {words} kata • {Math.max(1, Math.ceil(words / 180))} menit baca
      </div>
    </div>
  );
};
