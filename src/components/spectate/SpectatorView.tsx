import React, { useState, useEffect } from 'react';
import { useSpectateStore } from '@/store/spectateStore';
import { SpectatableGame } from '@/types/spectate.types';
import { Button } from '@/components/ui/Button';

interface SpectatorViewProps {
  gameId: string;
  onExit: () => void;
}

export const SpectatorView: React.FC<SpectatorViewProps> = ({ gameId, onExit }) => {
  const { 
    currentSpectating, 
    updateViewpoint, 
    followPlayer, 
    toggleAllHands,
    leaveSpectate,
    isConnected 
  } = useSpectateStore();
  
  const [spectatorCount, setSpectatorCount] = useState(0);
  const [gameTime, setGameTime] = useState('00:00');
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  
  // ゲーム情報を取得（実際にはWebSocketから取得）
  const [gameInfo, setGameInfo] = useState<SpectatableGame | null>(null);
  
  useEffect(() => {
    // TODO: WebSocketからゲーム情報を取得
    const mockInfo: SpectatableGame = {
      id: gameId,
      roomId: 'room_123',
      gameMode: '東風戦',
      players: [
        { playerId: 'p1', username: '雀士A', score: 32000, position: 0, isReady: true },
        { playerId: 'p2', username: '雀士B', score: 28000, position: 1, isReady: true },
        { playerId: 'p3', username: '雀士C', score: 21000, position: 2, isReady: true },
        { playerId: 'p4', username: '雀士D', score: 19000, position: 3, isReady: true }
      ],
      spectators: 42,
      maxSpectators: 100,
      startedAt: new Date(Date.now() - 20 * 60 * 1000),
      currentRound: 3,
      totalRounds: 4,
      isPrivate: false,
      hasPassword: false
    };
    
    setGameInfo(mockInfo);
    setSpectatorCount(mockInfo.spectators);
    
    // 経過時間の更新
    const timer = setInterval(() => {
      if (mockInfo.startedAt) {
        const elapsed = Date.now() - mockInfo.startedAt.getTime();
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        setGameTime(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }
    }, 1000);
    
    return () => {
      clearInterval(timer);
      leaveSpectate();
    };
  }, [gameId, leaveSpectate]);
  
  if (!gameInfo || !currentSpectating) {
    return (
      <div className="spectator-loading">
        <p>観戦情報を読み込んでいます...</p>
        {!isConnected && <p className="connection-warning">接続中...</p>}
      </div>
    );
  }
  
  const handleViewpointChange = (viewpoint: 'table' | 'player' | 'god') => {
    updateViewpoint(viewpoint);
    if (viewpoint !== 'player') {
      setSelectedPlayer(null);
    }
  };
  
  const handleFollowPlayer = (playerId: string) => {
    setSelectedPlayer(playerId);
    followPlayer(playerId);
  };
  
  return (
    <div className="spectator-view">
      <div className="spectator-header">
        <div className="game-info">
          <h2>観戦中: {gameInfo.gameMode}</h2>
          <div className="game-stats">
            <span className="stat-item">
              観戦者: {spectatorCount}人
            </span>
            <span className="stat-item">
              経過時間: {gameTime}
            </span>
            <span className="stat-item">
              局: {gameInfo.currentRound}/{gameInfo.totalRounds}
            </span>
          </div>
        </div>
        
        <div className="spectator-controls">
          <div className="viewpoint-controls">
            <span className="control-label">視点:</span>
            <Button
              size="small"
              variant={currentSpectating.viewpoint === 'table' ? 'primary' : 'secondary'}
              onClick={() => handleViewpointChange('table')}
            >
              卓全体
            </Button>
            <Button
              size="small"
              variant={currentSpectating.viewpoint === 'player' ? 'primary' : 'secondary'}
              onClick={() => handleViewpointChange('player')}
            >
              プレイヤー
            </Button>
            <Button
              size="small"
              variant={currentSpectating.viewpoint === 'god' ? 'primary' : 'secondary'}
              onClick={() => handleViewpointChange('god')}
            >
              俯瞰
            </Button>
          </div>
          
          <div className="display-controls">
            <Button
              size="small"
              variant={currentSpectating.showAllHands ? 'primary' : 'secondary'}
              onClick={toggleAllHands}
            >
              {currentSpectating.showAllHands ? '全手牌表示中' : '全手牌を表示'}
            </Button>
            
            <Button
              size="small"
              variant="secondary"
              onClick={onExit}
            >
              観戦を終了
            </Button>
          </div>
        </div>
      </div>
      
      <div className="spectator-main">
        <div className="game-table-container">
          {/* 実際のゲーム卓の表示 */}
          <div className={`game-table viewpoint-${currentSpectating.viewpoint}`}>
            {currentSpectating.viewpoint === 'table' && (
              <>
                <div className="player-north">
                  <div className="player-info">
                    <span className="player-name">{gameInfo.players[0].username}</span>
                    <span className="player-score">{gameInfo.players[0].score.toLocaleString()}</span>
                  </div>
                  {selectedPlayer === 'p1' && <div className="selection-indicator" />}
                </div>
                
                <div className="player-east">
                  <div className="player-info">
                    <span className="player-name">{gameInfo.players[1].username}</span>
                    <span className="player-score">{gameInfo.players[1].score.toLocaleString()}</span>
                  </div>
                  {selectedPlayer === 'p2' && <div className="selection-indicator" />}
                </div>
                
                <div className="player-south">
                  <div className="player-info">
                    <span className="player-name">{gameInfo.players[2].username}</span>
                    <span className="player-score">{gameInfo.players[2].score.toLocaleString()}</span>
                  </div>
                  {selectedPlayer === 'p3' && <div className="selection-indicator" />}
                </div>
                
                <div className="player-west">
                  <div className="player-info">
                    <span className="player-name">{gameInfo.players[3].username}</span>
                    <span className="player-score">{gameInfo.players[3].score.toLocaleString()}</span>
                  </div>
                  {selectedPlayer === 'p4' && <div className="selection-indicator" />}
                </div>
                
                <div className="table-center">
                  <div className="discard-pile">捨て牌表示エリア</div>
                  <div className="wall-display">王牌表示エリア</div>
                </div>
              </>
            )}
            
            {currentSpectating.viewpoint === 'player' && selectedPlayer && (
              <div className="player-focused-view">
                <h3>{gameInfo.players.find(p => p.playerId === selectedPlayer)?.username} の視点</h3>
                <div className="focused-player-hand">
                  {/* 選択されたプレイヤーの手牌表示 */}
                  <p>手牌表示エリア</p>
                </div>
              </div>
            )}
            
            {currentSpectating.viewpoint === 'god' && (
              <div className="god-view">
                <h3>俯瞰視点</h3>
                <div className="all-hands">
                  {gameInfo.players.map(player => (
                    <div key={player.playerId} className="player-hand-summary">
                      <span>{player.username}</span>
                      <span>{player.score.toLocaleString()}</span>
                      {currentSpectating.showAllHands && (
                        <div className="hand-preview">
                          {/* 手牌のプレビュー */}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="spectator-sidebar">
          <div className="players-panel">
            <h3>プレイヤー情報</h3>
            <div className="players-list">
              {gameInfo.players.map(player => (
                <div
                  key={player.playerId}
                  className={`player-card ${selectedPlayer === player.playerId ? 'selected' : ''}`}
                  onClick={() => handleFollowPlayer(player.playerId)}
                >
                  <div className="player-avatar">👤</div>
                  <div className="player-details">
                    <span className="player-name">{player.username}</span>
                    <span className="player-score">{player.score.toLocaleString()}</span>
                  </div>
                  <div className="player-position">
                    席: {['東', '南', '西', '北'][player.position]}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="spectator-chat">
            <h3>観戦者チャット ({spectatorCount})</h3>
            <div className="chat-messages">
              {/* チャットメッセージ表示 */}
              <div className="chat-message">
                <span className="message-user">観戦者A:</span>
                <span className="message-text">いい手ですね！</span>
              </div>
              <div className="chat-message">
                <span className="message-user">観戦者B:</span>
                <span className="message-text">リーチするかな？</span>
              </div>
            </div>
            <div className="chat-input">
              <input type="text" placeholder="チャットを入力..." disabled={!currentSpectating.chatEnabled} />
              <Button size="small" disabled={!currentSpectating.chatEnabled}>送信</Button>
            </div>
          </div>
          
          <div className="spectator-settings">
            <h3>観戦設定</h3>
            <div className="settings-option">
              <label>
                <input 
                  type="checkbox" 
                  checked={currentSpectating.chatEnabled}
                  onChange={() => {}}
                />
                チャットを有効化
              </label>
            </div>
            <div className="settings-option">
              <label>
                表示遅延:
                <select 
                  value={currentSpectating.delaySeconds}
                  onChange={() => {}}
                >
                  <option value="0">リアルタイム</option>
                  <option value="10">10秒遅延</option>
                  <option value="30">30秒遅延</option>
                  <option value="60">60秒遅延</option>
                </select>
              </label>
            </div>
          </div>
        </div>
      </div>
      
      <div className="spectator-footer">
        <div className="connection-status">
          {isConnected ? (
            <span className="connected">接続中</span>
          ) : (
            <span className="disconnected">接続が不安定です</span>
          )}
        </div>
        <div className="current-action">
          {/* 現在のゲームアクション表示 */}
          <span>東家の思考中...</span>
        </div>
      </div>
    </div>
  );
};
