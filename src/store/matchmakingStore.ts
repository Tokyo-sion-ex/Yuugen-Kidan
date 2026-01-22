import { create } from 'zustand';
import { 
  MatchmakingStatus, 
  MatchmakingPreferences, 
  MatchResult,
  RoomSettings 
} from '@/types/matchmaking.types';

interface MatchmakingStore {
  // 状態
  status: MatchmakingStatus;
  preferences: MatchmakingPreferences;
  currentMatch: MatchResult | null;
  queuePosition: number | null;
  estimatedWaitTime: number | null;
  
  // カスタムルーム
  customRooms: RoomSettings[];
  currentRoom: RoomSettings | null;
  
  // アクション
  startMatchmaking: (preferences?: Partial<MatchmakingPreferences>) => Promise<void>;
  cancelMatchmaking: () => Promise<void>;
  createCustomRoom: (settings: RoomSettings) => Promise<string>;
  joinCustomRoom: (roomId: string, password?: string) => Promise<boolean>;
  leaveRoom: () => Promise<void>;
  updatePreferences: (preferences: Partial<MatchmakingPreferences>) => void;
  readyCheck: (isReady: boolean) => Promise<void>;
  
  // WebSocket接続
  matchmakingSocket: WebSocket | null;
  isConnected: boolean;
  error: string | null;
}

export const useMatchmakingStore = create<MatchmakingStore>((set, get) => ({
  status: 'idle',
  preferences: {
    gameMode: 'quick',
    roomType: 'public',
    allowAI: true,
    region: 'jp'
  },
  currentMatch: null,
  queuePosition: null,
  estimatedWaitTime: null,
  customRooms: [],
  currentRoom: null,
  matchmakingSocket: null,
  isConnected: false,
  error: null,
  
  startMatchmaking: async (customPreferences) => {
    const { preferences, status } = get();
    
    if (status === 'searching') {
      console.log('既にマッチメイキング中です');
      return;
    }
    
    const finalPreferences = {
      ...preferences,
      ...customPreferences
    };
    
    set({ 
      status: 'searching',
      preferences: finalPreferences,
      error: null 
    });
    
    try {
      // WebSocket接続を確立
      const socket = new WebSocket('ws://localhost:3000/matchmaking');
      
      socket.onopen = () => {
        console.log('マッチメイキング接続確立');
        set({ isConnected: true });
        
        // マッチメイキング開始リクエストを送信
        socket.send(JSON.stringify({
          type: 'START_MATCHMAKING',
          preferences: finalPreferences,
          playerId: 'current-player' // TODO: 実際のプレイヤーID
        }));
      };
      
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'QUEUE_UPDATE':
              set({
                queuePosition: data.position,
                estimatedWaitTime: data.estimatedWaitTime
              });
              break;
              
            case 'MATCH_FOUND':
              const matchResult: MatchResult = {
                matchId: data.matchId,
                roomId: data.roomId,
                players: data.players,
                gameMode: data.gameMode,
                serverRegion: data.serverRegion,
                matchFoundAt: new Date()
              };
              
              set({
                status: 'matched',
                currentMatch: matchResult,
                queuePosition: null,
                estimatedWaitTime: null
              });
              break;
              
            case 'PLAYER_READY_UPDATE':
              // プレイヤーの準備状態を更新
              set(state => ({
                currentMatch: state.currentMatch ? {
                  ...state.currentMatch,
                  players: state.currentMatch.players.map(player =>
                    player.playerId === data.playerId
                      ? { ...player, isReady: data.isReady }
                      : player
                  )
                } : null
              }));
              break;
              
            case 'MATCH_CANCELLED':
              set({
                status: 'idle',
                currentMatch: null,
                error: data.reason || 'マッチがキャンセルされました'
              });
              break;
              
            case 'ERROR':
              set({
                status: 'error',
                error: data.message
              });
              break;
          }
        } catch (error) {
          console.error('メッセージ解析エラー:', error);
        }
      };
      
      socket.onclose = () => {
        console.log('マッチメイキング接続終了');
        set({ 
          isConnected: false, 
          matchmakingSocket: null,
          status: 'idle' 
        });
      };
      
      socket.onerror = (error) => {
        console.error('マッチメイキング接続エラー:', error);
        set({ 
          isConnected: false, 
          status: 'error',
          error: '接続エラーが発生しました'
        });
      };
      
      set({ matchmakingSocket: socket });
      
    } catch (error) {
      console.error('マッチメイキング開始エラー:', error);
      set({ 
        status: 'error',
        error: 'マッチメイキングの開始に失敗しました'
      });
    }
  },
  
  cancelMatchmaking: async () => {
    const { matchmakingSocket, status } = get();
    
    if (status !== 'searching' || !matchmakingSocket) {
      return;
    }
    
    try {
      matchmakingSocket.send(JSON.stringify({
        type: 'CANCEL_MATCHMAKING'
      }));
      
      matchmakingSocket.close();
      
      set({
        status: 'idle',
        queuePosition: null,
        estimatedWaitTime: null,
        matchmakingSocket: null,
        isConnected: false
      });
      
    } catch (error) {
      console.error('マッチメイキングキャンセルエラー:', error);
      set({ error: 'キャンセルに失敗しました' });
    }
  },
  
  createCustomRoom: async (settings) => {
    try {
      const response = await fetch('/api/rooms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      
      if (!response.ok) {
        throw new Error('ルーム作成に失敗しました');
      }
      
      const data = await response.json();
      const newRoom = { ...settings, roomId: data.roomId };
      
      set(state => ({
        customRooms: [...state.customRooms, newRoom],
        currentRoom: newRoom
      }));
      
      return data.roomId;
      
    } catch (error) {
      console.error('ルーム作成エラー:', error);
      set({ error: 'ルームの作成に失敗しました' });
      throw error;
    }
  },
  
  joinCustomRoom: async (roomId, password) => {
    try {
      const response = await fetch('/api/rooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, password })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '参加に失敗しました');
      }
      
      const roomData = await response.json();
      
      set({
        currentRoom: roomData,
        status: 'matched'
      });
      
      return true;
      
    } catch (error) {
      console.error('ルーム参加エラー:', error);
      set({ 
        error: error instanceof Error ? error.message : '参加に失敗しました'
      });
      return false;
    }
  },
  
  leaveRoom: async () => {
    const { currentRoom } = get();
    
    if (!currentRoom) return;
    
    try {
      await fetch('/api/rooms/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: currentRoom.roomId })
      });
      
      set({
        currentRoom: null,
        status: 'idle'
      });
      
    } catch (error) {
      console.error('ルーム退出エラー:', error);
    }
  },
  
  updatePreferences: (newPreferences) => {
    set(state => ({
      preferences: {
        ...state.preferences,
        ...newPreferences
      }
    }));
  },
  
  readyCheck: async (isReady) => {
    const { matchmakingSocket, currentMatch } = get();
    
    if (!matchmakingSocket || !currentMatch) return;
    
    try {
      matchmakingSocket.send(JSON.stringify({
        type: 'PLAYER_READY',
        matchId: currentMatch.matchId,
        isReady
      }));
      
    } catch (error) {
      console.error('準備状態送信エラー:', error);
    }
  }
}));
