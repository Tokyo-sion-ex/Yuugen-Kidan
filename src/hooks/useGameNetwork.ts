import { useState, useEffect, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';
import { GameMode } from '../types/game.types';

interface RoomInfo {
  roomId: string;
  players: Array<{
    socketId: string;
    playerId: string;
    name: string;
    isReady: boolean;
  }>;
  gameMode: GameMode;
  isPlaying: boolean;
}

interface GameUpdate {
  gameInfo: any;
  action: string;
  result: any;
}

export const useGameNetwork = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<RoomInfo | null>(null);
  const [roomList, setRoomList] = useState<RoomInfo[]>([]);
  const [chatMessages, setChatMessages] = useState<Array<{
    playerName: string;
    message: string;
    timestamp: string;
  }>>([]);

  // サーバー接続
  const connect = useCallback((serverUrl: string = 'http://localhost:3001') => {
    const newSocket = io(serverUrl);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to server');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      setCurrentRoom(null);
      console.log('Disconnected from server');
    });

    // イベントハンドラー
    newSocket.on('room:updated', (data: { roomInfo: RoomInfo }) => {
      setCurrentRoom(data.roomInfo);
    });

    newSocket.on('game:started', (data: any) => {
      console.log('Game started:', data);
      // ここでゲーム開始処理
    });

    newSocket.on('game:updated', (data: GameUpdate) => {
      console.log('Game updated:', data);
      // ゲーム状態更新処理
    });

    newSocket.on('game:turn', (data: { isYourTurn: boolean; gameInfo: any }) => {
      console.log('Turn update:', data);
      // ターン通知処理
    });

    newSocket.on('chat:message', (data: {
      playerName: string;
      message: string;
      timestamp: string;
    }) => {
      setChatMessages(prev => [...prev, data]);
    });

    newSocket.on('room:player:left', (data: {
      playerId: string;
      playerName: string;
    }) => {
      console.log(`Player left: ${data.playerName}`);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // プレイヤー参加
  const joinAsPlayer = useCallback((name: string) => {
    if (!socket) return;
    socket.emit('player:join', { name });
  }, [socket]);

  // ルーム作成
  const createRoom = useCallback((gameMode: GameMode) => {
    if (!socket) return;
    socket.emit('room:create', { gameMode });
  }, [socket]);

  // ルーム参加
  const joinRoom = useCallback((roomId: string) => {
    if (!socket) return;
    socket.emit('room:join', { roomId });
  }, [socket]);

  // ルーム退出
  const leaveRoom = useCallback(() => {
    if (!socket) return;
    socket.emit('room:leave');
    setCurrentRoom(null);
  }, [socket]);

  // 準備完了
  const setReady = useCallback(() => {
    if (!socket) return;
    socket.emit('game:ready');
  }, [socket]);

  // ゲームアクション送信
  const sendGameAction = useCallback((action: string, tileId?: string, target?: any) => {
    if (!socket) return;
    socket.emit('game:action', { action, tileId, target });
  }, [socket]);

  // チャット送信
  const sendChatMessage = useCallback((message: string) => {
    if (!socket) return;
    socket.emit('chat:message', { message });
  }, [socket]);

  // ルーム一覧取得
  const fetchRoomList = useCallback(() => {
    if (!socket) return;
    socket.emit('room:list', {}, (response: RoomInfo[]) => {
      setRoomList(response);
    });
  }, [socket]);

  // 切断
  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
      setCurrentRoom(null);
    }
  }, [socket]);

  // コンポーネントアンマウント時に切断
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    socket,
    isConnected,
    currentRoom,
    roomList,
    chatMessages,
    connect,
    disconnect,
    joinAsPlayer,
    createRoom,
    joinRoom,
    leaveRoom,
    setReady,
    sendGameAction,
    sendChatMessage,
    fetchRoomList
  };
};
