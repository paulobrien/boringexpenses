import { supabase } from './supabase';

// Simple offline storage using IndexedDB
class OfflineDatabase {
  private dbName = 'boringexpenses-offline';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create expenses store
        if (!db.objectStoreNames.contains('expenses')) {
          const expensesStore = db.createObjectStore('expenses', { keyPath: 'id' });
          expensesStore.createIndex('user_id', 'user_id', { unique: false });
          expensesStore.createIndex('_pending_upload', '_pending_upload', { unique: false });
        }

        // Create claims store
        if (!db.objectStoreNames.contains('claims')) {
          const claimsStore = db.createObjectStore('claims', { keyPath: 'id' });
          claimsStore.createIndex('user_id', 'user_id', { unique: false });
        }

        // Create categories store
        if (!db.objectStoreNames.contains('expense_categories')) {
          const categoriesStore = db.createObjectStore('expense_categories', { keyPath: 'id' });
          categoriesStore.createIndex('company_id', 'company_id', { unique: false });
        }
      };
    });
  }

  async put(storeName: string, data: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async get(storeName: string, key: string): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async getAll(storeName: string, indexName?: string, indexValue?: any): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      
      let request: IDBRequest;
      if (indexName && indexValue !== undefined) {
        const index = store.index(indexName);
        request = index.getAll(indexValue);
      } else {
        request = store.getAll();
      }
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  async delete(storeName: string, key: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getAllPending(): Promise<any[]> {
    return this.getAll('expenses', '_pending_upload', true);
  }

  async syncToSupabase(): Promise<void> {
    if (!navigator.onLine) return;

    try {
      const pendingExpenses = await this.getAllPending();
      
      for (const expense of pendingExpenses) {
        try {
          // Remove internal fields before uploading
          const { _pending_upload, _synced, ...expenseData } = expense;
          
          const { error } = await supabase
            .from('expenses')
            .upsert(expenseData);

          if (!error) {
            // Mark as synced
            await this.put('expenses', {
              ...expense,
              _pending_upload: false,
              _synced: true
            });
          }
        } catch (error) {
          console.error('Error uploading expense:', error);
        }
      }
    } catch (error) {
      console.error('Sync error:', error);
    }
  }
}

// Create and export the offline database instance
export const createOfflineDatabase = async () => {
  const db = new OfflineDatabase();
  await db.init();
  
  // Set up periodic sync
  setInterval(() => {
    if (navigator.onLine) {
      db.syncToSupabase();
    }
  }, 30000); // Try every 30 seconds when online
  
  // Also try immediately when coming online
  window.addEventListener('online', () => {
    db.syncToSupabase();
  });
  
  return db;
};

export type OfflineDB = Awaited<ReturnType<typeof createOfflineDatabase>>;