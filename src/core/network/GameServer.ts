import { Server, Socket } from 'socket.io';
import http from 'http';
import { GameEngine } from '../game/GameEngine';
import { GameMode, Player, Tile } from '../../types/game.types';

interface PlayerSession {
  socketId: string;
  playerId: string;
  name: string;
  isReady: boolean;
}

interface GameRoom {
  roomId: string;
  players: PlayerSession[];
  gameEngine: GameEngine | null;
  gameMode: GameMode;
  isPlaying: boolean;
  settings: {
    maxPlayers: number;
    timeout: number;
  };
}

export class GameServer {
  private io: Server;
  private rooms: Map<string, GameRoom> = new Map();
  private playerRoomMap: Map<string, string> = new Map(); // socketId -> roomId
  private playerNames: Map<string, string> = new Map(); // socketId -> name

  constructor(server: http.Server) {
    this.io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    this.setupSocketHandlers();
    this.startCleanupInterval();
  }

  private setupSocketHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log(`Player connected: ${socket.id}`);

      // プレイヤー接続
      socket.on('player:join', (data: { name: string }) => {
        this.handlePlayerJoin(socket, data.name);
      });

      // ルーム作成
      socket.on('room:create', (data: { gameMode: GameMode }) => {
        this.handleCreateRoom(socket, data.gameMode);
      });

      // ルーム参加
      socket.on('room:join', (data: { roomId: string }) => {
        this.handleJoinRoom(socket, data.roomId);
      });

      // ルーム退出
      socket.on('room:leave', () => {
        this.handleLeaveRoom(socket);
      });

      // 準備完了
      socket.on('game:ready', () => {
        this.handlePlayerReady(socket);
      });

      // ゲームアクション
      socket.on('game:action', (data: {
        action: string;
        tileId?: string;
        target?: any;
      }) => {
        this.handleGameAction(socket, data);
      });

      // チャット
      socket.on('chat:message', (data: { message: string }) => {
        this.handleChatMessage(socket, data.message);
      });

      // 切断
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  private handlePlayerJoin(socket: Socket, name: string): void {
    this.playerNames.set(socket.id, name);
    socket.emit('player:joined', {
      playerId: socket.id,
      name,
      success: true
    });
  }

  private handleCreateRoom(socket: Socket, gameMode: GameMode): void {
    const roomId = this.generateRoomId();
    const playerName = this.playerNames.get(socket.id) || 'Player';
    
    const room: GameRoom = {
      roomId,
      players: [{
        socketId: socket.id,
        playerId: socket.id,
        name: playerName,
        isReady: false
      }],
      gameEngine: null,
      gameMode,
      isPlaying: false,
      settings: {
        maxPlayers: 4,
        timeout: 30000 // 30秒
      }
    };

    this.rooms.set(roomId, room);
    this.playerRoomMap.set(socket.id, roomId);
    
    socket.join(roomId);
    
    socket.emit('room:created', {
      roomId,
      success: true,
      roomInfo: this.getRoomInfo(room)
    });
  }

  private handleJoinRoom(socket: Socket, roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) {
      socket.emit('room:join:error', { message: 'ルームが見つかりません' });
      return;
    }

    if (room.players.length >= room.settings.maxPlayers) {
      socket.emit('room:join:error', { message: 'ルームが満員です' });
      return;
    }

    if (room.isPlaying) {
      socket.emit('room:join:error', { message: 'ゲームが進行中です' });
      return;
    }

    const playerName = this.playerNames.get(socket.id) || 'Player';
    const player: PlayerSession = {
      socketId: socket.id,
      playerId: socket.id,
      name: playerName,
      isReady: false
    };

    room.players.push(player);
    this.playerRoomMap.set(socket.id, roomId);
    socket.join(roomId);

    // 全員に更新を通知
    this.io.to(roomId).emit('room:updated', {
      roomInfo: this.getRoomInfo(room)
    });

    socket.emit('room:joined', {
      roomId,
      success: true,
      roomInfo: this.getRoomInfo(room)
    });
  }

  private handleLeaveRoom(socket: Socket): void {
    const roomId = this.playerRoomMap.get(socket.id);
    if (!roomId) return;

    const room = this.rooms.get(roomId);
    if (!room) return;

    // プレイヤーを削除
    room.players = room.players.filter(p => p.socketId !== socket.id);
    this.playerRoomMap.delete(socket.id);
    socket.leave(roomId);

    if (room.players.length === 0) {
      // ルームが空になったら削除
      this.rooms.delete(roomId);
    } else {
      // 残りのプレイヤーに通知
      this.io.to(roomId).emit('room:updated', {
        roomInfo: this.getRoomInfo(room)
      });

      this.io.to(roomId).emit('room:player:left', {
        playerId: socket.id,
        playerName: this.playerNames.get(socket.id)
      });
    }

    socket.emit('room:left', { success: true });
  }

  private handlePlayerReady(socket: Socket): void {
    const roomId = this.playerRoomMap.get(socket.id);
    if (!roomId) return;

    const room = this.rooms.get(roomId);
    if (!room) return;

    const player = room.players.find(p => p.socketId === socket.id);
    if (!player) return;

    player.isReady = !player.isReady;

    // 全員に通知
    this.io.to(roomId).emit('room:updated', {
      roomInfo: this.getRoomInfo(room)
    });

    // 全員準備完了ならゲーム開始
    if (room.players.length === room.settings.maxPlayers && 
        room.players.every(p => p.isReady)) {
      this.startGame(room);
    }
  }

  private startGame(room: GameRoom): void {
    room.isPlaying = true;
    room.gameEngine = new GameEngine(room.gameMode);

    // プレイヤー情報をゲームエンジンに合わせて更新
    const gameInfo = room.gameEngine.getGameInfo();
    
    room.players.forEach((playerSession, index) => {
      const player = gameInfo.players[index];
      player.name = playerSession.name;
    });

    // 全プレイヤーにゲーム開始を通知
    this.io.to(room.roomId).emit('game:started', {
      gameInfo,
      players: room.players.map((p, index) => ({
        ...p,
        position: gameInfo.players[index].position
      }))
    });

    // 最初のプレイヤーにターン通知
    const currentPlayer = gameInfo.currentPlayer;
    const currentPlayerSocket = room.players.find(
      p => p.name === currentPlayer.name
    )?.socketId;

    if (currentPlayerSocket) {
      this.io.to(currentPlayerSocket).emit('game:turn', {
        isYourTurn: true,
        gameInfo
      });
    }
  }

  private handleGameAction(socket: Socket, data: {
    action: string;
    tileId?: string;
    target?: any;
  }): void {
    const roomId = this.playerRoomMap.get(socket.id);
    if (!roomId) return;

    const room = this.rooms.get(roomId);
    if (!room || !room.gameEngine) return;

    // ゲームエンジンでアクションを処理
    let result: any = null;
    switch (data.action) {
      case 'draw':
        result = room.gameEngine.drawTile();
        break;
      case 'discard':
        if (data.tileId) {
          result = room.gameEngine.discardTile(data.tileId);
        }
        break;
      case 'riichi':
        result = room.gameEngine.declareRiichi();
        break;
      case 'pon':
      case 'chi':
      case 'kan':
        // 鳴き処理
        break;
      case 'ron':
      case 'tsumo':
        // 和了処理
        break;
    }

    if (result) {
      const gameInfo = room.gameEngine.getGameInfo();
      
      // 全員にゲーム状態を通知
      this.io.to(roomId).emit('game:updated', {
        gameInfo,
        action: data.action,
        result
      });

      // 次のターンのプレイヤーに通知
      const currentPlayer = gameInfo.currentPlayer;
      room.players.forEach(player => {
        const isYourTurn = player.name === currentPlayer.name;
        this.io.to(player.socketId).emit('game:turn', {
          isYourTurn,
          gameInfo
        });
      });
    }
  }

  private handleChatMessage(socket: Socket, message: string): void {
    const roomId = this.playerRoomMap.get(socket.id);
    if (!roomId) return;

    const playerName = this.playerNames.get(socket.id) || 'Unknown';
    
    this.io.to(roomId).emit('chat:message', {
      playerId: socket.id,
      playerName,
      message,
      timestamp: new Date().toISOString()
    });
  }

  private handleDisconnect(socket: Socket): void {
    console.log(`Player disconnected: ${socket.id}`);
    this.handleLeaveRoom(socket);
    this.playerNames.delete(socket.id);
  }

  private generateRoomId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private getRoomInfo(room: GameRoom): any {
    return {
      roomId: room.roomId,
      players: room.players,
      gameMode: room.gameMode,
      isPlaying: room.isPlaying,
      settings: room.settings,
      createdAt: new Date().toISOString()
    };
  }

  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanupEmptyRooms();
    }, 60000); // 1分ごとにクリーンアップ
  }

  private cleanupEmptyRooms(): void {
    for (const [roomId, room] of this.rooms) {
      if (room.players.length === 0) {
        this.rooms.delete(roomId);
        console.log(`Cleaned up empty room: ${roomId}`);
      }
    }
  }

  // 公開メソッド
  public getRoomList(): Array<{
    roomId: string;
    playerCount: number;
    gameMode: GameMode;
    isPlaying: boolean;
  }> {
    return Array.from(this.rooms.values()).map(room => ({
      roomId: room.roomId,
      playerCount: room.players.length,
      gameMode: room.gameMode,
      isPlaying: room.isPlaying
    }));
  }

  public getRoomDetails(roomId: string): any | null {
    const room = this.rooms.get(roomId);
    return room ? this.getRoomInfo(room) : null;
  }
}
