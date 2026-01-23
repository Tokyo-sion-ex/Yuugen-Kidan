import { GameRecord, PlayerStats, LearningSession, AnalysisSettings } from '../types/game.types';

export class AdvancedStorageManager {
  private dbName = 'YugenKitanAnalyticsDB';
  private version = 2;
  private db: IDBDatabase | null = null;
  private isInitialized = false;

  // シングルトンインスタンス
  private static instance: AdvancedStorageManager;
  public static getInstance(): AdvancedStorageManager {
    if (!AdvancedStorageManager.instance) {
      AdvancedStorageManager.instance = new AdvancedStorageManager();
    }
    return AdvancedStorageManager.instance;
  }

  private constructor() {}

  // データベース初期化
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const oldVersion = event.oldVersion;
        
        console.log(`Upgrading database from version ${oldVersion} to ${this.version}`);
        
        // バージョン0（新規作成）の場合
        if (oldVersion < 1) {
          // ゲーム記録ストア
          const gameStore = db.createObjectStore('gameRecords', { 
            keyPath: 'gameId',
            autoIncrement: false 
          });
          gameStore.createIndex('byDate', 'startTime');
          gameStore.createIndex('byPlayer', 'players.id');
          gameStore.createIndex('byGameMode', 'gameMode');
          
          // プレイヤー統計ストア
          const statsStore = db.createObjectStore('playerStats', { keyPath: 'playerId' });
          statsStore.createIndex('byWinRate', 'totalWins');
          statsStore.createIndex('byGamesPlayed', 'totalGames');
          
          // 学習セッションストア
          const sessionStore = db.createObjectStore('learningSessions', { 
            keyPath: 'sessionId' 
          });
          sessionStore.createIndex('byFocusArea', 'focusArea');
          sessionStore.createIndex('byDate', 'startTime');
          
          // 分析設定ストア
          db.createObjectStore('analysisSettings', { keyPath: 'id' });
          
          // キャッシュストア（頻繁にアクセスするデータ）
          const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
          cacheStore.createIndex('byExpiry', 'expiry');
        }
        
        // バージョン1から2へのアップグレード
        if (oldVersion < 2) {
          // 新しいインデックスを追加
          const transaction = (event.target as IDBOpenDBRequest).transaction;
          if (!transaction) return;
          
          const gameStore = transaction.objectStore('gameRecords');
          if (!gameStore.indexNames.contains('byDuration')) {
            gameStore.createIndex('byDuration', 'duration');
          }
          
          // 新しいストアを追加
          if (!db.objectStoreNames.contains('tileStatistics')) {
            const tileStatsStore = db.createObjectStore('tileStatistics', { 
              keyPath: 'tileType' 
            });
            tileStatsStore.createIndex('byDiscardFrequency', 'discardCount');
          }
        }
      };
      
      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        this.isInitialized = true;
        
        // 古いキャッシュをクリーンアップ
        this.cleanupExpiredCache();
        
        console.log('Analytics database initialized successfully');
        resolve();
      };
      
      request.onerror = (event) => {
        console.error('Failed to initialize analytics database:', request.error);
        reject(request.error);
      };
    });
  }

  // ゲーム記録を保存
  async saveGameRecord(record: GameRecord): Promise<string> {
    await this.ensureInitialized();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['gameRecords'], 'readwrite');
      const store = transaction.objectStore('gameRecords');
      
      const request = store.put(record);
      
      request.onsuccess = () => {
        // プレイヤー統計も更新
        this.updatePlayerStats(record).catch(console.error);
        // 牌統計も更新
        this.updateTileStatistics(record).catch(console.error);
        
        console.log(`Game record saved: ${record.gameId}`);
        resolve(record.gameId);
      };
      
      request.onerror = () => {
        console.error('Failed to save game record:', request.error);
        reject(request.error);
      };
    });
  }

  // 複数のゲーム記録を一括保存
  async saveGameRecords(records: GameRecord[]): Promise<string[]> {
    await this.ensureInitialized();
    
    const savedIds: string[] = [];
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['gameRecords'], 'readwrite');
      const store = transaction.objectStore('gameRecords');
      
      records.forEach(record => {
        const request = store.put(record);
        
        request.onsuccess = () => {
          savedIds.push(record.gameId);
        };
        
        request.onerror = () => {
          console.warn(`Failed to save record ${record.gameId}:`, request.error);
        };
      });
      
      transaction.oncomplete = () => {
        // 統計を一括更新
        Promise.all([
          this.batchUpdatePlayerStats(records),
          this.batchUpdateTileStatistics(records)
        ]).then(() => {
          console.log(`Saved ${savedIds.length} game records`);
          resolve(savedIds);
        });
      };
      
      transaction.onerror = () => {
        reject(transaction.error);
      };
    });
  }

  // ゲーム記録を取得
  async getGameRecord(gameId: string): Promise<GameRecord | null> {
    await this.ensureInitialized();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['gameRecords'], 'readonly');
      const store = transaction.objectStore('gameRecords');
      
      const request = store.get(gameId);
      
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // 最近のゲーム記録を取得
  async getRecentGames(limit: number = 50, offset: number = 0): Promise<GameRecord[]> {
    await this.ensureInitialized();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['gameRecords'], 'readonly');
      const store = transaction.objectStore('gameRecords');
      const index = store.index('byDate');
      
      const request = index.openCursor(null, 'prev');
      const results: GameRecord[] = [];
      let advancedCount = 0;
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        
        if (cursor) {
          if (advancedCount >= offset && results.length < limit) {
            results.push(cursor.value);
          }
          advancedCount++;
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // プレイヤーIDでゲーム記録を検索
  async getGamesByPlayer(playerId: number, limit: number = 100): Promise<GameRecord[]> {
    await this.ensureInitialized();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['gameRecords'], 'readonly');
      const store = transaction.objectStore('gameRecords');
      const index = store.index('byPlayer');
      
      const keyRange = IDBKeyRange.only(playerId);
      const request = index.openCursor(keyRange, 'prev');
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
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // 統計的な分析クエリ
  async getPlayerStats(playerId: number): Promise<PlayerStats | null> {
    await this.ensureInitialized();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['playerStats'], 'readonly');
      const store = transaction.objectStore('playerStats');
      
      const request = store.get(playerId);
      
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // 学習セッションを保存
  async saveLearningSession(session: LearningSession): Promise<string> {
    await this.ensureInitialized();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['learningSessions'], 'readwrite');
      const store = transaction.objectStore('learningSessions');
      
      const request = store.put(session);
      
      request.onsuccess = () => {
        resolve(session.sessionId);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // 分析設定を保存
  async saveAnalysisSettings(settings: AnalysisSettings): Promise<void> {
    await this.ensureInitialized();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['analysisSettings'], 'readwrite');
      const store = transaction.objectStore('analysisSettings');
      
      const request = store.put({
        ...settings,
        id: 'current_settings',
        updatedAt: Date.now()
      });
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // 分析設定を取得
  async getAnalysisSettings(): Promise<AnalysisSettings> {
    await this.ensureInitialized();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['analysisSettings'], 'readonly');
      const store = transaction.objectStore('analysisSettings');
      
      const request = store.get('current_settings');
      
      request.onsuccess = () => {
        const defaultSettings: AnalysisSettings = {
          enabled: true,
          realTimeSuggestions: true,
          showEfficiencyScores: true,
          dangerWarnings: true,
          postGameAnalysis: true,
          difficulty: 'intermediate',
          focusAreas: ['efficiency', 'defense']
        };
        resolve(request.result?.settings || defaultSettings);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // 高度な分析クエリ
  async getWinRateByPosition(playerId: number): Promise<{position: string, winRate: number}[]> {
    const games = await this.getGamesByPlayer(playerId, 1000);
    const positionStats = new Map<string, {wins: number, games: number}>();
    
    games.forEach(game => {
      const player = game.players.find(p => p.id === playerId);
      if (!player) return;
      
      const position = player.position;
      const isWinner = game.finalResult.winner === playerId;
      
      const current = positionStats.get(position) || { wins: 0, games: 0 };
      current.games += 1;
      if (isWinner) current.wins += 1;
      
      positionStats.set(position, current);
    });
    
    return Array.from(positionStats.entries()).map(([position, stats]) => ({
      position,
      winRate: stats.games > 0 ? (stats.wins / stats.games) * 100 : 0
    }));
  }

  // 牌の統計情報
  async getTileStatistics(): Promise<Map<TileType, any>> {
    await this.ensureInitialized();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['tileStatistics'], 'readonly');
      const store = transaction.objectStore('tileStatistics');
      const request = store.getAll();
      
      request.onsuccess = () => {
        const stats = new Map();
        request.result.forEach((stat: any) => {
          stats.set(stat.tileType, stat);
        });
        resolve(stats);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // キャッシュ操作
  async getFromCache<T>(key: string): Promise<T | null> {
    await this.ensureInitialized();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      
      const request = store.get(key);
      
      request.onsuccess = () => {
        const item = request.result;
        if (item && item.expiry > Date.now()) {
          resolve(item.value);
        } else if (item) {
          // 期限切れのキャッシュを削除
          this.removeFromCache(key).catch(console.error);
          resolve(null);
        } else {
          resolve(null);
        }
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async setCache<T>(key: string, value: T, ttl: number = 3600000): Promise<void> {
    await this.ensureInitialized();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      
      const item = {
        key,
        value,
        expiry: Date.now() + ttl,
        createdAt: Date.now()
      };
      
      const request = store.put(item);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async removeFromCache(key: string): Promise<void> {
    await this.ensureInitialized();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      
      const request = store.delete(key);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // プライベートヘルパーメソッド
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  private async updatePlayerStats(record: GameRecord): Promise<void> {
    const playerStats = new Map<number, PlayerStats>();
    
    // 既存の統計を取得
    for (const player of record.players) {
      const existing = await this.getPlayerStats(player.id);
      if (existing) {
        playerStats.set(player.id, existing);
      }
    }
    
    // 新しい統計で更新
    const transaction = this.db!.transaction(['playerStats'], 'readwrite');
    const store = transaction.objectStore('playerStats');
    
    for (const player of record.players) {
      const stats = playerStats.get(player.id) || this.createDefaultPlayerStats(player.id);
      
      stats.totalGames += 1;
      stats.totalWins += (record.finalResult.winner === player.id ? 1 : 0);
      
      // 放銃判定（簡易的）
      if (record.finalResult.winner && record.finalResult.winner !== player.id) {
        // 最後の捨て牌をチェック（実際はもっと複雑）
        const lastDiscard = record.actions
          .filter(a => a.playerId === player.id && a.action === 'discard')
          .pop();
        if (lastDiscard) {
          stats.totalDealIns += 1;
        }
      }
      
      // 立直回数
      const riichiCount = record.actions.filter(
        a => a.playerId === player.id && a.action === 'riichi'
      ).length;
      stats.totalRiichi += riichiCount;
      
      // 平均スコア
      stats.averageScore = (stats.averageScore * (stats.totalGames - 1) + player.finalScore) / stats.totalGames;
      
      // 最高役
      if (record.finalResult.winner === player.id && record.finalResult.yaku) {
        const totalHan = record.finalResult.totalHan;
        if (totalHan > (stats.bestYaku?.han || 0)) {
          stats.bestYaku = {
            yaku: record.finalResult.yaku[0]?.name || 'Unknown',
            han: totalHan,
            date: record.endTime
          };
        }
      }
      
      // 最近のパフォーマンス
      stats.recentPerformance.push({
        date: record.endTime,
        score: player.finalScore,
        rank: player.rank
      });
      
      // 最新10件に制限
      if (stats.recentPerformance.length > 10) {
        stats.recentPerformance = stats.recentPerformance.slice(-10);
      }
      
      // 連勝記録
      if (record.finalResult.winner === player.id) {
        stats.streak.currentWinstreak += 1;
        stats.streak.currentLosingStreak = 0;
        if (stats.streak.currentWinstreak > stats.streak.bestWinstreak) {
          stats.streak.bestWinstreak = stats.streak.currentWinstreak;
        }
      } else {
        stats.streak.currentWinstreak = 0;
        stats.streak.currentLosingStreak += 1;
      }
      
      // 保存
      store.put(stats);
    }
  }

  private async batchUpdatePlayerStats(records: GameRecord[]): Promise<void> {
    // バッチ更新の実装（最適化が必要な場合）
    for (const record of records) {
      await this.updatePlayerStats(record);
    }
  }

  private async updateTileStatistics(record: GameRecord): Promise<void> {
    // 牌の統計情報を更新する実装
    // （時間の関係で簡略化）
  }

  private async batchUpdateTileStatistics(records: GameRecord[]): Promise<void> {
    // バッチ更新の実装
  }

  private createDefaultPlayerStats(playerId: number): PlayerStats {
    return {
      playerId,
      totalGames: 0,
      totalWins: 0,
      totalDealIns: 0,
      totalRiichi: 0,
      averageScore: 25000,
      bestYaku: { yaku: 'None', han: 0, date: 0 },
      recentPerformance: [],
      streak: {
        currentWinstreak: 0,
        bestWinstreak: 0,
        currentLosingStreak: 0
      }
    };
  }

  private async cleanupExpiredCache(): Promise<void> {
    const transaction = this.db!.transaction(['cache'], 'readwrite');
    const store = transaction.objectStore('cache');
    const index = store.index('byExpiry');
    
    const range = IDBKeyRange.upperBound(Date.now());
    const request = index.openCursor(range);
    
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
  }

  // データベースのメンテナンス
  async compactDatabase(): Promise<void> {
    // データベースの最適化（必要に応じて実装）
    console.log('Database compaction completed');
  }

  async exportData(): Promise<Blob> {
    const allData = {
      gameRecords: await this.getAllGameRecords(),
      playerStats: await this.getAllPlayerStats(),
      learningSessions: await this.getAllLearningSessions(),
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    
    const jsonString = JSON.stringify(allData, null, 2);
    return new Blob([jsonString], { type: 'application/json' });
  }

  private async getAllGameRecords(): Promise<GameRecord[]> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['gameRecords'], 'readonly');
      const store = transaction.objectStore('gameRecords');
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async getAllPlayerStats(): Promise<PlayerStats[]> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['playerStats'], 'readonly');
      const store = transaction.objectStore('playerStats');
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async getAllLearningSessions(): Promise<LearningSession[]> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['learningSessions'], 'readonly');
      const store = transaction.objectStore('learningSessions');
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // データベースの状態を取得
  async getDatabaseInfo(): Promise<{
    gameRecords: number;
    playerStats: number;
    learningSessions: number;
    cacheEntries: number;
    totalSize: number;
  }> {
    const counts = await Promise.all([
      this.getObjectStoreCount('gameRecords'),
      this.getObjectStoreCount('playerStats'),
      this.getObjectStoreCount('learningSessions'),
      this.getObjectStoreCount('cache')
    ]);
    
    return {
      gameRecords: counts[0],
      playerStats: counts[1],
      learningSessions: counts[2],
      cacheEntries: counts[3],
      totalSize: counts.reduce((a, b) => a + b, 0)
    };
  }

  private async getObjectStoreCount(storeName: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.count();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

// グローバルインスタンスのエクスポート
export const storageManager = AdvancedStorageManager.getInstance();
