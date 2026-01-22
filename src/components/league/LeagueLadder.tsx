import React from 'react';
import { useLeagueStore } from '@/store/leagueStore';
import { LeagueRank } from '@/types/league.types';

export const LeagueLadder: React.FC = () => {
  const { leagueRanks, getPlayerRanking } = useLeagueStore();
  const playerRanking = getPlayerRanking('current-player'); // TODO: 実際のプレイヤーID
  
  // ランクを逆順にして、高いランクから表示
  const sortedRanks = [...leagueRanks].sort((a, b) => b.minScore - a.minScore);
  
  const currentRankIndex = playerRanking 
    ? sortedRanks.findIndex(rank => 
        playerRanking.rankScore >= rank.minScore && 
        playerRanking.rankScore <= rank.maxScore
      )
    : -1;
  
  // 進捗率を計算（現在のランク内での進捗）
  const getProgressInCurrentRank = () => {
    if (!playerRanking) return 0;
    
    const currentRank = sortedRanks[currentRankIndex];
    if (!currentRank) return 0;
    
    const rankRange = currentRank.maxScore - currentRank.minScore;
    const progressInRank = playerRanking.rankScore - currentRank.minScore;
    
    return (progressInRank / rankRange) * 100;
  };
  
  return (
    <div className="league-ladder">
      <div className="ladder-header">
        <h2>段位システム</h2>
        {playerRanking && (
          <div className="current-rank-display">
            <span className="rank-icon">{sortedRanks[currentRankIndex]?.icon}</span>
            <span className="rank-name">{sortedRanks[currentRankIndex]?.name}</span>
            <span className="rank-score">{playerRanking.rankScore} ポイント</span>
          </div>
        )}
      </div>
      
      <div className="ladder-visualization">
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ 
              width: `${getProgressInCurrentRank()}%`,
              backgroundColor: sortedRanks[currentRankIndex]?.color 
            }}
          />
        </div>
        
        <div className="ranks-grid">
          {sortedRanks.map((rank, index) => (
            <div 
              key={rank.id}
              className={`rank-tier ${index <= currentRankIndex ? 'unlocked' : 'locked'} ${index === currentRankIndex ? 'current' : ''}`}
              style={{ borderColor: rank.color }}
            >
              <div className="tier-icon" style={{ color: rank.color }}>
                {rank.icon}
              </div>
              <div className="tier-info">
                <h3>{rank.name}</h3>
                <p>{rank.minScore} - {rank.maxScore} ポイント</p>
                {index <= currentRankIndex && rank.rewards.length > 0 && (
                  <div className="tier-rewards">
                    <span>報酬: </span>
                    {rank.rewards.map(reward => (
                      <span key={reward} className="reward-badge">{reward}</span>
                    ))}
                  </div>
                )}
              </div>
              
              {index === currentRankIndex && (
                <div className="current-indicator">
                  <div className="glow-effect" style={{ backgroundColor: rank.color }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {playerRanking && (
        <div className="rank-stats">
          <div className="stat-card">
            <h4>順位</h4>
            <p className="stat-value">#{playerRanking.position}</p>
          </div>
          <div className="stat-card">
            <h4>対戦数</h4>
            <p className="stat-value">{playerRanking.gamesPlayed}</p>
          </div>
          <div className="stat-card">
            <h4>勝率</h4>
            <p className="stat-value">{(playerRanking.winRate * 100).toFixed(1)}%</p>
          </div>
          <div className="stat-card">
            <h4>累計得点</h4>
            <p className="stat-value">{playerRanking.totalPoints.toLocaleString()}</p>
          </div>
        </div>
      )}
    </div>
  );
};
