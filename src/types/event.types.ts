export interface SeasonalEvent {
  id: string;
  name: string;
  description: string;
  season: 'spring' | 'summer' | 'autumn' | 'winter' | 'special';
  year: number;
  
  // 期間
  startDate: Date;
  endDate: Date;
  
  // イベント内容
  type: 'tournament' | 'collectathon' | 'challenge' | 'story' | 'collaboration';
  mainObjective: string;
  rewards: EventReward[];
  
  // 進行状況
  progress: number;
  maxProgress: number;
  isCompleted: boolean;
  completedAt?: Date;
  
  // 関連コンテンツ
  specialRules?: string[];
  exclusiveItems: string[];
  eventShop?: EventShop;
  
  // ストーリー要素
  storyChapters?: EventStoryChapter[];
  cutscenes?: string[];
}

export interface EventReward {
  id: string;
  name: string;
  type: 'item' | 'currency' | 'title' | 'avatar' | 'special';
  requirement: number; // 必要ポイント
  isClaimed: boolean;
  claimedAt?: Date;
}

export interface EventShop {
  id: string;
  name: string;
  currency: string; // イベント専用通貨
  items: EventShopItem[];
  refreshRate: 'daily' | 'weekly' | 'event';
  lastRefreshed: Date;
}

export interface EventShopItem {
  id: string;
  name: string;
  type: string;
  price: number;
  stock: number; // -1 = 無制限
  purchaseLimit?: number;
  purchases: number; // 現在の購入数
}

export interface EventStoryChapter {
  id: string;
  title: string;
  description: string;
  unlockRequirement: number; // 必要ポイント
  isUnlocked: boolean;
  isRead: boolean;
  content: string;
  voiceActing?: string; // 音声ファイルパス
}

export interface EventLeaderboard {
  eventId: string;
  entries: EventLeaderboardEntry[];
  lastUpdated: Date;
}

export interface EventLeaderboardEntry {
  playerId: string;
  username: string;
  avatar: string;
  points: number;
  rank: number;
  lastActivity: Date;
}
