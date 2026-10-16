import type { AppConfig } from '../types';

type CollectionName = 'dusun' | 'umkm' | 'berita' | 'dokumen' | 'pengumuman';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const DEFAULT_CACHE_TTL_MS = 60 * 1000; // 1 menit in-memory cache

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

    const url = '/api/config';
    logRequest('GET', url);

    try {
      const res = await fetch(url);
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
    this.invalidateCache('config' as any);

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
  // GET COLLECTION (Langsung dari Database via /api/collection)
  // ──────────────────────────────────────────────────────────
  async getCollection<T>(collection: CollectionName, forceRefresh = false): Promise<T[]> {
    if (!forceRefresh) {
      const cached = this.getCachedData<T[]>(collection);
      if (cached) {
        return cached;
      }
    }

    const url = `/api/collection/${collection}`;
    logRequest('GET', url);

    try {
      const res = await fetch(url);
      const json = await res.json().catch(() => ({}));
      logResponse('GET', url, res.status, json);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} saat memuat ${collection}: ${json.error || res.statusText}`);
      }

      if (json.status === 'success' && Array.isArray(json.data)) {
        const list = json.data as T[];
        this.setCachedData(collection, list);
        return list;
      }
      return [];
    } catch (err: any) {
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
        return item;
      }

      throw new Error(json.error ?? `Gagal menyimpan ${collection}`);
    } catch (err: any) {
      console.error(`[DataService] Gagal menyimpan item ${collection}:`, err);
      throw err;
    }
  }

  // ──────────────────────────────────────────────────────────
  // DELETE ITEM (Langsung ke Database)
  // ──────────────────────────────────────────────────────────
  async deleteItem(collection: CollectionName, id: string): Promise<boolean> {
    this.invalidateCache(collection);

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
        return true;
      }

      throw new Error(json.error ?? `Gagal menghapus item dari ${collection}`);
    } catch (err: any) {
      console.error(`[DataService] Gagal menghapus item ${collection}:`, err);
      throw err;
    }
  }

  resetAllData() {
    this.memoryCache.clear();
  }
}

export const dataService = new DataService();
