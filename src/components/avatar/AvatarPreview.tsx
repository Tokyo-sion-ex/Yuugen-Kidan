import React from 'react';
import { AvatarCustomization } from '@/types/avatar.types';

interface AvatarPreviewProps {
  customization: AvatarCustomization;
  isEditing?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const AvatarPreview: React.FC<AvatarPreviewProps> = ({
  customization,
  isEditing = false,
  size = 'medium'
}) => {
  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-32 h-32',
    large: 'w-64 h-64'
  };
  
  return (
    <div className={`avatar-preview ${sizeClasses[size]} ${isEditing ? 'editing' : ''}`}>
      <div 
        className="avatar-background"
        style={{
          backgroundImage: `url(/assets/avatar/backgrounds/${customization.background}.png)`
        }}
      >
        {/* 髪型 */}
        {customization.hair && (
          <div 
            className="avatar-part hair"
            style={{
              backgroundImage: `url(/assets/avatar/hair/${customization.hair}.png)`,
              filter: `hue-rotate(${colorToHueRotate(customization.hairColor)})`
            }}
          />
        )}
        
        {/* 服装 */}
        {customization.clothing && (
          <div 
            className="avatar-part clothing"
            style={{
              backgroundImage: `url(/assets/avatar/clothing/${customization.clothing}.png)`,
              filter: `hue-rotate(${colorToHueRotate(customization.clothingColor)})`
            }}
          />
        )}
        
        {/* アクセサリー */}
        {customization.accessories.map((accessory, index) => (
          <div
            key={`${accessory}-${index}`}
            className="avatar-part accessory"
            style={{
              backgroundImage: `url(/assets/avatar/accessories/${accessory}.png)`
            }}
          />
        ))}
      </div>
      
      <div className="expression-indicator">
        {customization.expression === 'happy' && '😊'}
        {customization.expression === 'focused' && '🤔'}
        {customization.expression === 'confident' && '😌'}
        {customization.expression === 'neutral' && '😐'}
      </div>
    </div>
  );
};

// カラーコードをhue-rotate値に変換するヘルパー関数
function colorToHueRotate(color: string): string {
  // 簡易的な変換（実際の実装ではより正確な変換が必要）
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // 簡易的なhue計算
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let hue = 0;
  
  if (max === min) {
    hue = 0;
  } else if (max === r) {
    hue = ((g - b) / (max - min)) % 6;
  } else if (max === g) {
    hue = (b - r) / (max - min) + 2;
  } else {
    hue = (r - g) / (max - min) + 4;
  }
  
  hue = Math.round(hue * 60);
  if (hue < 0) hue += 360;
  
  return `${hue}deg`;
}
