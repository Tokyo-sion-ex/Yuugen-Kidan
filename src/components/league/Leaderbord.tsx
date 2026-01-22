import React, { useState } from 'react';
import { useLeagueStore } from '@/store/leagueStore';
import { PlayerRanking } from '@/types/league.types';

export const Leaderboard: React.FC = () => {
  const { getLeaderboard, leagueRanks } = useLeagueStore();
  const [timeFilter, setTimeFilter] = useState<'all' | 'monthly' | 'weekly'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  
  const leaderboard = getLeaderboard(100);
  const itemsPerPage = 20;
  
  const filteredLeaderboard = leaderboard; // TODO: 時間フィルターを実装
  
  const paginatedLeaderboard = filteredLeaderboard.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  const totalPages = Math.ceil(filteredLeaderboard.length / itemsPerPage);
  
  const getRankIcon = (rankScore: number) => {
    const rank = leagueRanks.find(r => 
      rankScore >= r.minScore && rankScore <= r.maxScore
    );
    return rank?.icon || '🎴';
  };
  
  const getRankColor = (rankScore: number) => {
    const rank = leagueRanks.find(r => 
      rankScore >= r.minScore && rankScore <= r.maxScore
    );
    return rank?.color || '#95a5a6';
  };
  
  return (
    <div className="leaderboard">
      <div className="leaderboard-header">
        <h2>ランキング</h2>
        
        <div className="filters">
          <button 
            className={`filter-btn ${timeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setTimeFilter('all')}
          >
            全体
          </button>
          <button 
            className={`filter-btn ${timeFilter === 'monthly' ? 'active' : ''}`}
            onClick={() => setTimeFilter('monthly')}
          >
            月間
          </button>
          <button 
            className={`filter-btn ${timeFilter === 'weekly' ? 'active' : ''}`}
            onClick={() => setTimeFilter('weekly')}
          >
            週間
          </button>
        </div>
      </div>
      
      <div className="leaderboard-table">
        <div className="table-header">
          <div className="col-rank">順位</div>
          <div className="col-player">プレイヤー</div>
          <div className="col-rank">段位</div>
          <div className="col-score">ポイント</div>
          <div className="col-games">対戦数</div>
          <div className="col-winrate">勝率</div>
        </div>
        
        <div className="table-body">
          {paginatedLeaderboard.map((player, index) => (
            <div 
              key={player.playerId}
              className={`table-row ${player.playerId === 'current-player' ? 'current-player' : ''}`}
            >
              <div className="col-rank">
                <span className="rank-number">
                  #{player.position}
                </span>
              </div>
              
              <div className="col-player">
                <div className="player-info">
                  {/* TODO: アバター表示 */}
                  <div className="player-avatar-placeholder" />
                  <div className="player-details">
                    <span className="player-name">{player.username}</span>
                    {player.playerId === 'current-player' && (
                      <span className="you-badge">あなた</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="col-rank">
                <span 
                  className="rank-badge"
                  style={{ color: getRankColor(player.rankScore) }}
                >
                  {getRankIcon(player.rankScore)} {player.leagueRank}
                </span>
              </div>
              
              <div className="col-score">
                <span className="score-value">
                  {player.rankScore}
                </span>
              </div>
              
              <div className="col-games">
                {player.gamesPlayed}
              </div>
              
              <div className="col-winrate">
                <span className="winrate-value">
                  {(player.winRate * 100).toFixed(1)}%
                </span>
                <div className="winrate-bar">
                  <div 
                    className="winrate-fill"
                    style={{ width: `${player.winRate * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            前へ
          </button>
          
          <div className="page-numbers">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={currentPage === pageNum ? 'active' : ''}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          
          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            次へ
          </button>
        </div>
      )}
    </div>
  );
};
