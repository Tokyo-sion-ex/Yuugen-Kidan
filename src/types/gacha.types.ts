export interface GachaBanner {
  id: string;
  name: string;
  description: string;
  type: 'standard' | 'limited' | 'event';
  featuredItems: string[];
  startDate: Date;
  endDate: Date;
  pityCounter: number;
  guaranteedRarity: 'rare' | 'epic' | 'legendary';
  
  // 確率
  rates: {
    common: number;
    rare: number;
    epic: number;
    legendary: number;
  };
  
  // 価格
  cost: {
    single: number; // 単発のコスト（通貨単位）
    multi: number;  // 10連のコスト
    currency: 'gold' | 'premium' | 'event';
  };
  
  // 保証
  guarantees: {
    multiGuarantee: 'rare' | 'epic'; // 10連保証
    pityCount: number; // ピティカウント
    pityRarity: 'epic' | 'legendary'; // ピティ保証レアリティ
  };
}

export interface GachaItem {
  id: string;
  name: string;
  type: 'avatar' | 'effect' | 'title' | 'emote' | 'background' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  bannerId: string; // どのバナーに含まれるか
  isFeatured: boolean;
  rateUp?: number; // 確率アップ倍率
  
  // アイテム情報
  previewImage: string;
  collectionId?: string; // コレクションセットID
  duplicatesConvertTo: number; // 重複時の変換レート
  
  // 効果
  effects?: {
    type: 'avatar_cosmetic' | 'special_animation' | 'score_multiplier' | 'exp_boost';
    value: number;
    duration?: number;
  };
}

export interface GachaResult {
  pullId: string;
  bannerId: string;
  items: GachaItem[];
  timestamp: Date;
  isMulti: boolean;
  pityCounter: number;
  newItems: string[]; // 新規獲得アイテムID
  duplicateItems: string[]; // 重複アイテムID
  pointsEarned: number; // 重複時に獲得するポイント
}

export interface CollectionSet {
  id: string;
  name: string;
  description: string;
  theme: string;
  items: string[]; // GachaItem IDs
  completedReward: GachaItem; // コンプリート報酬
  progress: number; // 獲得済みアイテム数
}
