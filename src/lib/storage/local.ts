export function generateToken(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

export interface StorageAPI {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
  clear(): void;
}

class LocalStorageAPI implements StorageAPI {
  private prefix: string;

  constructor(prefix: string = 'ai-model-app') {
    this.prefix = prefix;
  }

  private getKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  get<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const data = localStorage.getItem(this.getKey(key));
      if (data) {
        return JSON.parse(data) as T;
      }
    } catch (e) {
      console.error(`[LocalStorage] Failed to get ${key}:`, e);
    }
    return null;
  }

  set<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(this.getKey(key), JSON.stringify(value));
    } catch (e) {
      console.error(`[LocalStorage] Failed to set ${key}:`, e);
    }
  }

  remove(key: string): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(this.getKey(key));
    } catch (e) {
      console.error(`[LocalStorage] Failed to remove ${key}:`, e);
    }
  }

  clear(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(`${this.prefix}:`)) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.error('[LocalStorage] Failed to clear:', e);
    }
  }
}

export const localStorageAPI = new LocalStorageAPI();
