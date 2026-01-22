import React, { useState, useEffect } from 'react';
import { useTournamentStore } from '@/store/tournamentStore';
import { Tournament, TournamentStatus } from '@/types/tournament.types';
import { Button } from '@/components/ui/Button';
import { TournamentCard } from './TournamentCard';
import { CreateTournamentModal } from './CreateTournamentModal';

export const TournamentLobby: React.FC = () => {
  const { 
    getAvailableTournaments, 
    tournaments, 
    registeredTournaments,
    isCreatingTournament 
  } = useTournamentStore();
  
  const [filter, setFilter] = useState<'all' | 'registered' | 'upcoming'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const availableTournaments = getAvailableTournaments();
  
  const filteredTournaments = tournaments.filter(tournament => {
    // フィルター適用
    if (filter === 'registered' && !registeredTournaments.includes(tournament.id)) {
      return false;
    }
    
    if (filter === 'upcoming' && tournament.status !== 'upcoming') {
      return false;
    }
    
    // 検索クエリ適用
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        tournament.name.toLowerCase().includes(query) ||
        tournament.description.toLowerCase().includes(query) ||
        tournament.organizer.toLowerCase().includes(query)
      );
    }
    
    return true;
  });
  
  const getTournamentStatusText = (status: TournamentStatus) => {
    switch (status) {
      case 'upcoming': return '開催前';
      case 'registration': return '参加受付中';
      case 'in_progress': return '進行中';
      case 'completed': return '終了';
      case 'cancelled': return '中止';
      default: return '不明';
    }
  };
  
  const getTournamentStatusColor = (status: TournamentStatus) => {
    switch (status) {
      case 'registration': return '#2ecc71';
      case 'in_progress': return '#3498db';
      case 'upcoming': return '#f39c12';
      case 'completed': return '#95a5a6';
      case 'cancelled': return '#e74c3c';
      default: return '#7f8c8d';
    }
  };
  
  return (
    <div className="tournament-lobby">
      <div className="lobby-header">
        <h1>大会ロビー</h1>
        <div className="header-actions">
          <Button 
            onClick={() => setShowCreateModal(true)}
            variant="primary"
            loading={isCreatingTournament}
          >
            大会を作成
          </Button>
        </div>
      </div>
      
      <div className="lobby-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="大会を検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>
        
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            すべての大会
          </button>
          <button
            className={`filter-tab ${filter === 'registered' ? 'active' : ''}`}
            onClick={() => setFilter('registered')}
          >
            参加登録済み
          </button>
          <button
            className={`filter-tab ${filter === 'upcoming' ? 'active' : ''}`}
            onClick={() => setFilter('upcoming')}
          >
            近日開催
          </button>
        </div>
      </div>
      
      <div className="tournaments-grid">
        {filteredTournaments.length === 0 ? (
          <div className="empty-state">
            <p>大会が見つかりません</p>
            <Button 
              onClick={() => setShowCreateModal(true)}
              variant="secondary"
            >
              最初の大会を作成
            </Button>
          </div>
        ) : (
          filteredTournaments.map(tournament => (
            <TournamentCard
              key={tournament.id}
              tournament={tournament}
              isRegistered={registeredTournaments.includes(tournament.id)}
            />
          ))
        )}
      </div>
      
      <div className="stats-panel">
        <div className="stat-item">
          <span className="stat-label">開催中</span>
          <span className="stat-value">
            {tournaments.filter(t => t.status === 'in_progress').length}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">参加受付中</span>
          <span className="stat-value">
            {availableTournaments.length}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">総参加者数</span>
          <span className="stat-value">
            {tournaments.reduce((sum, t) => sum + t.participants.length, 0)}
          </span>
        </div>
      </div>
      
      {showCreateModal && (
        <CreateTournamentModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
};
