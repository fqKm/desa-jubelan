import type { AppConfig } from '../types';

type CollectionName = 'dusun' | 'umkm' | 'berita' | 'dokumen' | 'pengumuman';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const DEFAULT_CACHE_TTL_MS = 60 * 1000; // 1 menit in-memory cache

class DataService {
  // Simpan cache sementara di memori RAM (bukan localStorage)
  private memoryCache = new Map<string, CacheEntry<any>>();

  private currentConfig: AppConfig = {
    mode: 'neon',
    appsScriptUrl: '',
    spreadsheetId: '',
    kepala_desa: 'Bapak Kepala Desa'
  };

  // ──────────────────────────────────────────────────────────
  // IN-MEMORY CACHE HELPERS
  // ──────────────────────────────────────────────────────────
  private getCachedData<T>(key: string, ttlMs = DEFAULT_CACHE_TTL_MS): T | null {
    const entry = this.memoryCache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp < ttlMs) {
      return entry.data;
    }
    this.memoryCache.delete(key);
    return null;
  }

  private setCachedData<T>(key: string, data: T) {
    this.memoryCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  invalidateCache(collection?: CollectionName) {
    if (collection) {
      this.memoryCache.delete(collection);
    } else {
      this.memoryCache.clear();
    }
  }

  // ──────────────────────────────────────────────────────────
  // CONFIG (Database Neon via /api/config)
  // ──────────────────────────────────────────────────────────
  getConfig(): AppConfig {
    return this.currentConfig;
  }

  async loadConfig(forceRefresh = false): Promise<AppConfig> {
    if (!forceRefresh) {
      const cached = this.getCachedData<AppConfig>('config');
      if (cached) return cached;
    }

    try {
      const res = await fetch('/api/config');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.status === 'success' && json.data) {
        this.currentConfig = {
          mode: 'neon',
          appsScriptUrl: '',
          spreadsheetId: '',
          kepala_desa: json.data.kepala_desa ?? 'Bapak Kepala Desa',
          ...json.data
        };
        this.setCachedData('config', this.currentConfig);
        return this.currentConfig;
      }
    } catch (err) {
      console.error('[DataService] Gagal memuat konfigurasi dari database:', err);
    }
    return this.currentConfig;
  }

  async saveConfig(config: AppConfig): Promise<void> {
    this.currentConfig = { ...this.currentConfig, ...config };
    this.invalidateCache('config' as any);

    const res = await fetch('/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kepala_desa: config.kepala_desa ?? '',
        mode: config.mode ?? 'neon'
      })
    });

    if (!res.ok) {
      throw new Error(`Gagal menyimpan konfigurasi ke server (HTTP ${res.status})`);
    }

    const json = await res.json();
    if (json.status !== 'success') {
      throw new Error(json.error ?? 'Gagal menyimpan konfigurasi');
    }
  }

  // ──────────────────────────────────────────────────────────
  // GET COLLECTION (Langsung dari Database via /api/collection)
  // ──────────────────────────────────────────────────────────
  async getCollection<T>(collection: CollectionName, forceRefresh = false): Promise<T[]> {
    if (!forceRefresh) {
      const cached = this.getCachedData<T[]>(collection);
      if (cached) {
        return cached;
      }
    }

    try {
      const res = await fetch(`/api/collection/${collection}`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} saat memuat ${collection}`);
      }
      const json = await res.json();
      if (json.status === 'success' && Array.isArray(json.data)) {
        const list = json.data as T[];
        this.setCachedData(collection, list);
        return list;
      }
      return [];
    } catch (err) {
      console.error(`[DataService] Gagal memuat koleksi ${collection} dari database:`, err);
      return [];
    }
  }

  // ──────────────────────────────────────────────────────────
  // SAVE / UPSERT ITEM (Langsung ke Database)
  // ──────────────────────────────────────────────────────────
  async saveItem<T extends { id?: string }>(collection: CollectionName, item: T): Promise<T> {
    if (!item.id) {
      item.id = `${collection}-${Date.now()}`;
    }

    // Bersihkan cache in-memory agar tampilan langsung terupdate
    this.invalidateCache(collection);

    const res = await fetch(`/api/collection/${collection}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });

    if (!res.ok) {
      throw new Error(`Gagal menyimpan ${collection} ke database (HTTP ${res.status})`);
    }

    const json = await res.json();
    if (json.status === 'success') {
      return item;
    }

    throw new Error(json.error ?? `Gagal menyimpan ${collection}`);
  }

  // ──────────────────────────────────────────────────────────
  // DELETE ITEM (Langsung ke Database)
  // ──────────────────────────────────────────────────────────
  async deleteItem(collection: CollectionName, id: string): Promise<boolean> {
    this.invalidateCache(collection);

    const res = await fetch(`/api/item/${collection}/${id}`, {
      method: 'DELETE'
    });

    if (!res.ok) {
      throw new Error(`Gagal menghapus item dari ${collection} di database (HTTP ${res.status})`);
    }

    const json = await res.json();
    if (json.status === 'success') {
      return true;
    }

    throw new Error(json.error ?? `Gagal menghapus item dari ${collection}`);
  }

  resetAllData() {
    this.memoryCache.clear();
  }
}

export const dataService = new DataService();
