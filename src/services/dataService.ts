import type { AppConfig } from '../types';
import { INITIAL_DUSUN, INITIAL_UMKM, INITIAL_BERITA, INITIAL_DOKUMEN, INITIAL_PENGUMUMAN } from './mockData';

// ============================================================
// Mode deteksi: gunakan Neon jika ada VITE_USE_NEON=true di env
// Fallback ke localStorage bila berjalan di local dev tanpa Neon
// ============================================================
const USE_NEON = import.meta.env.VITE_USE_NEON === 'true';
const STORAGE_PREFIX = 'desa_jubelan_';
const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000; // 5 menit

type CollectionName = 'dusun' | 'umkm' | 'berita' | 'dokumen' | 'pengumuman';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class DataService {
  constructor() {
    if (!USE_NEON) {
      this.initLocalStorage();
    }
  }

  // ──────────────────────────────────────────────────────────
  // CACHE HELPERS
  // ──────────────────────────────────────────────────────────
  private getCacheKey(key: string): string {
    return `${STORAGE_PREFIX}cache_${key}`;
  }

  private getCachedData<T>(key: string, ttlMs = DEFAULT_CACHE_TTL_MS): T | null {
    try {
      const raw = localStorage.getItem(this.getCacheKey(key));
      if (!raw) return null;
      const parsed: CacheEntry<T> = JSON.parse(raw);
      if (Date.now() - parsed.timestamp < ttlMs) {
        return parsed.data;
      }
    } catch {
      // Abaikan jika error parse
    }
    return null;
  }

  private setCachedData<T>(key: string, data: T) {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(this.getCacheKey(key), JSON.stringify(entry));
    } catch (err) {
      console.warn('Gagal menyimpan cache:', err);
    }
  }

  invalidateCache(collection?: CollectionName) {
    if (collection) {
      localStorage.removeItem(this.getCacheKey(collection));
    } else {
      const collections: CollectionName[] = ['dusun', 'umkm', 'berita', 'dokumen', 'pengumuman'];
      collections.forEach(col => localStorage.removeItem(this.getCacheKey(col)));
      localStorage.removeItem(this.getCacheKey('config'));
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

  async loadConfig(forceRefresh = false): Promise<AppConfig> {
    if (!USE_NEON) return this.getConfig();

    // Cek cache config jika tidak forceRefresh
    if (!forceRefresh) {
      const cached = this.getCachedData<AppConfig>('config');
      if (cached) return cached;
    }

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
        // Simpan ke cache & localStorage sync
        this.setCachedData('config', cfg);
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
    this.invalidateCache('config' as any);

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
  // GET COLLECTION (Dengan Caching)
  // ──────────────────────────────────────────────────────────
  async getCollection<T>(collection: CollectionName, forceRefresh = false): Promise<T[]> {
    // 1. Cek cache lokal jika tidak force refresh
    if (!forceRefresh) {
      const cached = this.getCachedData<T[]>(collection);
      if (cached) {
        return cached;
      }
    }

    // 2. Jika Neon aktif, ambil dari server
    if (USE_NEON) {
      try {
        const res = await fetch(`/api/collection/${collection}`);
        const json = await res.json();
        if (json.status === 'success' && Array.isArray(json.data)) {
          const list = json.data as T[];
          this.setCachedData(collection, list);
          localStorage.setItem(STORAGE_PREFIX + collection, JSON.stringify(list));
          return list;
        }
      } catch (err) {
        console.warn(`[Neon] Gagal memuat ${collection}, fallback ke localStorage`, err);
      }
    }

    // 3. Fallback: localStorage
    const data = localStorage.getItem(STORAGE_PREFIX + collection);
    const parsed = data ? JSON.parse(data) : [];
    this.setCachedData(collection, parsed);
    return parsed;
  }

  // ──────────────────────────────────────────────────────────
  // SAVE / UPSERT ITEM (Invalidate Cache)
  // ──────────────────────────────────────────────────────────
  async saveItem<T extends { id?: string }>(collection: CollectionName, item: T): Promise<T> {
    if (!item.id) {
      item.id = `${collection}-${Date.now()}`;
    }

    // Invalidate cache saat ada perubahan data
    this.invalidateCache(collection);

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
    const items = await this.getCollection<T>(collection, true);
    const idx = items.findIndex(x => (x as any).id === item.id);
    if (idx >= 0) {
      items[idx] = { ...items[idx], ...item };
    } else {
      items.unshift(item);
    }
    localStorage.setItem(STORAGE_PREFIX + collection, JSON.stringify(items));
    this.setCachedData(collection, items);

    return item;
  }

  // ──────────────────────────────────────────────────────────
  // DELETE ITEM (Invalidate Cache)
  // ──────────────────────────────────────────────────────────
  async deleteItem(collection: CollectionName, id: string): Promise<boolean> {
    // Invalidate cache saat ada penghapusan data
    this.invalidateCache(collection);

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
    let items = await this.getCollection<{ id: string }>(collection, true);
    items = items.filter(x => x.id !== id);
    localStorage.setItem(STORAGE_PREFIX + collection, JSON.stringify(items));
    this.setCachedData(collection, items);
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
