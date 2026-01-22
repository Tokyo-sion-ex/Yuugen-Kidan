import React, { useState, useEffect } from 'react';
import { SeasonalEvent, EventShop, EventStoryChapter } from '@/types/event.types';
import { Button } from '@/components/ui/Button';

export const SeasonalEventHub: React.FC = () => {
  const [currentEvent, setCurrentEvent] = useState<SeasonalEvent | null>(null);
  const [events, setEvents] = useState<SeasonalEvent[]>([
    {
      id: 'event_sakura_2024',
      name: '桜舞う季節の雀荘',
      description: '春の訪れとともに咲き誇る桜の下で、特別な対局を楽しみませんか？',
      season: 'spring',
      year: 2024,
      startDate: new Date('2024-03-20'),
      endDate: new Date('2024-04-20'),
      type: 'collectathon',
      mainObjective: '桜花コインを集めて限定アイテムを獲得しよう！',
      rewards: [
        { id: 'reward_1', name: '桜の髪飾り', type: 'avatar', requirement: 100, isClaimed: false },
        { id: 'reward_2', name: '春風の称号', type: 'title', requirement: 300, isClaimed: false },
        { id: 'reward_3', name: '満開桜テーマ', type: 'special', requirement: 500, isClaimed: false }
      ],
      progress: 150,
      maxProgress: 500,
      isCompleted: false,
      exclusiveItems: ['avatar_sakura_hair', 'title_spring_breeze', 'theme_cherry_blossom'],
      storyChapters: [
        {
          id: 'chapter_1',
          title: '桜の誘い',
          description: '雀荘に舞い散る桜の花びら',
          unlockRequirement: 0,
          isUnlocked: true,
          isRead: true,
          content: '春の風が雀荘に桜の香りを運んでくる...'
        }
      ]
    },
    {
      id: 'event_summer_festival',
      name: '夏祭り花火大会',
      description: '夜空を彩る花火の下で熱い対局を！',
      season: 'summer',
      year: 2024,
      startDate: new Date('2024-08-01'),
      endDate: new Date('2024-08-31'),
      type: 'tournament',
      mainObjective: '夏祭りトーナメントで優勝を目指せ！',
      rewards: [],
      progress: 0,
      maxProgress: 1000,
      isCompleted: false,
      exclusiveItems: []
    }
  ]);
  
  const [eventShop, setEventShop] = useState<EventShop>({
    id: 'shop_sakura',
    name: '桜花商店',
    currency: '桜花コイン',
    items: [
      {
        id: 'item_1',
        name: '桜の和菓子',
        type: 'consumable',
        price: 50,
        stock: 100,
        purchaseLimit: 3,
        purchases: 1
      },
      {
        id: 'item_2',
        name: '桜柄の扇子',
        type: 'avatar',
        price: 200,
        stock: -1,
        purchases: 0
      }
    ],
    refreshRate: 'daily',
    lastRefreshed: new Date()
  });
  
  const [eventPoints, setEventPoints] = useState(150);
  const [eventCurrency, setEventCurrency] = useState(320);
  const [activeTab, setActiveTab] = useState<'overview' | 'rewards' | 'shop' | 'story' | 'leaderboard'>('overview');
  const [timeLeft, setTimeLeft] = useState('');
  
  useEffect(() => {
    // 現在進行中のイベントを探す
    const now = new Date();
    const activeEvent = events.find(event => 
      event.startDate <= now && event.endDate >= now
    );
    setCurrentEvent(activeEvent || null);
    
    // カウントダウンの更新
    const updateCountdown = () => {
      if (activeEvent) {
        const now = new Date();
        const end = new Date(activeEvent.endDate);
        const diff = end.getTime() - now.getTime();
        
        if (diff <= 0) {
          setTimeLeft('イベント終了');
        } else {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          setTimeLeft(`${days}日 ${hours}時間 ${minutes}分`);
        }
      }
    };
    
    updateCountdown();
    const timer = setInterval(updateCountdown, 60000);
    
    return () => clearInterval(timer);
  }, [events]);
  
  const getSeasonColor = (season: string) => {
    switch (season) {
      case 'spring': return '#ffb6c1';
      case 'summer': return '#87ceeb';
      case 'autumn': return '#ffa07a';
      case 'winter': return '#f0f8ff';
      case 'special': return '#9370db';
      default: return '#ffffff';
    }
  };
  
  const getSeasonIcon = (season: string) => {
    switch (season) {
      case 'spring': return '🌸';
      case 'summer': return '🌊';
      case 'autumn': return '🍁';
      case 'winter': return '❄️';
      case 'special': return '🎉';
      default: return '⭐';
    }
  };
  
  const calculateProgressPercent = () => {
    if (!currentEvent) return 0;
    return (currentEvent.progress / currentEvent.maxProgress) * 100;
  };
  
  const claimReward = (rewardId: string) => {
    if (!currentEvent) return;
    
    const reward = currentEvent.rewards.find(r => r.id === rewardId);
    if (!reward || reward.isClaimed || currentEvent.progress < reward.requirement) {
      return;
    }
    
    setEvents(prev => prev.map(event => {
      if (event.id === currentEvent.id) {
        return {
          ...event,
          rewards: event.rewards.map(r => 
            r.id === rewardId ? { ...r, isClaimed: true, claimedAt: new Date() } : r
          )
        };
      }
      return event;
    }));
    
    // 報酬獲得処理（実際の実装ではAPIを呼び出す）
    console.log(`Reward claimed: ${reward.name}`);
  };
  
  const purchaseItem = (itemId: string) => {
    const item = eventShop.items.find(i => i.id === itemId);
    if (!item) return;
    
    // 購入条件チェック
    if (eventCurrency < item.price) {
      alert('通貨が不足しています');
      return;
    }
    
    if (item.stock !== -1 && item.stock <= 0) {
      alert('在庫がありません');
      return;
    }
    
    if (item.purchaseLimit && item.purchases >= item.purchaseLimit) {
      alert('購入制限に達しました');
      return;
    }
    
    // 購入処理
    setEventCurrency(prev => prev - item.price);
    setEventShop(prev => ({
      ...prev,
      items: prev.items.map(i => 
        i.id === itemId 
          ? { 
              ...i, 
              stock: i.stock === -1 ? -1 : i.stock - 1,
              purchases: i.purchases + 1
            }
          : i
      )
    }));
    
    // アイテム付与処理（実際の実装ではAPIを呼び出す）
    console.log(`Purchased: ${item.name}`);
  };
  
  const readStoryChapter = (chapterId: string) => {
    if (!currentEvent) return;
    
    setEvents(prev => prev.map(event => {
      if (event.id === currentEvent.id && event.storyChapters) {
        return {
          ...event,
          storyChapters: event.storyChapters.map(chapter =>
            chapter.id === chapterId ? { ...chapter, isRead: true } : chapter
          )
        };
      }
      return event;
    }));
  };
  
  const renderOverview = () => {
    if (!currentEvent) return null;
    
    return (
      <div className="event-overview">
        <div className="event-banner" style={{ 
          background: `linear-gradient(135deg, ${getSeasonColor(currentEvent.season)}30 0%, transparent 100%)`,
          borderColor: getSeasonColor(currentEvent.season)
        }}>
          <div className="banner-content">
            <div className="season-icon">{getSeasonIcon(currentEvent.season)}</div>
            <div className="banner-text">
              <h1>{currentEvent.name}</h1>
              <p>{currentEvent.description}</p>
            </div>
          </div>
          
          <div className="banner-meta">
            <div className="meta-item">
              <span className="meta-label">期間</span>
              <span className="meta-value">
                {new Date(currentEvent.startDate).toLocaleDateString()} 〜 
                {new Date(currentEvent.endDate).toLocaleDateString()}
              </span>
            </div>
            <div className="meta-item">
              <span className="meta-label">残り時間</span>
              <span className="meta-value time-left">{timeLeft}</span>
            </div>
          </div>
        </div>
        
        <div className="event-progress">
          <h3>イベント目標</h3>
          <p>{currentEvent.mainObjective}</p>
          
          <div className="progress-section">
            <div className="progress-header">
              <span>イベントポイント</span>
              <span>{currentEvent.progress}/{currentEvent.maxProgress}</span>
            </div>
            
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ 
                  width: `${calculateProgressPercent()}%`,
                  backgroundColor: getSeasonColor(currentEvent.season)
                }}
              />
            </div>
            
            <div className="progress-stats">
              <div className="stat">
                <span className="stat-label">獲得ポイント</span>
                <span className="stat-value">{eventPoints}</span>
              </div>
              <div className="stat">
                <span className="stat-label">イベント通貨</span>
                <span className="stat-value">{eventCurrency} {eventShop.currency}</span>
              </div>
              <div className="stat">
                <span className="stat-label">獲得報酬</span>
                <span className="stat-value">
                  {currentEvent.rewards.filter(r => r.isClaimed).length}/{currentEvent.rewards.length}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="event-actions">
          <h3>イベント参加方法</h3>
          <div className="action-grid">
            <div className="action-card">
              <div className="action-icon">🎮</div>
              <h4>通常対戦</h4>
              <p>通常の対戦でイベントポイントを獲得</p>
              <span className="action-reward">+10ポイント/1対戦</span>
            </div>
            
            <div className="action-card">
              <div className="action-icon">🏆</div>
              <h4>イベント対局</h4>
              <p>特別ルールの対局に参加</p>
              <span className="action-reward">+50ポイント/1勝利</span>
            </div>
            
            <div className="action-card">
              <div className="action-icon">📜</div>
              <h4>デイリーチャレンジ</h4>
              <p>毎日更新される特別な課題</p>
              <span className="action-reward">最大+100ポイント/日</span>
            </div>
            
            <div className="action-card">
              <div className="action-icon">🤝</div>
              <h4>フレンドと対戦</h4>
              <p>フレンドと対戦してボーナス獲得</p>
              <span className="action-reward">+30ポイント/1対戦</span>
            </div>
          </div>
        </div>
        
        <div className="quick-actions">
          <Button variant="primary" size="large">イベント対局を開始</Button>
          <Button variant="secondary" size="large">デイリーチャレンジを確認</Button>
          <Button variant="secondary" size="large">ストーリーを読む</Button>
        </div>
      </div>
    );
  };
  
  const renderRewards = () => {
    if (!currentEvent) return null;
    
    return (
      <div className="event-rewards">
        <h2>イベント報酬</h2>
        
        <div className="rewards-track">
          <div className="track-line" />
          
          {currentEvent.rewards.map((reward, index) => {
            const isUnlocked = currentEvent.progress >= reward.requirement;
            const isClaimed = reward.isClaimed;
            const position = (reward.requirement / currentEvent.maxProgress) * 100;
            
            return (
              <div 
                key={reward.id}
                className={`reward-milestone ${isUnlocked ? 'unlocked' : 'locked'} ${isClaimed ? 'claimed' : ''}`}
                style={{ left: `${position}%` }}
              >
                <div 
                  className="milestone-marker"
                  style={{ backgroundColor: getSeasonColor(currentEvent.season) }}
                >
                  {isClaimed ? '✓' : index + 1}
                </div>
                
                <div className="milestone-reward">
                  <div className="reward-icon">
                    {reward.type === 'avatar' && '👕'}
                    {reward.type === 'title' && '🏷️'}
                    {reward.type === 'special' && '✨'}
                  </div>
                  <div className="reward-info">
                    <h4>{reward.name}</h4>
                    <span className="reward-requirement">
                      必要ポイント: {reward.requirement}
                    </span>
                  </div>
                  
                  {isUnlocked && !isClaimed && (
                    <Button
                      size="small"
                      onClick={() => claimReward(reward.id)}
                    >
                      受け取る
                    </Button>
                  )}
                  
                  {isClaimed && (
                    <span className="claimed-badge">受取済み</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="rewards-info">
          <p>イベントポイントを貯めて報酬を獲得しましょう！</p>
          <p>ポイントは通常対戦やイベント対局で獲得できます。</p>
        </div>
      </div>
    );
  };
  
  const renderShop = () => (
    <div className="event-shop">
      <div className="shop-header">
        <h2>{eventShop.name}</h2>
        <div className="shop-currency">
          <span className="currency-amount">{eventCurrency}</span>
          <span className="currency-name">{eventShop.currency}</span>
        </div>
      </div>
      
      <div className="shop-info">
        <p>イベント通貨「{eventShop.currency}」で限定アイテムを購入できます。</p>
        <p>通貨はイベント対局やデイリーチャレンジで獲得できます。</p>
        
        {eventShop.refreshRate !== 'event' && (
          <div className="refresh-info">
            <span>次回更新: </span>
            <span>{
              eventShop.refreshRate === 'daily' ? '24時間後' : '7日後'
            }</span>
          </div>
        )}
      </div>
      
      <div className="shop-items">
        <h3>限定アイテム</h3>
        <div className="items-grid">
          {eventShop.items.map(item => {
            const canPurchase = eventCurrency >= item.price && 
              (item.stock === -1 || item.stock > 0) &&
              (!item.purchaseLimit || item.purchases < item.purchaseLimit);
            
            return (
              <div key={item.id} className="shop-item">
                <div className="item-preview">
                  <div className="preview-image" />
                  {item.stock !== -1 && item.stock < 10 && (
                    <span className="stock-warning">残り{item.stock}個</span>
                  )}
                </div>
                
                <div className="item-info">
                  <h4>{item.name}</h4>
                  <span className="item-type">{item.type}</span>
                  
                  <div className="item-price">
                    <span className="price-amount">{item.price}</span>
                    <span className="price-currency">{eventShop.currency}</span>
                  </div>
                  
                  {item.purchaseLimit && (
                    <div className="purchase-limit">
                      購入可能: {item.purchaseLimit - item.purchases}回
                    </div>
                  )}
                </div>
                
                <div className="item-actions">
                  <Button
                    onClick={() => purchaseItem(item.id)}
                    disabled={!canPurchase}
                    size="small"
                    variant={canPurchase ? 'primary' : 'secondary'}
                  >
                    {canPurchase ? '購入する' : '購入不可'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="currency-advice">
        <h4>通貨の稼ぎ方</h4>
        <ul>
          <li>イベント対局参加: +20コイン/1対戦</li>
          <li>デイリーチャレンジ: +50コイン/1達成</li>
          <li>ストーリーチャプター: +30コイン/1章</li>
        </ul>
      </div>
    </div>
  );
  
  const renderStory = () => {
    if (!currentEvent || !currentEvent.storyChapters) return null;
    
    return (
      <div className="event-story">
        <h2>イベントストーリー</h2>
        <p>{currentEvent.description}</p>
        
        <div className="chapters-list">
          {currentEvent.storyChapters.map(chapter => {
            const isUnlocked = chapter.isUnlocked && currentEvent.progress >= chapter.unlockRequirement;
            
            return (
              <div 
                key={chapter.id}
                className={`story-chapter ${isUnlocked ? 'unlocked' : 'locked'} ${chapter.isRead ? 'read' : 'unread'}`}
              >
                <div className="chapter-header">
                  <h3>{chapter.title}</h3>
                  <div className="chapter-status">
                    {chapter.isRead ? '既読' : '未読'}
                    {!isUnlocked && (
                      <span className="unlock-req">
                        必要ポイント: {chapter.unlockRequirement}
                      </span>
                    )}
                  </div>
                </div>
                
                <p>{chapter.description}</p>
                
                {isUnlocked && !chapter.isRead && (
                  <Button
                    size="small"
                    onClick={() => readStoryChapter(chapter.id)}
                    variant="primary"
                  >
                    読む
                  </Button>
                )}
                
                {isUnlocked && chapter.isRead && (
                  <div className="chapter-content">
                    <p>{chapter.content}</p>
                    {chapter.voiceActing && (
                      <Button size="small" variant="secondary">
                        音声を再生
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  if (!currentEvent) {
    return (
      <div className="event-hub">
        <div className="no-active-event">
          <h2>現在開催中のイベントはありません</h2>
          <p>次の季節イベントをお楽しみに！</p>
          
          <div className="upcoming-events">
            <h3>開催予定のイベント</h3>
            <div className="upcoming-list">
              {events.filter(e => e.startDate > new Date()).map(event => (
                <div key={event.id} className="upcoming-event">
                  <span className="event-season">{getSeasonIcon(event.season)} {event.name}</span>
                  <span className="event-start">
                    開始: {new Date(event.startDate).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="event-hub">
      <div className="event-tabs">
        <button
          className={`event-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          イベント概要
        </button>
        <button
          className={`event-tab ${activeTab === 'rewards' ? 'active' : ''}`}
          onClick={() => setActiveTab('rewards')}
        >
          報酬
        </button>
        <button
          className={`event-tab ${activeTab === 'shop' ? 'active' : ''}`}
          onClick={() => setActiveTab('shop')}
        >
          交換所
        </button>
        <button
          className={`event-tab ${activeTab === 'story' ? 'active' : ''}`}
          onClick={() => setActiveTab('story')}
        >
          ストーリー
        </button>
        <button
          className={`event-tab ${activeTab === 'leaderboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('leaderboard')}
        >
          ランキング
        </button>
      </div>
      
      <div className="event-content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'rewards' && renderRewards()}
        {activeTab === 'shop' && renderShop()}
        {activeTab === 'story' && renderStory()}
        {activeTab === 'leaderboard' && (
          <div className="event-leaderboard">
            <h2>イベントランキング</h2>
            <p>準備中...</p>
          </div>
        )}
      </div>
      
      <div className="event-sidebar">
        <div className="sidebar-section">
          <h4>イベント進捗</h4>
          <div className="progress-circle">
            <div className="circle-background" />
            <div 
              className="circle-progress"
              style={{ 
                background: `conic-gradient(${getSeasonColor(currentEvent.season)} ${calculateProgressPercent() * 3.6}deg, transparent 0deg)`
              }}
            />
            <div className="circle-text">
              <span className="progress-percent">
                {Math.round(calculateProgressPercent())}%
              </span>
              <span className="progress-label">達成</span>
            </div>
          </div>
        </div>
        
        <div className="sidebar-section">
          <h4>本日のミッション</h4>
          <div className="daily-missions">
            <div className="mission">
              <span>対戦に3回参加する</span>
              <span className="mission-reward">+30ポイント</span>
            </div>
            <div className="mission">
              <span>リーチをかける</span>
              <span className="mission-reward">+20ポイント</span>
            </div>
            <div className="mission completed">
              <span>和了する</span>
              <span className="mission-reward">✓ 完了</span>
            </div>
          </div>
        </div>
        
        <div className="sidebar-section">
          <h4>イベント情報</h4>
          <div className="event-info">
            <div className="info-item">
              <span>開催期間:</span>
              <span>
                {new Date(currentEvent.startDate).toLocaleDateString()} 〜 
                {new Date(currentEvent.endDate).toLocaleDateString()}
              </span>
            </div>
            <div className="info-item">
              <span>残り時間:</span>
              <span>{timeLeft}</span>
            </div>
            <div className="info-item">
              <span>参加人数:</span>
              <span>1,234人</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
