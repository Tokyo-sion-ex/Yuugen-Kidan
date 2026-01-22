export interface LeagueRank {
  id: string;
  name: string;
  minScore: number;
  maxScore: number;
  icon: string;
  color: string;
  rewards: string[];
}

export interface PlayerRanking {
  playerId: string;
  username: string;
  avatar?: string;
  rankScore: number;
  leagueRank: string;
  position: number;
  gamesPlayed: number;
  winRate: number;
  totalPoints: number;
  lastPlayed: Date;
}

export interface Title {
  id: string;
  name: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockCondition: {
    type: 'winStreak' | 'totalWins' | 'specialAchievement' | 'leagueRank';
    value: number;
    additionalConditions?: Record<string, any>;
  };
  effect?: {
    type: 'scoreBonus' | 'avatarEffect' | 'specialEmote';
    value: number;
  };
}
