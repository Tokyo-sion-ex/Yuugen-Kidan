import { create } from 'zustand';
import { SpectatableGame, SpectatorViewState } from '@/types/spectate.types';

interface SpectateStore {
  // 状態
  availableGames: SpectatableGame[];
  currentSpectating: SpectatorViewState | null;
  spectatorCount: Record<string, number>; // gameId -> spectatorCount
  
  // アクション
  fetchAvailableGames: () => Promise<void>;
  joinSpectate: (gameId: string, options?: Partial<SpectatorViewState>) => Promise<boolean>;
  leaveSpectate: () => void;
  updateViewpoint: (viewpoint: SpectatorViewState['viewpoint']) => void;
  followPlayer: (playerId: string) => void;
  toggleAllHands: () => void;
  
  // WebSocket接続
  spectateSocket: WebSocket | null;
  isConnected: boolean;
}

export const useSpectateStore = create<SpectateStore>((set, get) => ({
  availableGames: [],
  currentSpectating: null,
  spectatorCount: {},
  spectateSocket: null,
  isConnected: false,
  
  fetchAvailableGames: async () => {
    try {
      // TODO: バックエンドAPIから取得
      const mockGames: SpectatableGame[] = [
        {
          id: 'spectate_1',
          roomId: 'room_123',
          gameMode: '東風戦',
          players: [
            { playerId: 'p1', username: '雀士A', score: 25000, position: 0, isReady: true },
            { playerId: 'p2', username: '雀士B', score: 25000, position: 1, isReady: true },
            { playerId: 'p3', username: '雀士C', score: 25000, position: 2, isReady: true },
            { playerId: 'p4', username: '雀士D', score: 25000, position: 3, isReady: true }
          ],
          spectators: 12,
          maxSpectators: 50,
          startedAt: new Date(Date.now() - 15 * 60 * 1000),
          currentRound: 2,
          totalRounds: 4,
          isPrivate: false,
          hasPassword: false
        },
        {
          id: 'spectate_2',
          roomId: 'room_456',
          gameMode: '一荘戦',
          players: [
            { playerId: 'p5', username: '上級者X', score: 32000, position: 0, isReady: true },
            { playerId: 'p6', username: '上級者Y', score: 28000, position: 1, isReady: true },
            { playerId: 'p7', username: '上級者Z', score: 25000, position: 2, isReady: true },
            { playerId: 'p8', username: '上級者W', score: 15000, position: 3, isReady: true }
          ],
          spectators: 45,
          maxSpectators: 100,
          startedAt: new Date(Date.now() - 30 * 60 * 1000),
          currentRound: 3,
          totalRounds: 8,
          isPrivate: false,
          hasPassword: false
        }
      ];
      
      set({ availableGames: mockGames });
    } catch (error) {
      console.error('観戦可能なゲームの取得に失敗:', error);
    }
  },
  
  joinSpectate: async (gameId, options) => {
    const { availableGames } = get();
    const game = availableGames.find(g => g.id === gameId);
    
    if (!game) {
      throw new Error('ゲームが見つかりません');
    }
    
    if (game.spectators >= game.maxSpectators) {
      throw new Error('観戦者数が上限に達しています');
    }
    
    if (game.hasPassword) {
      // TODO: パスワード入力モーダル
    }
    
    // WebSocket接続を確立
    try {
      const socket = new WebSocket(`ws://localhost:3000/spectate/${gameId}`);
      
      socket.onopen = () => {
        console.log('観戦接続確立');
        set({ isConnected: true });
      };
      
      socket.onmessage = (event) => {
        // TODO: ゲーム状態の更新を処理
        const data = JSON.parse(event.data);
        console.log('観戦データ受信:', data);
      };
      
      socket.onclose = () => {
        console.log('観戦接続終了');
        set({ isConnected: false, spectateSocket: null });
      };
      
      socket.onerror = (error) => {
        console.error('観戦接続エラー:', error);
        set({ isConnected: false });
      };
      
      const viewState: SpectatorViewState = {
        gameId,
        viewpoint: options?.viewpoint || 'table',
        showAllHands: options?.showAllHands || false,
        chatEnabled: options?.chatEnabled || true,
        delaySeconds: options?.delaySeconds || 0
      };
      
      set({
        currentSpectating: viewState,
        spectateSocket: socket,
        spectatorCount: {
          ...get().spectatorCount,
          [gameId]: (get().spectatorCount[gameId] || 0) + 1
        }
      });
      
      return true;
    } catch (error) {
      console.error('観戦接続に失敗:', error);
      return false;
    }
  },
  
  leaveSpectate: () => {
    const { spectateSocket, currentSpectating } = get();
    
    if (spectateSocket) {
      spectateSocket.close();
    }
    
    if (currentSpectating) {
      const { gameId } = currentSpectating;
      set(state => ({
        currentSpectating: null,
        spectatorCount: {
          ...state.spectatorCount,
          [gameId]: Math.max(0, (state.spectatorCount[gameId] || 0) - 1)
        }
      }));
    }
  },
  
  updateViewpoint: (viewpoint) => {
    const { currentSpectating } = get();
    if (!currentSpectating) return;
    
    set({
      currentSpectating: {
        ...currentSpectating,
        viewpoint
      }
    });
  },
  
  followPlayer: (playerId) => {
    const { currentSpectating } = get();
    if (!currentSpectating) return;
    
    set({
      currentSpectating: {
        ...currentSpectating,
        viewpoint: 'player',
        followingPlayer: playerId
      }
    });
  },
  
  toggleAllHands: () => {
    const { currentSpectating } = get();
    if (!currentSpectating) return;
    
    set({
      currentSpectating: {
        ...currentSpectating,
        showAllHands: !currentSpectating.showAllHands
      }
    });
  }
}));
