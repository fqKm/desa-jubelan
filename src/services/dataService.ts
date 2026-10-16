import type { AppConfig } from '../types';

type CollectionName = 'dusun' | 'umkm' | 'berita' | 'dokumen' | 'pengumuman';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_STORAGE_PREFIX = 'desa_jubelan_cache_';
const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000; // 5 menit cache

// Helper untuk visual logging request & response di Console Browser
function logRequest(method: string, url: string, payload?: any) {
  console.groupCollapsed(
    `%c[API REQUEST] ${method} ${url}`,
    'color: #2563eb; font-weight: bold; background: #eff6ff; padding: 2px 6px; border-radius: 4px;'
  );
  if (payload !== undefined) {
    console.log('Payload:', payload);
  }
  console.log('Timestamp:', new Date().toLocaleTimeString());
  console.groupEnd();
}

function logResponse(method: string, url: string, status: number, data?: any) {
  const isSuccess = status >= 200 && status < 300;
  console.groupCollapsed(
    `%c[API RESPONSE ${status}] ${method} ${url}`,
    isSuccess
      ? 'color: #16a34a; font-weight: bold; background: #f0fdf4; padding: 2px 6px; border-radius: 4px;'
      : 'color: #dc2626; font-weight: bold; background: #fef2f2; padding: 2px 6px; border-radius: 4px;'
  );
  console.log('Status HTTP:', status);
  console.log('Data:', data);
  console.log('Timestamp:', new Date().toLocaleTimeString());
  console.groupEnd();
}

class DataService {
  // Layer 1: In-Memory RAM Cache (akses instan 0ms)
  private memoryCache = new Map<string, CacheEntry<any>>();

  private currentConfig: AppConfig = {
    mode: 'neon',
    appsScriptUrl: '',
    spreadsheetId: '',
    kepala_desa: 'Bapak Kepala Desa'
  };

  // ──────────────────────────────────────────────────────────
  // DUAL CACHE HELPERS (Memory + SessionStorage)
  // ──────────────────────────────────────────────────────────
  private getCachedData<T>(key: string, ttlMs = DEFAULT_CACHE_TTL_MS): T | null {
    // 1. Cek memory RAM
    const mem = this.memoryCache.get(key);
    if (mem && Date.now() - mem.timestamp < ttlMs) {
      return mem.data;
    }

    // 2. Cek sessionStorage (agar bertahan saat F5 / browser reload)
    try {
      const stored = sessionStorage.getItem(CACHE_STORAGE_PREFIX + key);
      if (stored) {
        const parsed: CacheEntry<T> = JSON.parse(stored);
        if (Date.now() - parsed.timestamp < ttlMs) {
          this.memoryCache.set(key, parsed);
          return parsed.data;
        } else {
          sessionStorage.removeItem(CACHE_STORAGE_PREFIX + key);
        }
      }
    } catch {}

    this.memoryCache.delete(key);
    return null;
  }

  private setCachedData<T>(key: string, data: T) {
    const entry: CacheEntry<T> = { data, timestamp: Date.now() };
    this.memoryCache.set(key, entry);
    try {
      sessionStorage.setItem(CACHE_STORAGE_PREFIX + key, JSON.stringify(entry));
    } catch {}
  }

  // Update item di cache secara instan (Write-Through)
  private updateCachedItem<T extends { id?: string }>(collection: CollectionName, item: T) {
    const current = this.getCachedData<T[]>(collection) || [];
    const index = current.findIndex(x => x.id === item.id);
    let updated: T[];
    if (index >= 0) {
      updated = [...current];
      updated[index] = { ...updated[index], ...item };
    } else {
      updated = [item, ...current];
    }
    this.setCachedData(collection, updated);
  }

  // Hapus item dari cache secara instan (Write-Through)
  private removeCachedItem<T extends { id?: string }>(collection: CollectionName, id: string) {
    const current = this.getCachedData<T[]>(collection);
    if (current && Array.isArray(current)) {
      const updated = current.filter(x => x.id !== id);
      this.setCachedData(collection, updated);
    }
  }

  invalidateCache(collection?: CollectionName) {
    if (collection) {
      this.memoryCache.delete(collection);
      try {
        sessionStorage.removeItem(CACHE_STORAGE_PREFIX + collection);
      } catch {}
    } else {
      this.memoryCache.clear();
      try {
        Object.keys(sessionStorage).forEach(k => {
          if (k.startsWith(CACHE_STORAGE_PREFIX)) sessionStorage.removeItem(k);
        });
      } catch {}
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

    const url = forceRefresh ? `/api/config?_t=${Date.now()}` : '/api/config';
    logRequest('GET', url);

    try {
      const res = await fetch(url, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      const json = await res.json().catch(() => ({}));
      logResponse('GET', url, res.status, json);

      if (!res.ok) throw new Error(`HTTP ${res.status}: ${json.error || res.statusText}`);

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
    } catch (err: any) {
      console.error('[DataService] Gagal memuat konfigurasi dari database:', err);
    }
    return this.currentConfig;
  }

  async saveConfig(config: AppConfig): Promise<void> {
    this.currentConfig = { ...this.currentConfig, ...config };
    this.setCachedData('config', this.currentConfig);

    const url = '/api/config';
    const payload = {
      kepala_desa: config.kepala_desa ?? '',
      mode: config.mode ?? 'neon'
    };

    logRequest('PUT', url, payload);

    try {
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json().catch(() => ({}));
      logResponse('PUT', url, res.status, json);

      if (!res.ok) {
        throw new Error(json.error || `HTTP ${res.status}`);
      }

      if (json.status !== 'success') {
        throw new Error(json.error ?? 'Gagal menyimpan konfigurasi');
      }
    } catch (err: any) {
      console.error('[DataService] Gagal menyimpan config:', err);
      throw err;
    }
  }

  // ──────────────────────────────────────────────────────────
  // GET COLLECTION (Cache-First: Ambil cache dulu, jika kosong ke DB)
  // ──────────────────────────────────────────────────────────
  async getCollection<T>(collection: CollectionName, forceRefresh = false): Promise<T[]> {
    // 1. Cek cache terlebih dahulu (jika bukan force refresh)
    if (!forceRefresh) {
      const cached = this.getCachedData<T[]>(collection);
      if (cached && Array.isArray(cached) && cached.length > 0) {
        console.log(`%c[CACHE HIT] ${collection} (${cached.length} items)`, 'color: #059669; font-weight: bold;');
        return cached;
      }
    }

    // 2. Jika cache kosong atau forceRefresh = true, baru request ke Database
    const url = forceRefresh 
      ? `/api/collection/${collection}?_t=${Date.now()}` 
      : `/api/collection/${collection}`;
    logRequest('GET (DB)', url);

    try {
      const res = await fetch(url, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      const json = await res.json().catch(() => ({}));
      logResponse('GET (DB)', url, res.status, json);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} saat memuat ${collection}: ${json.error || res.statusText}`);
      }

      if (json.status === 'success' && Array.isArray(json.data)) {
        const list = json.data as T[];
        // Simpan ke cache seketika
        this.setCachedData(collection, list);
        return list;
      }
      return [];
    } catch (err: any) {
      console.error(`[DataService] Gagal memuat koleksi ${collection} dari database:`, err);
      // Fallback data cache jika koneksi DB bermasalah
      return this.getCachedData<T[]>(collection) || [];
    }
  }

  // ──────────────────────────────────────────────────────────
  // SAVE / UPSERT ITEM (Write-Through: Simpan ke DB & Update Cache)
  // ──────────────────────────────────────────────────────────
  async saveItem<T extends { id?: string }>(collection: CollectionName, item: T): Promise<T> {
    if (!item.id) {
      item.id = `${collection}-${Date.now()}`;
    }

    const url = `/api/collection/${collection}`;
    logRequest('POST', url, item);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });

      const json = await res.json().catch(() => ({}));
      logResponse('POST', url, res.status, json);

      if (!res.ok) {
        throw new Error(json.error || `HTTP ${res.status}: Gagal menyimpan ${collection}`);
      }

      if (json.status === 'success') {
        // Update cache seketika (tanpa perlu reload dari database)
        this.updateCachedItem(collection, item);
        return item;
      }

      throw new Error(json.error ?? `Gagal menyimpan ${collection}`);
    } catch (err: any) {
      console.error(`[DataService] Gagal menyimpan item ${collection}:`, err);
      throw err;
    }
  }

  // ──────────────────────────────────────────────────────────
  // DELETE ITEM (Write-Through: Hapus dari DB & Hapus dari Cache)
  // ──────────────────────────────────────────────────────────
  async deleteItem(collection: CollectionName, id: string): Promise<boolean> {
    const url = `/api/item/${collection}/${id}`;
    logRequest('DELETE', url, { id });

    try {
      const res = await fetch(url, {
        method: 'DELETE'
      });

      const json = await res.json().catch(() => ({}));
      logResponse('DELETE', url, res.status, json);

      if (!res.ok) {
        throw new Error(json.error || `HTTP ${res.status}: Gagal menghapus item dari ${collection}`);
      }

      if (json.status === 'success') {
        // Hapus item dari cache seketika
        this.removeCachedItem(collection, id);
        return true;
      }

      throw new Error(json.error ?? `Gagal menghapus item dari ${collection}`);
    } catch (err: any) {
      console.error(`[DataService] Gagal menghapus item ${collection}:`, err);
      throw err;
    }
  }

  resetAllData() {
    this.invalidateCache();
  }
}

export const dataService = new DataService();
