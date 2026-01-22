import React, { useState, useEffect } from 'react';
import { GachaBanner, GachaItem, GachaResult } from '@/types/gacha.types';
import { Button } from '@/components/ui/Button';

export const GachaMachine: React.FC = () => {
  const [currentBanner, setCurrentBanner] = useState<GachaBanner | null>(null);
  const [banners, setBanners] = useState<GachaBanner[]>([
    {
      id: 'banner_standard',
      name: '常設召喚',
      description: '常時開催中の標準召喚',
      type: 'standard',
      featuredItems: ['item_common_1', 'item_rare_1'],
      startDate: new Date('2024-01-01'),
      endDate: new Date('2025-12-31'),
      pityCounter: 0,
      guaranteedRarity: 'rare',
      rates: { common: 70, rare: 25, epic: 4.5, legendary: 0.5 },
      cost: { single: 100, multi: 900, currency: 'gold' },
      guarantees: {
        multiGuarantee: 'rare',
        pityCount: 100,
        pityRarity: 'epic'
      }
    },
    {
      id: 'banner_limited',
      name: '期間限定：月下の舞姫',
      description: '月明かりに舞う幻の雀士衣装',
      type: 'limited',
      featuredItems: ['item_moon_dancer', 'item_moon_hair'],
      startDate: new Date(),
      endDate: new Date(Date.now() + 14 * 86400000),
      pityCounter: 0,
      guaranteedRarity: 'epic',
      rates: { common: 60, rare: 30, epic: 8, legendary: 2 },
      cost: { single: 150, multi: 1350, currency: 'premium' },
      guarantees: {
        multiGuarantee: 'rare',
        pityCount: 80,
        pityRarity: 'legendary'
      }
    }
  ]);
  
  const [inventory, setInventory] = useState<GachaItem[]>([]);
  const [gachaResults, setGachaResults] = useState<GachaResult[]>([]);
  const [currency, setCurrency] = useState({ gold: 10000, premium: 500 });
  const [isPulling, setIsPulling] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [currentResult, setCurrentResult] = useState<GachaResult | null>(null);
  const [pityCounters, setPityCounters] = useState<Record<string, number>>({});
  
  // ガチャアイテムのサンプルデータ
  const gachaItems: GachaItem[] = [
    {
      id: 'item_moon_dancer',
      name: '月下舞姫の衣装',
      type: 'avatar',
      rarity: 'legendary',
      bannerId: 'banner_limited',
      isFeatured: true,
      rateUp: 2,
      previewImage: '/gacha/moon_dancer.png',
      duplicatesConvertTo: 1000,
      effects: {
        type: 'avatar_cosmetic',
        value: 1
      }
    },
    // その他のアイテム...
  ];
  
  useEffect(() => {
    if (banners.length > 0 && !currentBanner) {
      setCurrentBanner(banners[0]);
    }
  }, [banners, currentBanner]);
  
  const calculatePity = (bannerId: string) => {
    return pityCounters[bannerId] || 0;
  };
  
  const getGuaranteedRarity = (banner: GachaBanner, pity: number): 'epic' | 'legendary' | null => {
    if (pity >= banner.guarantees.pityCount) {
      return banner.guarantees.pityRarity;
    }
    return null;
  };
  
  const pullGacha = (banner: GachaBanner, isMulti: boolean) => {
    if (!hasEnoughCurrency(banner, isMulti)) {
      alert('通貨が不足しています');
      return;
    }
    
    setIsPulling(true);
    
    // 通貨消費
    const cost = isMulti ? banner.cost.multi : banner.cost.single;
    const newCurrency = { ...currency };
    if (banner.cost.currency === 'gold') {
      newCurrency.gold -= cost;
    } else {
      newCurrency.premium -= cost;
    }
    setCurrency(newCurrency);
    
    // ピティカウント更新
    const currentPity = calculatePity(banner.id);
    const newPity = currentPity + (isMulti ? 10 : 1);
    setPityCounters(prev => ({ ...prev, [banner.id]: newPity }));
    
    // ガチャ結果生成
    const items: GachaItem[] = [];
    const count = isMulti ? 10 : 1;
    
    for (let i = 0; i < count; i++) {
      const guaranteed = getGuaranteedRarity(banner, currentPity + i);
      
      if (guaranteed) {
        // ピティ保証発動
        const guaranteedItem = getRandomItemByRarity(banner, guaranteed);
        items.push(guaranteedItem);
      } else if (i === 9 && isMulti) {
        // 10連保証（最後の1回）
        const guaranteedItem = getRandomItemByRarity(banner, banner.guarantees.multiGuarantee);
        items.push(guaranteedItem);
      } else {
        // 通常抽選
        const item = getRandomItem(banner);
        items.push(item);
      }
    }
    
    // 結果処理
    const result: GachaResult = {
      pullId: `pull_${Date.now()}`,
      bannerId: banner.id,
      items,
      timestamp: new Date(),
      isMulti,
      pityCounter: newPity,
      newItems: [],
      duplicateItems: [],
      pointsEarned: 0
    };
    
    // 新規/重複判定
    const newItems: string[] = [];
    const duplicateItems: string[] = [];
    let points = 0;
    
    items.forEach(item => {
      const existing = inventory.find(inv => inv.id === item.id);
      if (existing) {
        duplicateItems.push(item.id);
        points += item.duplicatesConvertTo || 100;
      } else {
        newItems.push(item.id);
        setInventory(prev => [...prev, item]);
      }
    });
    
    result.newItems = newItems;
    result.duplicateItems = duplicateItems;
    result.pointsEarned = points;
    
    // 結果表示
    setGachaResults(prev => [result, ...prev.slice(0, 9)]);
    setCurrentResult(result);
    setShowResult(true);
    
    setTimeout(() => setIsPulling(false), 1500);
  };
  
  const getRandomItem = (banner: GachaBanner): GachaItem => {
    const roll = Math.random() * 100;
    let rarity: GachaItem['rarity'] = 'common';
    
    if (roll < banner.rates.legendary) rarity = 'legendary';
    else if (roll < banner.rates.legendary + banner.rates.epic) rarity = 'epic';
    else if (roll < banner.rates.legendary + banner.rates.epic + banner.rates.rare) rarity = 'rare';
    
    // 実際の実装では、バナーに含まれるアイテムから抽選
    return {
      id: `item_${Date.now()}_${Math.random()}`,
      name: `${rarity.toUpperCase()}アイテム`,
      type: 'avatar',
      rarity,
      bannerId: banner.id,
      isFeatured: false,
      previewImage: `/gacha/${rarity}.png`,
      duplicatesConvertTo: rarity === 'common' ? 10 : rarity === 'rare' ? 50 : rarity === 'epic' ? 200 : 1000
    };
  };
  
  const getRandomItemByRarity = (banner: GachaBanner, rarity: string): GachaItem => {
    // 実際の実装では、指定レアリティのアイテムから抽選
    return {
      id: `item_guaranteed_${rarity}`,
      name: `保証${rarity.toUpperCase()}アイテム`,
      type: 'avatar',
      rarity: rarity as GachaItem['rarity'],
      bannerId: banner.id,
      isFeatured: false,
      previewImage: `/gacha/${rarity}_guaranteed.png`,
      duplicatesConvertTo: rarity === 'epic' ? 200 : 1000
    };
  };
  
  const hasEnoughCurrency = (banner: GachaBanner, isMulti: boolean) => {
    const cost = isMulti ? banner.cost.multi : banner.cost.single;
    if (banner.cost.currency === 'gold') {
      return currency.gold >= cost;
    } else {
      return currency.premium >= cost;
    }
  };
  
  const getRarityColor = (rarity: GachaItem['rarity']) => {
    switch (rarity) {
      case 'common': return '#95a5a6';
      case 'rare': return '#3498db';
      case 'epic': return '#9b59b6';
      case 'legendary': return '#f39c12';
    }
  };
  
  const formatCurrency = (amount: number, type: 'gold' | 'premium') => {
    return type === 'gold' ? `${amount} G` : `${amount} 💎`;
  };
  
  return (
    <div className="gacha-machine">
      <div className="gacha-header">
        <h1>召喚システム</h1>
        <div className="currency-display">
          <div className="currency-item">
            <span className="currency-icon">🪙</span>
            <span className="currency-amount">{currency.gold.toLocaleString()} G</span>
          </div>
          <div className="currency-item">
            <span className="currency-icon">💎</span>
            <span className="currency-amount">{currency.premium} プレミアム</span>
          </div>
          <Button size="small" variant="secondary">購入</Button>
        </div>
      </div>
      
      <div className="gacha-main">
        <div className="banner-selector">
          <div className="banner-tabs">
            {banners.map(banner => (
              <button
                key={banner.id}
                className={`banner-tab ${currentBanner?.id === banner.id ? 'active' : ''}`}
                onClick={() => setCurrentBanner(banner)}
              >
                <div className="banner-tab-content">
                  <span className="banner-name">{banner.name}</span>
                  {banner.type === 'limited' && (
                    <span className="banner-tag limited">期間限定</span>
                  )}
                  {banner.type === 'event' && (
                    <span className="banner-tag event">イベント</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
        
        {currentBanner && (
          <div className="current-banner">
            <div className="banner-info">
              <h2>{currentBanner.name}</h2>
              <p>{currentBanner.description}</p>
              
              <div className="banner-details">
                <div className="detail-section">
                  <h4>開催期間</h4>
                  <p>
                    {new Date(currentBanner.startDate).toLocaleDateString()} 〜 
                    {new Date(currentBanner.endDate).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="detail-section">
                  <h4>確率</h4>
                  <div className="rate-list">
                    <div className="rate-item">
                      <span className="rate-rarity">LEGENDARY</span>
                      <span className="rate-value">{currentBanner.rates.legendary}%</span>
                    </div>
                    <div className="rate-item">
                      <span className="rate-rarity">EPIC</span>
                      <span className="rate-value">{currentBanner.rates.epic}%</span>
                    </div>
                    <div className="rate-item">
                      <span className="rate-rarity">RARE</span>
                      <span className="rate-value">{currentBanner.rates.rare}%</span>
                    </div>
                    <div className="rate-item">
                      <span className="rate-rarity">COMMON</span>
                      <span className="rate-value">{currentBanner.rates.common}%</span>
                    </div>
                  </div>
                </div>
                
                <div className="detail-section">
                  <h4>保証システム</h4>
                  <div className="guarantee-list">
                    <div className="guarantee-item">
                      <span>10連召喚:</span>
                      <span>最低1枚 {currentBanner.guarantees.multiGuarantee.toUpperCase()} 以上</span>
                    </div>
                    <div className="guarantee-item">
                      <span>ピティカウント:</span>
                      <span>
                        {calculatePity(currentBanner.id)}/{currentBanner.guarantees.pityCount}回で
                        {currentBanner.guarantees.pityRarity.toUpperCase()} 確定
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="featured-items">
                <h4>注目アイテム</h4>
                <div className="featured-grid">
                  {currentBanner.featuredItems.map(itemId => {
                    const item = gachaItems.find(i => i.id === itemId);
                    if (!item) return null;
                    
                    return (
                      <div key={item.id} className="featured-item">
                        <div 
                          className="item-preview"
                          style={{ borderColor: getRarityColor(item.rarity) }}
                        />
                        <div className="item-info">
                          <span className="item-name">{item.name}</span>
                          <span className={`item-rarity rarity-${item.rarity}`}>
                            {item.rarity.toUpperCase()}
                          </span>
                          {item.rateUp && (
                            <span className="rate-up">確率UP! ×{item.rateUp}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            <div className="gacha-controls">
              <div className="pull-buttons">
                <Button
                  onClick={() => pullGacha(currentBanner, false)}
                  disabled={isPulling || !hasEnoughCurrency(currentBanner, false)}
                  size="large"
                  variant="primary"
                >
                  <div className="pull-button-content">
                    <span className="pull-type">単発召喚</span>
                    <span className="pull-cost">
                      {formatCurrency(currentBanner.cost.single, currentBanner.cost.currency)}
                    </span>
                  </div>
                </Button>
                
                <Button
                  onClick={() => pullGacha(currentBanner, true)}
                  disabled={isPulling || !hasEnoughCurrency(currentBanner, true)}
                  size="large"
                  variant="primary"
                >
                  <div className="pull-button-content">
                    <span className="pull-type">10連召喚</span>
                    <span className="pull-cost">
                      {formatCurrency(currentBanner.cost.multi, currentBanner.cost.currency)}
                    </span>
                    <span className="pull-bonus">1回分お得!</span>
                  </div>
                </Button>
              </div>
              
              <div className="pity-counter">
                <h4>ピティカウント</h4>
                <div className="pity-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ 
                        width: `${(calculatePity(currentBanner.id) / currentBanner.guarantees.pityCount) * 100}%`,
                        backgroundColor: getRarityColor(currentBanner.guarantees.pityRarity)
                      }}
                    />
                  </div>
                  <span className="pity-text">
                    {calculatePity(currentBanner.id)}/{currentBanner.guarantees.pityCount}回
                  </span>
                </div>
                <p className="pity-info">
                  {currentBanner.guarantees.pityRarity.toUpperCase()}確定まであと
                  {currentBanner.guarantees.pityCount - calculatePity(currentBanner.id)}回
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* ガチャ結果表示 */}
        {showResult && currentResult && (
          <div className="gacha-results">
            <div className="results-header">
              <h3>召喚結果</h3>
              <Button 
                size="small" 
                variant="secondary"
                onClick={() => setShowResult(false)}
              >
                閉じる
              </Button>
            </div>
            
            <div className="results-summary">
              <div className="summary-item">
                <span>新規アイテム:</span>
                <span>{currentResult.newItems.length}個</span>
              </div>
              <div className="summary-item">
                <span>重複アイテム:</span>
                <span>{currentResult.duplicateItems.length}個</span>
              </div>
              <div className="summary-item">
                <span>獲得ポイント:</span>
                <span>{currentResult.pointsEarned}pt</span>
              </div>
            </div>
            
            <div className="results-grid">
              {currentResult.items.map((item, index) => (
                <div 
                  key={`${item.id}-${index}`}
                  className={`result-item ${currentResult.newItems.includes(item.id) ? 'new' : 'duplicate'}`}
                  style={{ borderColor: getRarityColor(item.rarity) }}
                >
                  <div className="item-rarity-indicator" style={{ backgroundColor: getRarityColor(item.rarity) }} />
                  <div className="item-preview" />
                  <div className="item-info">
                    <span className="item-name">{item.name}</span>
                    <span className={`item-rarity rarity-${item.rarity}`}>
                      {item.rarity.toUpperCase()}
                    </span>
                    {currentResult.newItems.includes(item.id) ? (
                      <span className="item-status new">NEW!</span>
                    ) : (
                      <span className="item-status duplicate">+{item.duplicatesConvertTo}pt</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* 召喚履歴 */}
        <div className="gacha-history">
          <h3>最近の召喚履歴</h3>
          <div className="history-list">
            {gachaResults.slice(0, 5).map(result => (
              <div key={result.pullId} className="history-item">
                <span className="history-time">
                  {new Date(result.timestamp).toLocaleTimeString()}
                </span>
                <span className="history-type">
                  {result.isMulti ? '10連召喚' : '単発召喚'}
                </span>
                <span className="history-rarities">
                  {result.items.map(item => (
                    <span 
                      key={item.id}
                      className="rarity-dot"
                      style={{ backgroundColor: getRarityColor(item.rarity) }}
                    />
                  ))}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
