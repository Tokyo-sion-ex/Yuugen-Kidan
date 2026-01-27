// src/utils/StorageManager.ts の簡略化
export class SimpleStorageManager {
  static async getItem(key: string): Promise<any> {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  }

  static async setItem(key: string, value: any): Promise<void> {
    localStorage.setItem(key, JSON.stringify(value));
  }
}
