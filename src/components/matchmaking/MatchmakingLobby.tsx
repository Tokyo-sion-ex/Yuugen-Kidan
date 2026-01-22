import React, { useState, useEffect } from 'react';
import { useMatchmakingStore } from '@/store/matchmakingStore';
import { GameMode, RoomType } from '@/types/matchmaking.types';
import { Button } from '@/components/ui/Button';
import { RoomBrowser } from './RoomBrowser';

export const MatchmakingLobby: React.FC = () => {
  const {
    status,
    preferences,
    queuePosition,
    estimatedWaitTime,
    currentMatch,
    startMatchmaking,
    cancelMatchmaking,
    updatePreferences,
    readyCheck,
    error
  } = useMatchmakingStore();
  
  const [showRoomBrowser, setShowRoomBrowser] = useState(false);
  const [selectedGameMode, setSelectedGameMode] = useState<GameMode>(preferences.gameMode);
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType>(preferences.roomType);
  
  const gameModes: { id: GameMode; name: string; description: string }[] = [
    { id: 'quick', name: 'クイックマッチ', description: '早く対戦したい方に' },
    { id: 'ranked', name: 'ランクマッチ', description: '段位を競いたい方に' },
    { id: 'friendly', name: 'フレンドリーマッチ', description: '気軽に対戦したい方に' },
    { id: 'tournament', name: '大会マッチ', description: '大会参加用' }
  ];
  
  const roomTypes: { id: RoomType; name: string }[] = [
    { id: 'public', name: '公開ルーム' },
    { id: 'private', name: 'プライベートルーム' },
    { id: 'friends_only', name: 'フレンドのみ' }
  ];
  
  const handleStartMatchmaking = () => {
    updatePreferences({
      gameMode: selectedGameMode,
      roomType: selectedRoomType
    });
    
    startMatchmaking();
  };
  
  const handleReadyCheck = (isReady: boolean) => {
    readyCheck(isReady);
  };
  
  // マッチング中のUI
  if (status === 'searching') {
    return (
      <div className="matchmaking-lobby searching">
        <div className="searching-header">
          <h2>対戦相手を検索中...</h2>
          <Button onClick={cancelMatchmaking} variant="secondary">
            キャンセル
          </Button>
        </div>
        
        <div className="searching-info">
          <div className="queue-info">
            <div className="queue-position">
              <span className="label">順位待ち:</span>
              <span className="value">
                {queuePosition !== null ? `#${queuePosition}` : '計算中...'}
              </span>
            </div>
            
            <div className="wait-time">
              <span className="label">推定待ち時間:</span>
              <span className="value">
                {estimatedWaitTime !== null 
                  ? `${Math.ceil(estimatedWaitTime / 60)}分` 
                  : '計算中...'}
              </span>
            </div>
          </div>
          
          <div className="searching-animation">
            <div className="spinner" />
            <div className="pulse-dots">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
            </div>
          </div>
          
          <div className="search-tips">
            <h4>検索を早くするヒント:</h4>
            <ul>
              <li>ランク制限を解除する</li>
              <li>AIプレイヤーを許可する</li>
              <li>全地域で検索する</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }
  
  // マッチ成立時のUI
  if (status === 'matched' && currentMatch) {
    return (
      <div className="matchmaking-lobby matched">
        <div className="matched-header">
          <h2>対戦相手が見つかりました！</h2>
          <p>ゲームモード: {currentMatch.gameMode}</p>
        </div>
        
        <div className="matched-players">
          <h3>プレイヤー</h3>
          <div className="players-grid">
            {currentMatch.players.map(player => (
              <div key={player.playerId} className="player-card">
                <div className="player-avatar">
                  {player.avatar ? (
                    <img src={player.avatar} alt={player.username} />
                  ) : (
                    <span>👤</span>
                  )}
                </div>
                <div className="player-info">
                  <span className="player-name">{player.username}</span>
                  <span className="player-rank">{player.rank}</span>
                </div>
                <div className="player-status">
                  {player.isReady ? (
                    <span className="status-ready">準備完了</span>
                  ) : (
                    <span className="status-waiting">準備中...</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="ready-check">
          <h3>準備はいいですか？</h3>
          <div className="ready-buttons">
            <Button 
              onClick={() => handleReadyCheck(true)}
              variant="primary"
              size="large"
            >
              準備完了
            </Button>
            <Button 
              onClick={() => handleReadyCheck(false)}
              variant="secondary"
              size="large"
            >
              キャンセル
            </Button>
          </div>
          
          <div className="ready-countdown">
            {/* カウントダウンタイマー */}
            <p>全員の準備が完了するまでお待ちください...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // エラー時のUI
  if (status === 'error' && error) {
    return (
      <div className="matchmaking-lobby error">
        <h2>エラーが発生しました</h2>
        <p className="error-message">{error}</p>
        <Button onClick={() => startMatchmaking()} variant="primary">
          再試行
        </Button>
        <Button onClick={() => {}} variant="secondary">
          メインメニューに戻る
        </Button>
      </div>
    );
  }
  
  // 通常のロビーUI
  return (
    <div className="matchmaking-lobby">
      <div className="lobby-header">
        <h1>オンライン対戦</h1>
        <div className="header-actions">
          <Button 
            onClick={() => setShowRoomBrowser(true)}
            variant="secondary"
          >
            ルームをブラウズ
          </Button>
        </div>
      </div>
      
      <div className="matchmaking-options">
        <div className="game-mode-selection">
          <h2>ゲームモードを選択</h2>
          <div className="mode-grid">
            {gameModes.map(mode => (
              <div
                key={mode.id}
                className={`mode-card ${selectedGameMode === mode.id ? 'selected' : ''}`}
                onClick={() => setSelectedGameMode(mode.id)}
              >
                <h3>{mode.name}</h3>
                <p>{mode.description}</p>
                <div className="mode-stats">
                  <span className="stat">🕒 平均待ち時間: 2分</span>
                  <span className="stat">👥 オンライン: 150人</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="room-settings">
          <h2>ルーム設定</h2>
          <div className="settings-grid">
            <div className="setting-group">
              <label>ルームタイプ</label>
              <div className="room-type-buttons">
                {roomTypes.map(type => (
                  <button
                    key={type.id}
                    className={`type-btn ${selectedRoomType === type.id ? 'active' : ''}`}
                    onClick={() => setSelectedRoomType(type.id)}
                  >
                    {type.name}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="setting-group">
              <label>
                <input 
                  type="checkbox"
                  checked={preferences.allowAI}
                  onChange={(e) => updatePreferences({ allowAI: e.target.checked })}
                />
                AIプレイヤーを許可する
              </label>
            </div>
            
            <div className="setting-group">
              <label>ランク制限</label>
              <div className="rank-range">
                <select 
                  value={preferences.minRank || 0}
                  onChange={(e) => updatePreferences({ minRank: parseInt(e.target.value) })}
                >
                  <option value="0">下限なし</option>
                  <option value="1000">銅雀以上</option>
                  <option value="2000">銀雀以上</option>
                  <option value="3000">金雀以上</option>
                </select>
                <span>〜</span>
                <select 
                  value={preferences.maxRank || 9999}
                  onChange={(e) => updatePreferences({ maxRank: parseInt(e.target.value) })}
                >
                  <option value="9999">上限なし</option>
                  <option value="4000">白鳳以下</option>
                  <option value="5000">青龍以下</option>
                  <option value="6000">雀聖以下</option>
                </select>
              </div>
            </div>
            
            <div className="setting-group">
              <label>地域</label>
              <select 
                value={preferences.region}
                onChange={(e) => updatePreferences({ region: e.target.value })}
              >
                <option value="jp">日本</option>
                <option value="asia">アジア</option>
                <option value="global">全世界</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      
      <div className="matchmaking-action">
        <Button
          onClick={handleStartMatchmaking}
          variant="primary"
          size="large"
          disabled={status === 'searching'}
        >
          {status === 'searching' ? '検索中...' : '対戦相手を探す'}
        </Button>
        
        <div className="estimated-info">
          <p>推定待ち時間: 1-3分</p>
          <p>現在オンライン: 1,234人</p>
        </div>
      </div>
      
      <div className="quick-actions">
        <h3>クイックアクション</h3>
        <div className="action-buttons">
          <Button
            onClick={() => {
              setSelectedGameMode('quick');
              startMatchmaking({ gameMode: 'quick' });
            }}
            variant="secondary"
          >
            すぐに対戦
          </Button>
          
          <Button
            onClick={() => {
              setSelectedGameMode('ranked');
              startMatchmaking({ gameMode: 'ranked' });
            }}
            variant="secondary"
          >
            ランクマッチ
          </Button>
          
          <Button
            onClick={() => {
              // TODO: フレンドと対戦
            }}
            variant="secondary"
          >
            フレンドと対戦
          </Button>
        </div>
      </div>
      
      {showRoomBrowser && (
        <RoomBrowser onClose={() => setShowRoomBrowser(false)} />
      )}
    </div>
  );
};
