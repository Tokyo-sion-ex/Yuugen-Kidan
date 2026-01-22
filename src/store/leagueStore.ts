import { create } from 'zustand';
import { PlayerRanking, LeagueRank, Title } from '@/types/league.types';

interface LeagueStore {
  // 状態
  playerRankings: PlayerRanking[];
  currentSeason: number;
  leagueRanks: LeagueRank[];
  availableTitles: Title[];
  playerTitles: string[]; // 獲得済みタイトルID
  
  // アクション
  updateRanking: (playerId: string, gameResult: GameResult) => void;
  getPlayerRanking: (playerId: string) => PlayerRanking | undefined;
  getLeaderboard: (limit?: number) => PlayerRanking[];
  getLeagueRank: (score: number) => LeagueRank;
  unlockTitle: (titleId: string) => void;
  calculateNewScore: (oldScore: number, opponentScores: number[], result: 'win' | 'lose' | 'draw') => number;
}

interface GameResult {
  playerId: string;
  finalScore: number;
  opponentIds: string[];
  opponentScores: number[];
  gameMode: string;
  timestamp: Date;
}

export const useLeagueStore = create<LeagueStore>((set, get) => ({
  playerRankings: [],
  currentSeason: 1,
  leagueRanks: [
    {
      id: 'novice',
      name: '初心者',
      minScore: 0,
      maxScore: 999,
      icon: '🎴',
      color: '#95a5a6',
      rewards: ['title_novice']
    },
    {
      id: 'bronze',
      name: '銅雀',
      minScore: 1000,
      maxScore: 1999,
      icon: '🥉',
      color: '#cd7f32',
      rewards: ['title_bronze_sparrow']
    },
    {
      id: 'silver',
      name: '銀雀',
      minScore: 2000,
      maxScore: 2999,
      icon: '🥈',
      color: '#c0c0c0',
      rewards: ['title_silver_sparrow']
    },
    {
      id: 'gold',
      name: '金雀',
      minScore: 3000,
      maxScore: 3999,
      icon: '🥇',
      color: '#ffd700',
      rewards: ['title_gold_sparrow']
    },
    {
      id: 'platinum',
      name: '白鳳',
      minScore: 4000,
      maxScore: 4999,
      icon: '🕊️',
      color: '#e5e4e2',
      rewards: ['title_white_phoenix']
    },
    {
      id: 'diamond',
      name: '青龍',
      minScore: 5000,
      maxScore: 5999,
      icon: '🐉',
      color: '#b9f2ff',
      rewards: ['title_blue_dragon']
    },
    {
      id: 'master',
      name: '雀聖',
      minScore: 6000,
      maxScore: 6999,
      icon: '👑',
      color: '#ff69b4',
      rewards: ['title_mahjong_saint']
    },
    {
      id: 'grandmaster',
      name: '雀神',
      minScore: 7000,
      maxScore: 9999,
      icon: '🌟',
      color: '#9370db',
      rewards: ['title_mahjong_god']
    }
  ],
  availableTitles: [
    {
      id: 'title_novice',
      name: '新米雀士',
      description: '初めての対戦を終えた',
      rarity: 'common',
      unlockCondition: {
        type: 'totalWins',
        value: 1
      }
    },
    {
      id: 'title_win_streak_3',
      name: '連勝の勢い',
      description: '3連勝を達成',
      rarity: 'rare',
      unlockCondition: {
        type: 'winStreak',
        value: 3
      }
    },
    {
      id: 'title_mangan_master',
      name: '満貫師',
      description: '満貫以上の和了を10回達成',
      rarity: 'epic',
      unlockCondition: {
        type: 'specialAchievement',
        value: 10,
        additionalConditions: {
          achievement: 'mangan_or_higher'
        }
      }
    }
  ],
  playerTitles: [],
  
  updateRanking: (playerId, gameResult) => {
    const { playerRankings, calculateNewScore } = get();
    
    const existingRanking = playerRankings.find(r => r.playerId === playerId);
    const oldScore = existingRanking?.rankScore || 1000;
    
    // 新しいスコアを計算（簡易ELOレーティング）
    const result = gameResult.finalScore > Math.max(...gameResult.opponentScores) 
      ? 'win' 
      : gameResult.finalScore < Math.max(...gameResult.opponentScores)
        ? 'lose'
        : 'draw';
    
    const newScore = calculateNewScore(oldScore, gameResult.opponentScores, result);
    
    const newRanking: PlayerRanking = {
      playerId,
      username: existingRanking?.username || `Player${playerId.slice(-4)}`,
      avatar: existingRanking?.avatar,
      rankScore: newScore,
      leagueRank: get().getLeagueRank(newScore).id,
      position: 0, // 後で計算
      gamesPlayed: (existingRanking?.gamesPlayed || 0) + 1,
      winRate: existingRanking 
        ? ((existingRanking.winRate * existingRanking.gamesPlayed) + (result === 'win' ? 1 : 0)) / (existingRanking.gamesPlayed + 1)
        : result === 'win' ? 1 : 0,
      totalPoints: (existingRanking?.totalPoints || 0) + gameResult.finalScore,
      lastPlayed: gameResult.timestamp
    };
    
    // ランキングを更新
    const updatedRankings = playerRankings
      .filter(r => r.playerId !== playerId)
      .concat(newRanking)
      .sort((a, b) => b.rankScore - a.rankScore)
      .map((ranking, index) => ({
        ...ranking,
        position: index + 1
      }));
    
    set({ playerRankings: updatedRankings });
    
    // タイトル獲得条件をチェック
    get().checkTitleUnlocks(playerId);
  },
  
  getPlayerRanking: (playerId) => {
    return get().playerRankings.find(r => r.playerId === playerId);
  },
  
  getLeaderboard: (limit = 100) => {
    return get().playerRankings.slice(0, limit);
  },
  
  getLeagueRank: (score) => {
    const ranks = get().leagueRanks;
    const rank = ranks.find(r => score >= r.minScore && score <= r.maxScore);
    return rank || ranks[0];
  },
  
  unlockTitle: (titleId) => {
    const { playerTitles } = get();
    if (!playerTitles.includes(titleId)) {
      set({ playerTitles: [...playerTitles, titleId] });
    }
  },
  
  calculateNewScore: (oldScore, opponentScores, result) => {
    // 簡易ELOレーティング計算
    const K = 32; // 変動係数
    
    // 対戦相手の平均レート
    const averageOpponentScore = opponentScores.reduce((a, b) => a + b, 0) / opponentScores.length;
    
    // 期待勝率
    const expectedScore = 1 / (1 + Math.pow(10, (averageOpponentScore - oldScore) / 400));
    
    // 実際の結果（勝利:1, 負け:0, 引き分け:0.5）
    const actualScore = result === 'win' ? 1 : result === 'draw' ? 0.5 : 0;
    
    // 新しいレート
    const newScore = Math.round(oldScore + K * (actualScore - expectedScore));
    
    return Math.max(0, newScore); // マイナスにはならない
  },
  
  checkTitleUnlocks: (playerId) => {
    const { playerRankings, availableTitles, playerTitles, unlockTitle } = get();
    const ranking = playerRankings.find(r => r.playerId === playerId);
    if (!ranking) return;
    
    availableTitles.forEach(title => {
      if (playerTitles.includes(title.id)) return;
      
      let shouldUnlock = false;
      
      switch (title.unlockCondition.type) {
        case 'totalWins':
          shouldUnlock = ranking.gamesPlayed * ranking.winRate >= title.unlockCondition.value;
          break;
        case 'winStreak':
          // TODO: 連勝記録の追跡が必要
          break;
        case 'leagueRank':
          shouldUnlock = ranking.leagueRank === title.unlockCondition.value;
          break;
      }
      
      if (shouldUnlock) {
        unlockTitle(title.id);
      }
    });
  }
}));
