export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: 'gameplay' | 'collection' | 'social' | 'skill' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
  
  // 進捗追跡用
  currentProgress: number;
  maxProgress: number;
  isCompleted: boolean;
  completedAt?: Date;
  progressType: 'incremental' | 'binary' | 'series';
  
  // 報酬
  rewards: AchievementReward[];
  
  // 関連実績
  prerequisites?: string[];
  unlocks?: string[];
}

export interface AchievementReward {
  type: 'title' | 'avatar_item' | 'currency' | 'badge' | 'special_effect';
  itemId: string;
  amount?: number;
}

export interface AchievementCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  totalAchievements: number;
  completedAchievements: number;
  totalPoints: number;
  unlockedPoints: number;
}

export interface AchievementSeries {
  id: string;
  name: string;
  description: string;
  achievements: string[];
  reward: AchievementReward;
  completionBonus: number;
}
