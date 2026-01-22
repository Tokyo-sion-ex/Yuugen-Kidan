import { create } from 'zustand';
import { Tournament, TournamentStatus, TournamentMatch } from '@/types/tournament.types';

interface TournamentStore {
  // 状態
  tournaments: Tournament[];
  currentTournament: Tournament | null;
  registeredTournaments: string[]; // 登録済みトーナメントID
  tournamentMatches: Record<string, TournamentMatch[]>; // tournamentId -> matches
  
  // アクション
  createTournament: (tournamentData: Partial<Tournament>) => Promise<string>;
  joinTournament: (tournamentId: string, playerId: string) => Promise<boolean>;
  leaveTournament: (tournamentId: string, playerId: string) => Promise<void>;
  startTournament: (tournamentId: string) => Promise<void>;
  updateMatchResult: (tournamentId: string, matchId: string, scores: number[], winnerId?: string) => Promise<void>;
  getAvailableTournaments: () => Tournament[];
  getTournamentBracket: (tournamentId: string) => TournamentMatch[][];
  
  // UI状態
  isCreatingTournament: boolean;
  selectedTournamentId: string | null;
}

export const useTournamentStore = create<TournamentStore>((set, get) => ({
  tournaments: [],
  currentTournament: null,
  registeredTournaments: [],
  tournamentMatches: {},
  isCreatingTournament: false,
  selectedTournamentId: null,
  
  createTournament: async (tournamentData) => {
    set({ isCreatingTournament: true });
    
    try {
      const newTournament: Tournament = {
        id: `tournament_${Date.now()}`,
        name: tournamentData.name || '新規大会',
        description: tournamentData.description || '',
        organizer: tournamentData.organizer || 'システム',
        type: tournamentData.type || 'public',
        format: tournamentData.format || 'single_elimination',
        status: 'upcoming',
        maxParticipants: tournamentData.maxParticipants || 16,
        entryFee: tournamentData.entryFee,
        prizePool: tournamentData.prizePool,
        rules: tournamentData.rules || {
          gameMode: '東風戦',
          requiredRounds: 1
        },
        registrationStart: tournamentData.registrationStart || new Date(),
        registrationEnd: tournamentData.registrationEnd || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        tournamentStart: tournamentData.tournamentStart || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        estimatedDuration: tournamentData.estimatedDuration || 120,
        participants: [],
        waitingList: [],
        currentRound: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      set(state => ({
        tournaments: [...state.tournaments, newTournament],
        isCreatingTournament: false
      }));
      
      return newTournament.id;
    } catch (error) {
      set({ isCreatingTournament: false });
      throw error;
    }
  },
  
  joinTournament: async (tournamentId, playerId) => {
    const { tournaments } = get();
    const tournament = tournaments.find(t => t.id === tournamentId);
    
    if (!tournament) {
      throw new Error('トーナメントが見つかりません');
    }
    
    if (tournament.status !== 'registration') {
      throw new Error('登録期間外です');
    }
    
    if (tournament.participants.length >= tournament.maxParticipants) {
      // キャンセル待ちリストに追加
      set(state => ({
        tournaments: state.tournaments.map(t =>
          t.id === tournamentId
            ? { ...t, waitingList: [...t.waitingList, playerId] }
            : t
        )
      }));
      return false;
    }
    
    // 参加者として追加
    set(state => ({
      tournaments: state.tournaments.map(t =>
        t.id === tournamentId
          ? {
              ...t,
              participants: [
                ...t.participants,
                {
                  playerId,
                  username: `Player${playerId.slice(-4)}`, // TODO: 実際のユーザー名を取得
                  joinedAt: new Date(),
                  isReady: false
                }
              ]
            }
          : t
      ),
      registeredTournaments: [...state.registeredTournaments, tournamentId]
    }));
    
    return true;
  },
  
  leaveTournament: async (tournamentId, playerId) => {
    const { tournaments } = get();
    const tournament = tournaments.find(t => t.id === tournamentId);
    
    if (!tournament || tournament.status !== 'registration') {
      throw new Error('退室できません');
    }
    
    // 参加者から削除
    set(state => ({
      tournaments: state.tournaments.map(t =>
        t.id === tournamentId
          ? {
              ...t,
              participants: t.participants.filter(p => p.playerId !== playerId),
              // キャンセル待ちから次の人を追加
              ...(t.waitingList.length > 0 && {
                participants: [
                  ...t.participants.filter(p => p.playerId !== playerId),
                  {
                    playerId: t.waitingList[0],
                    username: `Player${t.waitingList[0].slice(-4)}`,
                    joinedAt: new Date(),
                    isReady: false
                  }
                ],
                waitingList: t.waitingList.slice(1)
              })
            }
          : t
      ),
      registeredTournaments: state.registeredTournaments.filter(id => id !== tournamentId)
    }));
  },
  
  startTournament: async (tournamentId) => {
    const { tournaments } = get();
    const tournament = tournaments.find(t => t.id === tournamentId);
    
    if (!tournament || tournament.participants.length < 4) {
      throw new Error('開始条件を満たしていません');
    }
    
    // シードを設定
    const seededParticipants = [...tournament.participants]
      .map((p, index) => ({ ...p, seed: index + 1 }))
      .sort(() => Math.random() - 0.5); // 暫定的なシャッフル
    
    // トーナメント表を生成
    const matches = generateBracketMatches(seededParticipants, tournament.format);
    
    set(state => ({
      tournaments: state.tournaments.map(t =>
        t.id === tournamentId
          ? {
              ...t,
              status: 'in_progress',
              participants: seededParticipants,
              currentRound: 1,
              updatedAt: new Date()
            }
          : t
      ),
      tournamentMatches: {
        ...state.tournamentMatches,
        [tournamentId]: matches
      }
    }));
  },
  
  updateMatchResult: async (tournamentId, matchId, scores, winnerId) => {
    const { tournamentMatches } = get();
    const matches = tournamentMatches[tournamentId] || [];
    
    const updatedMatches = matches.map(match =>
      match.id === matchId
        ? {
            ...match,
            scores,
            winnerId,
            status: 'completed',
            completedAt: new Date()
          }
        : match
    );
    
    // 次のラウンドのマッチを生成
    if (winnerId) {
      const tournament = get().tournaments.find(t => t.id === tournamentId);
      if (tournament) {
        const nextRoundMatches = generateNextRoundMatches(
          updatedMatches,
          tournament.currentRound,
          tournament.format
        );
        
        if (nextRoundMatches.length > 0) {
          updatedMatches.push(...nextRoundMatches);
          
          set(state => ({
            tournaments: state.tournaments.map(t =>
              t.id === tournamentId
                ? { ...t, currentRound: t.currentRound + 1 }
                : t
            )
          }));
        } else {
          // トーナメント終了
          set(state => ({
            tournaments: state.tournaments.map(t =>
              t.id === tournamentId
                ? { ...t, status: 'completed' }
                : t
            )
          }));
        }
      }
    }
    
    set(state => ({
      tournamentMatches: {
        ...state.tournamentMatches,
        [tournamentId]: updatedMatches
      }
    }));
  },
  
  getAvailableTournaments: () => {
    const { tournaments } = get();
    const now = new Date();
    
    return tournaments.filter(t =>
      (t.status === 'upcoming' || t.status === 'registration') &&
      t.registrationStart <= now &&
      t.registrationEnd >= now
    );
  },
  
  getTournamentBracket: (tournamentId) => {
    const matches = get().tournamentMatches[tournamentId] || [];
    const maxRound = Math.max(...matches.map(m => m.round), 0);
    
    const bracket: TournamentMatch[][] = [];
    for (let round = 1; round <= maxRound; round++) {
      bracket.push(matches.filter(m => m.round === round));
    }
    
    return bracket;
  }
}));

// トーナメント表を生成するヘルパー関数
function generateBracketMatches(participants: any[], format: string): TournamentMatch[] {
  const matches: TournamentMatch[] = [];
  const participantCount = participants.length;
  
  // シングルエリミネーションブラケットの生成
  if (format === 'single_elimination') {
    let currentRound = 1;
    let currentParticipants = [...participants];
    
    while (currentParticipants.length > 1) {
      const roundMatches: TournamentMatch[] = [];
      
      // バイ（2のべき乗）に調整
      let bracketSize = 1;
      while (bracketSize < currentParticipants.length) {
        bracketSize *= 2;
      }
      
      // バイの位置を決定
      const seededParticipants = seedParticipants(currentParticipants, bracketSize);
      
      // マッチを作成
      for (let i = 0; i < seededParticipants.length; i += 2) {
        const match: TournamentMatch = {
          id: `match_${Date.now()}_${i}`,
          round: currentRound,
          matchNumber: i / 2 + 1,
          playerIds: [
            seededParticipants[i]?.playerId || '',
            seededParticipants[i + 1]?.playerId || ''
          ].filter(id => id),
          scores: [],
          status: 'scheduled'
        };
        
        roundMatches.push(match);
      }
      
      matches.push(...roundMatches);
      currentRound++;
      
      // 次のラウンドの参加者（勝者）を仮定
      currentParticipants = roundMatches.map(() => ({ playerId: '' }));
    }
  }
  
  return matches;
}

// 参加者をシードする
function seedParticipants(participants: any[], bracketSize: number): any[] {
  const seeded = new Array(bracketSize).fill(null);
  
  // シード順に配置
  participants.forEach(participant => {
    if (participant.seed) {
      // シードに基づいた位置を計算
      const position = calculateSeedPosition(participant.seed, bracketSize);
      seeded[position] = participant;
    }
  });
  
  // 残りの位置に未シードの参加者をランダムに配置
  const unseededParticipants = participants.filter(p => !p.seed);
  let participantIndex = 0;
  
  for (let i = 0; i < seeded.length; i++) {
    if (!seeded[i]) {
      seeded[i] = unseededParticipants[participantIndex] || null;
      participantIndex++;
    }
  }
  
  return seeded;
}

// シード位置を計算
function calculateSeedPosition(seed: number, bracketSize: number): number {
  // トーナメントブラケットのシード配置アルゴリズム
  if (bracketSize === 2) return seed === 1 ? 0 : 1;
  
  const positions: Record<number, number[]> = {
    1: [0],
    2: [bracketSize - 1],
    3: [bracketSize / 4, bracketSize / 4 * 3],
    4: [bracketSize / 4 * 3, bracketSize / 4],
    // より大きなブラケットの場合は拡張が必要
  };
  
  return positions[seed]?.[0] || Math.floor(Math.random() * bracketSize);
}

// 次のラウンドのマッチを生成
function generateNextRoundMatches(
  completedMatches: TournamentMatch[],
  currentRound: number,
  format: string
): TournamentMatch[] {
  if (format !== 'single_elimination') return [];
  
  const currentRoundMatches = completedMatches.filter(m => m.round === currentRound);
  const allWinners = currentRoundMatches
    .map(m => m.winnerId)
    .filter((id): id is string => !!id);
  
  if (allWinners.length < 2) return [];
  
  const nextRoundMatches: TournamentMatch[] = [];
  
  for (let i = 0; i < allWinners.length; i += 2) {
    const match: TournamentMatch = {
      id: `match_${Date.now()}_${i}`,
      round: currentRound + 1,
      matchNumber: i / 2 + 1,
      playerIds: [allWinners[i], allWinners[i + 1]].filter(id => id),
      scores: [],
      status: 'scheduled'
    };
    
    nextRoundMatches.push(match);
  }
  
  return nextRoundMatches;
}
