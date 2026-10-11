import type { AppConfig } from '../types';
import { INITIAL_DUSUN, INITIAL_UMKM, INITIAL_BERITA, INITIAL_DOKUMEN, INITIAL_PENGUMUMAN } from './mockData';

// ============================================================
// Mode deteksi: gunakan Neon jika ada VITE_USE_NEON=true di env
// Fallback ke localStorage bila berjalan di local dev tanpa Neon
// ============================================================
const USE_NEON = import.meta.env.VITE_USE_NEON === 'true';
const STORAGE_PREFIX = 'desa_jubelan_';

type CollectionName = 'dusun' | 'umkm' | 'berita' | 'dokumen' | 'pengumuman';

class DataService {
  constructor() {
    if (!USE_NEON) {
      this.initLocalStorage();
    }
  }

  // ──────────────────────────────────────────────────────────
  // LOCAL STORAGE (fallback / offline mode)
  // ──────────────────────────────────────────────────────────
  private initLocalStorage() {
    const storedDusun = localStorage.getItem(STORAGE_PREFIX + 'dusun');
    if (!storedDusun || storedDusun.includes('dusun-1') || storedDusun.includes('Kalitengah') || storedDusun.includes('(Krajan)')) {
      localStorage.setItem(STORAGE_PREFIX + 'dusun', JSON.stringify(INITIAL_DUSUN));
      localStorage.setItem(STORAGE_PREFIX + 'umkm', JSON.stringify(INITIAL_UMKM));
    }
    if (!localStorage.getItem(STORAGE_PREFIX + 'berita'))
      localStorage.setItem(STORAGE_PREFIX + 'berita', JSON.stringify(INITIAL_BERITA));
    if (!localStorage.getItem(STORAGE_PREFIX + 'dokumen'))
      localStorage.setItem(STORAGE_PREFIX + 'dokumen', JSON.stringify(INITIAL_DOKUMEN));
    if (!localStorage.getItem(STORAGE_PREFIX + 'pengumuman'))
      localStorage.setItem(STORAGE_PREFIX + 'pengumuman', JSON.stringify(INITIAL_PENGUMUMAN));
    if (!localStorage.getItem(STORAGE_PREFIX + 'config')) {
      localStorage.setItem(STORAGE_PREFIX + 'config', JSON.stringify({
        mode: 'local',
        appsScriptUrl: '',
        spreadsheetId: '',
        kepala_desa: 'Bapak Kepala Desa'
      }));
    }
  }

  // ──────────────────────────────────────────────────────────
  // CONFIG
  // ──────────────────────────────────────────────────────────
  getConfig(): AppConfig {
    // Returns cached config synchronously — refreshed by loadConfig()
    try {
      const data = localStorage.getItem(STORAGE_PREFIX + 'config');
      const parsed = data ? JSON.parse(data) : {};
      return {
        mode: 'local',
        appsScriptUrl: '',
        spreadsheetId: '',
        kepala_desa: 'Bapak Kepala Desa',
        ...parsed
      };
    } catch {
      return { mode: 'local', appsScriptUrl: '', spreadsheetId: '', kepala_desa: 'Bapak Kepala Desa' };
    }
  }

  async loadConfig(): Promise<AppConfig> {
    if (!USE_NEON) return this.getConfig();

    try {
      const res = await fetch('/api/config');
      const json = await res.json();
      if (json.status === 'success') {
        const cfg: AppConfig = {
          mode: 'neon' as any,
          appsScriptUrl: '',
          spreadsheetId: '',
          kepala_desa: json.data.kepala_desa ?? 'Bapak Kepala Desa',
          ...json.data
        };
        // Cache to localStorage for synchronous getConfig()
        localStorage.setItem(STORAGE_PREFIX + 'config', JSON.stringify(cfg));
        return cfg;
      }
    } catch (err) {
      console.warn('[Neon] Gagal memuat config, menggunakan cache lokal', err);
    }
    return this.getConfig();
  }

  async saveConfig(config: AppConfig) {
    // Always save locally for synchronous getConfig()
    localStorage.setItem(STORAGE_PREFIX + 'config', JSON.stringify(config));

    if (!USE_NEON) return;

    try {
      await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kepala_desa: config.kepala_desa ?? '',
          mode: config.mode ?? 'neon'
        })
      });
    } catch (err) {
      console.warn('[Neon] Gagal menyimpan config', err);
    }
  }

  // ──────────────────────────────────────────────────────────
  // GET COLLECTION
  // ──────────────────────────────────────────────────────────
  async getCollection<T>(collection: CollectionName): Promise<T[]> {
    if (USE_NEON) {
      try {
        const res = await fetch(`/api/collection/${collection}`);
        const json = await res.json();
        if (json.status === 'success' && Array.isArray(json.data)) {
          return json.data as T[];
        }
      } catch (err) {
        console.warn(`[Neon] Gagal memuat ${collection}, fallback ke localStorage`, err);
      }
    }

    // Fallback: localStorage
    const data = localStorage.getItem(STORAGE_PREFIX + collection);
    return data ? JSON.parse(data) : [];
  }

  // ──────────────────────────────────────────────────────────
  // SAVE / UPSERT ITEM
  // ──────────────────────────────────────────────────────────
  async saveItem<T extends { id?: string }>(collection: CollectionName, item: T): Promise<T> {
    if (!item.id) {
      item.id = `${collection}-${Date.now()}`;
    }

    if (USE_NEON) {
      try {
        const res = await fetch(`/api/collection/${collection}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item)
        });
        const json = await res.json();
        if (json.status === 'success') return item;
        throw new Error(json.error ?? 'Unknown error');
      } catch (err) {
        console.warn(`[Neon] Gagal menyimpan item ke ${collection}`, err);
        // Fallback: localStorage
      }
    }

    // localStorage fallback
    const items = await this.getCollection<T>(collection);
    const idx = items.findIndex(x => (x as any).id === item.id);
    if (idx >= 0) {
      items[idx] = { ...items[idx], ...item };
    } else {
      items.unshift(item);
    }
    localStorage.setItem(STORAGE_PREFIX + collection, JSON.stringify(items));

    return item;
  }

  // ──────────────────────────────────────────────────────────
  // DELETE ITEM
  // ──────────────────────────────────────────────────────────
  async deleteItem(collection: CollectionName, id: string): Promise<boolean> {
    if (USE_NEON) {
      try {
        const res = await fetch(`/api/item/${collection}/${id}`, { method: 'DELETE' });
        const json = await res.json();
        if (json.status === 'success') return true;
        throw new Error(json.error ?? 'Unknown error');
      } catch (err) {
        console.warn(`[Neon] Gagal menghapus item ${id} dari ${collection}`, err);
      }
    }

    // localStorage fallback
    let items = await this.getCollection<{ id: string }>(collection);
    items = items.filter(x => x.id !== id);
    localStorage.setItem(STORAGE_PREFIX + collection, JSON.stringify(items));
    return true;
  }

  // ──────────────────────────────────────────────────────────
  // RESET DATA (hanya localStorage)
  // ──────────────────────────────────────────────────────────
  resetAllData() {
    localStorage.setItem(STORAGE_PREFIX + 'dusun', JSON.stringify(INITIAL_DUSUN));
    localStorage.setItem(STORAGE_PREFIX + 'umkm', JSON.stringify(INITIAL_UMKM));
    localStorage.setItem(STORAGE_PREFIX + 'berita', JSON.stringify(INITIAL_BERITA));
    localStorage.setItem(STORAGE_PREFIX + 'dokumen', JSON.stringify(INITIAL_DOKUMEN));
    localStorage.setItem(STORAGE_PREFIX + 'pengumuman', JSON.stringify(INITIAL_PENGUMUMAN));
  }
}

export const dataService = new DataService();
