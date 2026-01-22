import React, { useState } from 'react';
import { usePlayerProfileStore } from '@/store/playerProfileStore';
import { AvatarPart } from '@/types/avatar.types';
import { AvatarPreview } from './AvatarPreview';
import { AvatarPartsSelector } from './AvatarPartsSelector';
import { Button } from '@/components/ui/Button';

// サンプルのアバターパーツデータ
const AVATAR_PARTS: AvatarPart[] = [
  {
    id: 'hair_01',
    name: '月下の長髪',
    type: 'hair',
    rarity: 'common',
    unlockLevel: 1,
    assetPath: '/assets/avatar/hair/hair_01.png',
    colorable: true,
    defaultColor: '#4A2C2A'
  },
  {
    id: 'hair_02',
    name: '桜の短髪',
    type: 'hair',
    rarity: 'rare',
    unlockLevel: 5,
    assetPath: '/assets/avatar/hair/hair_02.png',
    colorable: true,
    defaultColor: '#E75480'
  },
  {
    id: 'kimono_01',
    name: '藍染の着物',
    type: 'clothing',
    rarity: 'common',
    unlockLevel: 1,
    assetPath: '/assets/avatar/clothing/kimono_01.png',
    colorable: true,
    defaultColor: '#1B365D'
  },
  {
    id: 'kimono_02',
    name: '金彩の羽織',
    type: 'clothing',
    rarity: 'epic',
    unlockLevel: 10,
    assetPath: '/assets/avatar/clothing/kimono_02.png',
    colorable: true,
    defaultColor: '#2C1810'
  },
  {
    id: 'fan_01',
    name: '和紙の扇子',
    type: 'accessory',
    rarity: 'common',
    unlockLevel: 3,
    assetPath: '/assets/avatar/accessories/fan_01.png',
    colorable: false
  },
  {
    id: 'mask_01',
    name: '狐の面',
    type: 'accessory',
    rarity: 'rare',
    unlockLevel: 7,
    assetPath: '/assets/avatar/accessories/mask_01.png',
    colorable: false
  }
];

export const AvatarCustomizer: React.FC = () => {
  const { 
    profile, 
    isEditing, 
    editingAvatar, 
    updateAvatar, 
    startEditing, 
    saveProfile,
    unlockPart
  } = usePlayerProfileStore();
  
  const [selectedPartType, setSelectedPartType] = useState<'hair' | 'clothing' | 'accessory' | 'background'>('hair');
  const [selectedColor, setSelectedColor] = useState<string>('#4A2C2A');
  
  const filteredParts = AVATAR_PARTS.filter(part => 
    part.type === selectedPartType && 
    (profile?.unlockedParts.includes(part.id) || part.unlockLevel <= 1)
  );
  
  const handlePartSelect = (partId: string) => {
    const part = AVATAR_PARTS.find(p => p.id === partId);
    if (!part) return;
    
    if (selectedPartType === 'hair') {
      updateAvatar({ hair: partId, hairColor: selectedColor });
    } else if (selectedPartType === 'clothing') {
      updateAvatar({ clothing: partId, clothingColor: selectedColor });
    } else if (selectedPartType === 'accessory') {
      const currentAccessories = editingAvatar?.accessories || [];
      const newAccessories = currentAccessories.includes(partId)
        ? currentAccessories.filter(id => id !== partId)
        : [...currentAccessories, partId].slice(0, 3); // 最大3つ
      updateAvatar({ accessories: newAccessories });
    }
  };
  
  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    if (selectedPartType === 'hair') {
      updateAvatar({ hairColor: color });
    } else if (selectedPartType === 'clothing') {
      updateAvatar({ clothingColor: color });
    }
  };
  
  if (!profile) {
    return (
      <div className="avatar-customizer">
        <p>プロフィールを読み込んでいます...</p>
      </div>
    );
  }
  
  const currentAvatar = isEditing ? editingAvatar : profile.avatar;
  
  return (
    <div className="avatar-customizer">
      <div className="customizer-header">
        <h2>アバターカスタマイズ</h2>
        {!isEditing ? (
          <Button onClick={startEditing}>編集を開始</Button>
        ) : (
          <div className="edit-controls">
            <Button onClick={saveProfile} variant="primary">保存</Button>
            <Button onClick={() => {}} variant="secondary">キャンセル</Button>
          </div>
        )}
      </div>
      
      <div className="customizer-container">
        <div className="avatar-preview-section">
          <AvatarPreview 
            customization={currentAvatar!} 
            isEditing={isEditing}
          />
          
          {isEditing && (
            <div className="color-picker">
              <label>色を選択</label>
              <input 
                type="color" 
                value={selectedColor}
                onChange={(e) => handleColorChange(e.target.value)}
              />
              <div className="preset-colors">
                {['#4A2C2A', '#1B365D', '#E75480', '#2C1810', '#FFFFFF'].map(color => (
                  <button
                    key={color}
                    className="color-swatch"
                    style={{ backgroundColor: color }}
                    onClick={() => handleColorChange(color)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        
        {isEditing && (
          <div className="parts-selector-section">
            <div className="part-type-tabs">
              {(['hair', 'clothing', 'accessory', 'background'] as const).map(type => (
                <button
                  key={type}
                  className={`type-tab ${selectedPartType === type ? 'active' : ''}`}
                  onClick={() => setSelectedPartType(type)}
                >
                  {type === 'hair' && '髪型'}
                  {type === 'clothing' && '服装'}
                  {type === 'accessory' && 'アクセサリー'}
                  {type === 'background' && '背景'}
                </button>
              ))}
            </div>
            
            <AvatarPartsSelector
              parts={filteredParts}
              selectedPartType={selectedPartType}
              currentAvatar={currentAvatar!}
              onSelectPart={handlePartSelect}
            />
          </div>
        )}
      </div>
    </div>
  );
};
