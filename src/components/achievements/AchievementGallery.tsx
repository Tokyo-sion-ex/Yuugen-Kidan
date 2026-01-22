import React, { useState } from 'react';
import { Achievement, AchievementCategory } from '@/types/achievement.types';
import { Button } from '@/components/ui/Button';

export const AchievementGallery: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'progress' | 'rarity' | 'points' | 'date'>('progress');
  
  const categories: AchievementCategory[] = [
    {
      id: 'gameplay',
      name: '対戦実績',
      icon: '🎮',
      color: '#3498db',
      totalAchievements: 50,
      completedAchievements: 12,
      totalPoints: 1000,
      unlockedPoints: 240
    },
    {
      id: 'collection',
      name: '収集実績',
      icon: '📚',
      color: '#9b59b6',
      totalAchievements: 30,
      completedAchievements: 5,
      totalPoints: 600,
      unlockedPoints: 100
    },
    {
      id: 'skill',
      name: '技術実績',
      icon: '⚡',
      color: '#2ecc71',
      totalAchievements: 40,
      completedAchievements: 8,
      totalPoints: 800,
      unlockedPoints: 160
    },
    {
      id: 'social',
      name: '交流実績',
      icon: '👥',
      color: '#e74c3c',
      totalAchievements: 25,
      completedAchievements: 3,
      totalPoints: 500,
      unlockedPoints: 60
    }
  ];
  
  const achievements: Achievement[] = [
    {
      id: 'ach_001',
      name: '初めての和了',
      description: '最初の和了を達成する',
      category: 'gameplay',
      rarity: 'common',
      points: 10,
      currentProgress: 1,
      maxProgress: 1,
      isCompleted: true,
      completedAt: new Date('2024-01-01'),
      progressType: 'binary',
      rewards: [
        { type: 'title', itemId: 'title_novice' },
        { type: 'currency', itemId: 'gold', amount: 100 }
      ]
    },
    {
      id: 'ach_002',
      name: '満貫マスター',
      description: '満貫以上の和了を10回達成する',
      category: 'skill',
      rarity: 'rare',
      points: 50,
      currentProgress: 7,
      maxProgress: 10,
      isCompleted: false,
      progressType: 'incremental',
      rewards: [
        { type: 'title', itemId: 'title_mangan_master' },
        { type: 'avatar_item', itemId: 'crown_rare' }
      ]
    },
    {
      id: 'ach_003',
      name: '連勝街道',
      description: '5連勝を達成する',
      category: 'gameplay',
      rarity: 'epic',
      points: 100,
      currentProgress: 3,
      maxProgress: 5,
      isCompleted: false,
      progressType: 'incremental',
      rewards: [
        { type: 'title', itemId: 'title_win_streak_5' },
        { type: 'special_effect', itemId: 'glow_streak' }
      ]
    },
    // その他の実績...
  ];
  
  const filteredAchievements = selectedCategory === 'all' 
    ? achievements 
    : achievements.filter(a => a.category === selectedCategory);
  
  const sortedAchievements = [...filteredAchievements].sort((a, b) => {
    switch (sortBy) {
      case 'progress':
        const aProgress = a.currentProgress / a.maxProgress;
        const bProgress = b.currentProgress / b.maxProgress;
        return bProgress - aProgress;
      case 'rarity':
        const rarityOrder = { common: 0, rare: 1, epic: 2, legendary: 3 };
        return rarityOrder[b.rarity] - rarityOrder[a.rarity];
      case 'points':
        return b.points - a.points;
      case 'date':
        return (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0);
      default:
        return 0;
    }
  });
  
  const getRarityColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common': return '#95a5a6';
      case 'rare': return '#3498db';
      case 'epic': return '#9b59b6';
      case 'legendary': return '#f39c12';
    }
  };
  
  const calculateCategoryProgress = (categoryId: string) => {
    const catAchievements = achievements.filter(a => a.category === categoryId);
    const completed = catAchievements.filter(a => a.isCompleted).length;
    const total = catAchievements.length;
    return total > 0 ? (completed / total) * 100 : 0;
  };
  
  const totalPoints = achievements.reduce((sum, a) => a.isCompleted ? sum + a.points : sum, 0);
  const maxPoints = achievements.reduce((sum, a) => sum + a.points, 0);
  
  return (
    <div className="achievement-gallery">
      <div className="achievement-header">
        <div className="header-info">
          <h1>実績一覧</h1>
          <div className="total-progress">
            <span className="progress-text">
              総合進捗: {achievements.filter(a => a.isCompleted).length}/{achievements.length}
            </span>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ 
                  width: `${(achievements.filter(a => a.isCompleted).length / achievements.length) * 100}%` 
                }}
              />
            </div>
          </div>
        </div>
        
        <div className="header-stats">
          <div className="stat-card">
            <span className="stat-label">獲得ポイント</span>
            <span className="stat-value">{totalPoints}</span>
            <span className="stat-total">/{maxPoints}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">完了実績</span>
            <span className="stat-value">{achievements.filter(a => a.isCompleted).length}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">総実績数</span>
            <span className="stat-value">{achievements.length}</span>
          </div>
        </div>
      </div>
      
      <div className="category-nav">
        <button
          className={`category-btn ${selectedCategory === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('all')}
        >
          すべて
        </button>
        {categories.map(category => (
          <button
            key={category.id}
            className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category.id)}
            style={{ borderLeftColor: category.color }}
          >
            <span className="category-icon">{category.icon}</span>
            <span className="category-name">{category.name}</span>
            <span className="category-progress">
              {category.completedAchievements}/{category.totalAchievements}
            </span>
          </button>
        ))}
      </div>
      
      <div className="achievement-controls">
        <div className="view-controls">
          <button
            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
          >
            グリッド表示
          </button>
          <button
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            リスト表示
          </button>
        </div>
        
        <div className="sort-controls">
          <span>並び替え:</span>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
            <option value="progress">進捗順</option>
            <option value="rarity">レアリティ順</option>
            <option value="points">ポイント順</option>
            <option value="date">獲得日順</option>
          </select>
        </div>
      </div>
      
      <div className={`achievements-container ${viewMode}`}>
        {sortedAchievements.map(achievement => {
          const progress = (achievement.currentProgress / achievement.maxProgress) * 100;
          const category = categories.find(c => c.id === achievement.category);
          
          return (
            <div 
              key={achievement.id} 
              className={`achievement-card ${achievement.isCompleted ? 'completed' : 'in-progress'}`}
              style={{ borderColor: getRarityColor(achievement.rarity) }}
            >
              <div className="achievement-header">
                <div className="achievement-icon">
                  <div className="icon-placeholder" style={{ backgroundColor: category?.color }} />
                </div>
                <div className="achievement-info">
                  <h3 className="achievement-name">{achievement.name}</h3>
                  <p className="achievement-description">{achievement.description}</p>
                  <div className="achievement-meta">
                    <span className={`rarity-badge rarity-${achievement.rarity}`}>
                      {achievement.rarity.toUpperCase()}
                    </span>
                    <span className="points-badge">{achievement.points} ポイント</span>
                    <span className="category-badge" style={{ color: category?.color }}>
                      {category?.name}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="achievement-progress">
                {achievement.progressType === 'incremental' ? (
                  <>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ width: `${progress}%`, backgroundColor: category?.color }}
                      />
                    </div>
                    <span className="progress-text">
                      {achievement.currentProgress}/{achievement.maxProgress}
                    </span>
                  </>
                ) : achievement.isCompleted ? (
                  <div className="completed-indicator">
                    <span className="completed-text">達成済み</span>
                    {achievement.completedAt && (
                      <span className="completed-date">
                        {new Date(achievement.completedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="not-started">未開始</span>
                )}
              </div>
              
              {achievement.rewards.length > 0 && (
                <div className="achievement-rewards">
                  <span className="rewards-label">報酬:</span>
                  <div className="rewards-list">
                    {achievement.rewards.map((reward, index) => (
                      <div key={index} className="reward-item">
                        {reward.type === 'title' && '称号'}
                        {reward.type === 'avatar_item' && 'アバターアイテム'}
                        {reward.type === 'currency' && `${reward.amount}ゴールド`}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {achievement.prerequisites && achievement.prerequisites.length > 0 && (
                <div className="prerequisites">
                  <span>前提条件: {achievement.prerequisites.length}つの実績が必要</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="achievement-summary">
        <div className="summary-card">
          <h3>今週の実績</h3>
          <div className="weekly-progress">
            <span>今週獲得: 3実績</span>
            <span>120ポイント</span>
          </div>
        </div>
        <div className="summary-card">
          <h3>次の目標</h3>
          <div className="next-target">
            {achievements
              .filter(a => !a.isCompleted && a.currentProgress > 0)
              .sort((a, b) => (b.currentProgress / b.maxProgress) - (a.currentProgress / a.maxProgress))
              .slice(0, 1)
              .map(achievement => (
                <div key={achievement.id}>
                  <span>{achievement.name}</span>
                  <span>{Math.round((achievement.currentProgress / achievement.maxProgress) * 100)}%</span>
                </div>
              ))}
          </div>
        </div>
        <div className="summary-card">
          <h3>レア実績</h3>
          <div className="rare-achievements">
            {achievements
              .filter(a => a.rarity === 'legendary' && a.isCompleted)
              .slice(0, 3)
              .map(achievement => (
                <div key={achievement.id} className="rare-item">
                  <span>{achievement.name}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};
