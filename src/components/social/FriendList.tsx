import React, { useState } from 'react';
import { PlayerFriend } from '@/types/social.types';
import { Button } from '@/components/ui/Button';

export const FriendList: React.FC = () => {
  const [friends, setFriends] = useState<PlayerFriend[]>([
    {
      id: 'friend_1',
      username: '桜花雀士',
      avatar: 'avatar_sakura',
      status: 'in_game',
      lastSeen: new Date(),
      friendshipLevel: 5,
      isFavorite: true,
      mutualFriends: 3
    },
    // その他のフレンドデータ...
  ]);
  
  const [filter, setFilter] = useState<'all' | 'online' | 'in_game' | 'favorites'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredFriends = friends.filter(friend => {
    if (filter === 'online' && friend.status === 'offline') return false;
    if (filter === 'in_game' && friend.status !== 'in_game') return false;
    if (filter === 'favorites' && !friend.isFavorite) return false;
    if (searchQuery && !friend.username.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });
  
  const getStatusColor = (status: PlayerFriend['status']) => {
    switch (status) {
      case 'online': return '#2ecc71';
      case 'in_game': return '#3498db';
      case 'away': return '#f39c12';
      case 'offline': return '#95a5a6';
    }
  };
  
  const getStatusText = (status: PlayerFriend['status']) => {
    switch (status) {
      case 'online': return 'オンライン';
      case 'in_game': return '対戦中';
      case 'away': return '離席中';
      case 'offline': return 'オフライン';
    }
  };
  
  const handleInviteToGame = (friendId: string) => {
    console.log('ゲームに招待:', friendId);
  };
  
  const handleSendMessage = (friendId: string) => {
    console.log('メッセージ送信:', friendId);
  };
  
  const handleRemoveFriend = (friendId: string) => {
    setFriends(friends.filter(f => f.id !== friendId));
  };
  
  return (
    <div className="friend-list">
      <div className="friend-list-header">
        <h2>フレンドリスト</h2>
        <div className="friend-actions">
          <Button size="small">フレンド追加</Button>
          <Button size="small" variant="secondary">招待を管理</Button>
        </div>
      </div>
      
      <div className="friend-controls">
        <input
          type="text"
          placeholder="フレンドを検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="friend-search"
        />
        
        <div className="friend-filters">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            すべて ({friends.length})
          </button>
          <button
            className={`filter-btn ${filter === 'online' ? 'active' : ''}`}
            onClick={() => setFilter('online')}
          >
            オンライン ({friends.filter(f => f.status !== 'offline').length})
          </button>
          <button
            className={`filter-btn ${filter === 'in_game' ? 'active' : ''}`}
            onClick={() => setFilter('in_game')}
          >
            対戦中 ({friends.filter(f => f.status === 'in_game').length})
          </button>
          <button
            className={`filter-btn ${filter === 'favorites' ? 'active' : ''}`}
            onClick={() => setFilter('favorites')}
          >
            お気に入り ({friends.filter(f => f.isFavorite).length})
          </button>
        </div>
      </div>
      
      <div className="friends-container">
        {filteredFriends.length === 0 ? (
          <div className="no-friends">
            <p>フレンドが見つかりません</p>
            <Button variant="secondary">フレンドを追加する</Button>
          </div>
        ) : (
          <div className="friends-grid">
            {filteredFriends.map(friend => (
              <div key={friend.id} className="friend-card">
                <div className="friend-header">
                  <div className="friend-avatar">
                    <div className="avatar-image" />
                    <div 
                      className="status-indicator"
                      style={{ backgroundColor: getStatusColor(friend.status) }}
                    />
                  </div>
                  
                  <div className="friend-info">
                    <h3 className="friend-name">
                      {friend.username}
                      {friend.isFavorite && <span className="favorite-star">★</span>}
                    </h3>
                    <p className="friend-status">
                      {getStatusText(friend.status)}
                      {friend.status === 'in_game' && (
                        <span className="game-badge">対戦中</span>
                      )}
                    </p>
                    <p className="friend-mutual">
                      共通のフレンド: {friend.mutualFriends}人
                    </p>
                  </div>
                  
                  <div className="friendship-level">
                    <div className="level-bar">
                      <div 
                        className="level-fill"
                        style={{ width: `${(friend.friendshipLevel / 10) * 100}%` }}
                      />
                    </div>
                    <span className="level-text">Lv.{friend.friendshipLevel}</span>
                  </div>
                </div>
                
                <div className="friend-actions">
                  <Button
                    size="small"
                    onClick={() => handleInviteToGame(friend.id)}
                    disabled={friend.status === 'in_game'}
                  >
                    ゲームに招待
                  </Button>
                  <Button
                    size="small"
                    variant="secondary"
                    onClick={() => handleSendMessage(friend.id)}
                  >
                    メッセージ
                  </Button>
                  <Button
                    size="small"
                    variant="ghost"
                    onClick={() => handleRemoveFriend(friend.id)}
                  >
                    削除
                  </Button>
                </div>
                
                <div className="friend-history">
                  {friend.lastPlayedTogether && (
                    <p className="last-played">
                      最後の対戦: {new Date(friend.lastPlayedTogether).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="friend-stats">
        <div className="stat-card">
          <span className="stat-label">総フレンド数</span>
          <span className="stat-value">{friends.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">オンライン</span>
          <span className="stat-value">{friends.filter(f => f.status !== 'offline').length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">対戦可能</span>
          <span className="stat-value">{friends.filter(f => f.status === 'online').length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">平均友好度</span>
          <span className="stat-value">
            {Math.round(friends.reduce((sum, f) => sum + f.friendshipLevel, 0) / friends.length)}
          </span>
        </div>
      </div>
    </div>
  );
};
