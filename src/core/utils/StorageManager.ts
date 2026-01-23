import { GameRecord } from '../types/game.types';

export class StorageManager {
  private dbName = 'YugenKitanDB';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // ゲーム記録用のオブジェクトストア作成
        if (!db.objectStoreNames.contains('gameRecords')) {
          const store = db.createObjectStore('gameRecords', { keyPath: 'gameId' });
          store.createIndex('byDate', 'startTime');
          store.createIndex('byPlayer', 'players.id');
        }
        
        // 統計データ用のストア
        if (!db.objectStoreNames.contains('playerStats')) {
          db.createObjectStore('playerStats', { keyPath: 'playerId' });
        }
      };
      
      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async saveGameRecord(record: GameRecord): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['gameRecords'], 'readwrite');
      const store = transaction.objectStore('gameRecords');
      
      const request = store.add(record);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getRecentGames(limit: number = 50): Promise<GameRecord[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['gameRecords'], 'readonly');
      const store = transaction.objectStore('gameRecords');
      const index = store.index('byDate');
      
      const request = index.openCursor(null, 'prev'); // 新しい順
      const results: GameRecord[] = [];
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor && results.length < limit) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }
}
