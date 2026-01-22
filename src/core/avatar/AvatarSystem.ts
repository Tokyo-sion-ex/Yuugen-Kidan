import { v4 as uuidv4 } from 'uuid';

export type AvatarPartType = 
  | 'face' 
  | 'hair' 
  | 'eyes' 
  | 'mouth' 
  | 'accessory' 
  | 'clothing' 
  | 'background';

export type AvatarColor = {
  primary: string;
  secondary: string;
  accent: string;
};

export interface AvatarPart {
  id: string;
  type: AvatarPartType;
  name: string;
  assetUrl: string;
  unlockLevel: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  tags: string[];
}

export interface AvatarPreset {
  id: string;
  name: string;
  description: string;
  parts: Record<AvatarPartType, string>; // partIdのマップ
  colors: AvatarColor;
  isDefault: boolean;
}

export interface PlayerAvatar {
  playerId: string;
  presetId: string;
  customParts?: Partial<Record<AvatarPartType, string>>;
  customColors?: Partial<AvatarColor>;
  unlockedParts: Set<string>;
  unlockedPresets: Set<string>;
  selectedAnimation: string;
}

export class AvatarSystem {
  private parts: Map<string, AvatarPart> = new Map();
  private presets: Map<string, AvatarPreset> = new Map();
  private playerAvatars: Map<string, PlayerAvatar> = new Map();
  
  constructor() {
    this.initializeDefaultParts();
    this.initializeDefaultPresets();
  }
  
  // デフォルトパーツの初期化
  private initializeDefaultParts(): void {
    const defaultParts: AvatarPart[] = [
      // 顔
      { id: 'face_default', type: 'face', name: '基本の顔', assetUrl: '/assets/avatar/face/default.svg', unlockLevel: 1, rarity: 'common', tags: ['basic'] },
      { id: 'face_smile', type: 'face', name: '笑顔', assetUrl: '/assets/avatar/face/smile.svg', unlockLevel: 5, rarity: 'common', tags: ['happy'] },
      { id: 'face_cool', type: 'face', name: 'クール', assetUrl: '/assets/avatar/face/cool.svg', unlockLevel: 10, rarity: 'rare', tags: ['cool', 'serious'] },
      
      // 髪型
      { id: 'hair_short', type: 'hair', name: 'ショートヘア', assetUrl: '/assets/avatar/hair/short.svg', unlockLevel: 1, rarity: 'common', tags: ['short', 'simple'] },
      { id: 'hair_long', type: 'hair', name: 'ロングヘア', assetUrl: '/assets/avatar/hair/long.svg', unlockLevel: 3, rarity: 'common', tags: ['long', 'elegant'] },
      { id: 'hair_twintails', type: 'hair', name: 'ツインテール', assetUrl: '/assets/avatar/hair/twintails.svg', unlockLevel: 7, rarity: 'rare', tags: ['cute', 'twintails'] },
      { id: 'hair_spiky', type: 'hair', name: 'スパイキー', assetUrl: '/assets/avatar/hair/spiky.svg', unlockLevel: 12, rarity: 'epic', tags: ['cool', 'edgy'] },
      
      // 目
      { id: 'eyes_default', type: 'eyes', name: '基本の目', assetUrl: '/assets/avatar/eyes/default.svg', unlockLevel: 1, rarity: 'common', tags: ['basic'] },
      { id: 'eyes_sparkle', type: 'eyes', name: 'キラキラ目', assetUrl: '/assets/avatar/eyes/sparkle.svg', unlockLevel: 6, rarity: 'rare', tags: ['cute', 'sparkle'] },
      { id: 'eyes_sharp', type: 'eyes', name: '鋭い目', assetUrl: '/assets/avatar/eyes/sharp.svg', unlockLevel: 15, rarity: 'epic', tags: ['cool', 'serious'] },
      
      // 口
      { id: 'mouth_default', type: 'mouth', name: '基本の口', assetUrl: '/assets/avatar/mouth/default.svg', unlockLevel: 1, rarity: 'common', tags: ['basic'] },
      { id: 'mouth_smile', type: 'mouth', name: '笑い口', assetUrl: '/assets/avatar/mouth/smile.svg', unlockLevel: 4, rarity: 'common', tags: ['happy'] },
      { id: 'mouth_surprised', type: 'mouth', name: '驚き口', assetUrl: '/assets/avatar/mouth/surprised.svg', unlockLevel: 8, rarity: 'rare', tags: ['surprised', 'cute'] },
      
      // アクセサリー
      { id: 'accessory_none', type: 'accessory', name: 'なし', assetUrl: '', unlockLevel: 1, rarity: 'common', tags: ['none'] },
      { id: 'accessory_glasses', type: 'accessory', name: 'メガネ', assetUrl: '/assets/avatar/accessory/glasses.svg', unlockLevel: 5, rarity: 'common', tags: ['glasses', 'smart'] },
      { id: 'accessory_ribbon', type: 'accessory', name: 'リボン', assetUrl: '/assets/avatar/accessory/ribbon.svg', unlockLevel: 9, rarity: 'rare', tags: ['cute', 'ribbon'] },
      { id: 'accessory_crown', type: 'accessory', name: '王冠', assetUrl: '/assets/avatar/accessory/crown.svg', unlockLevel: 20, rarity: 'legendary', tags: ['royal', 'premium'] },
      
      // 服装
      { id: 'clothing_default', type: 'clothing', name: '基本の服', assetUrl: '/assets/avatar/clothing/default.svg', unlockLevel: 1, rarity: 'common', tags: ['basic'] },
      { id: 'clothing_kimono', type: 'clothing', name: '着物', assetUrl: '/assets/avatar/clothing/kimono.svg', unlockLevel: 10, rarity: 'epic', tags: ['traditional', 'elegant'] },
      { id: 'clothing_armor', type: 'clothing', name: '鎧', assetUrl: '/assets/avatar/clothing/armor.svg', unlockLevel: 18, rarity: 'legendary', tags: ['warrior', 'strong'] },
      
      // 背景
      { id: 'background_default', type: 'background', name: '基本の背景', assetUrl: '/assets/avatar/background/default.svg', unlockLevel: 1, rarity: 'common', tags: ['basic'] },
      { id: 'background_sakura', type: 'background', name: '桜背景', assetUrl: '/assets/avatar/background/sakura.svg', unlockLevel: 8, rarity: 'rare', tags: ['spring', 'sakura'] },
      { id: 'background_moon', type: 'background', name: '月背景', assetUrl: '/assets/avatar/background/moon.svg', unlockLevel: 16, rarity: 'epic', tags: ['night', 'moon'] },
    ];
    
    defaultParts.forEach(part => this.parts.set(part.id, part));
  }
  
  // デフォルトプリセットの初期化
  private initializeDefaultPresets(): void {
    const defaultPresets: AvatarPreset[] = [
      {
        id: 'preset_default',
        name: 'デフォルト',
        description: '基本的なアバター',
        parts: {
          face: 'face_default',
          hair: 'hair_short',
          eyes: 'eyes_default',
          mouth: 'mouth_default',
          accessory: 'accessory_none',
          clothing: 'clothing_default',
          background: 'background_default'
        },
        colors: {
          primary: '#4a5568',
          secondary: '#718096',
          accent: '#d4af37'
        },
        isDefault: true
      },
      {
        id: 'preset_cute',
        name: 'キュート',
        description: 'かわいらしいアバター',
        parts: {
          face: 'face_smile',
          hair: 'hair_twintails',
          eyes: 'eyes_sparkle',
          mouth: 'mouth_smile',
          accessory: 'accessory_ribbon',
          clothing: 'clothing_default',
          background: 'background_sakura'
        },
        colors: {
          primary: '#f687b3',
          secondary: '#fbb6ce',
          accent: '#f472b6'
        },
        isDefault: false
      },
      {
        id: 'preset_cool',
        name: 'クール',
        description: 'かっこいいアバター',
        parts: {
          face: 'face_cool',
          hair: 'hair_spiky',
          eyes: 'eyes_sharp',
          mouth: 'mouth_default',
          accessory: 'accessory_glasses',
          clothing: 'clothing_armor',
          background: 'background_moon'
        },
        colors: {
          primary: '#2d3748',
          secondary: '#4a5568',
          accent: '#3182ce'
        },
        isDefault: false
      }
    ];
    
    defaultPresets.forEach(preset => this.presets.set(preset.id, preset));
  }
  
  // プレイヤーアバターの取得または作成
  getPlayerAvatar(playerId: string): PlayerAvatar {
    if (!this.playerAvatars.has(playerId)) {
      const defaultPreset = Array.from(this.presets.values()).find(p => p.isDefault)!;
      
      const newAvatar: PlayerAvatar = {
        playerId,
        presetId: defaultPreset.id,
        unlockedParts: new Set(defaultPreset.parts ? Object.values(defaultPreset.parts) : []),
        unlockedPresets: new Set([defaultPreset.id]),
        selectedAnimation: 'idle'
      };
      
      this.playerAvatars.set(playerId, newAvatar);
    }
    
    return this.playerAvatars.get(playerId)!;
  }
  
  // アバターの更新
  updatePlayerAvatar(playerId: string, updates: Partial<PlayerAvatar>): PlayerAvatar {
    const avatar = this.getPlayerAvatar(playerId);
    const updatedAvatar = { ...avatar, ...updates };
    this.playerAvatars.set(playerId, updatedAvatar);
    return updatedAvatar;
  }
  
  // パーツのロック解除
  unlockPart(playerId: string, partId: string): boolean {
    const part = this.parts.get(partId);
    if (!part) return false;
    
    const avatar = this.getPlayerAvatar(playerId);
    avatar.unlockedParts.add(partId);
    this.playerAvatars.set(playerId, avatar);
    
    return true;
  }
  
  // プリセットのロック解除
  unlockPreset(playerId: string, presetId: string): boolean {
    const preset = this.presets.get(presetId);
    if (!preset) return false;
    
    const avatar = this.getPlayerAvatar(playerId);
    avatar.unlockedPresets.add(presetId);
    this.playerAvatars.set(playerId, avatar);
    
    return true;
  }
  
  // カスタムアバターの作成
  createCustomAvatar(
    playerId: string, 
    parts: Partial<Record<AvatarPartType, string>>,
    colors?: Partial<AvatarColor>
  ): PlayerAvatar {
    const avatar = this.getPlayerAvatar(playerId);
    
    // 新しいプリセットを作成
    const newPresetId = `custom_${uuidv4()}`;
    const basePreset = this.presets.get(avatar.presetId)!;
    
    const newPreset: AvatarPreset = {
      id: newPresetId,
      name: 'カスタム',
      description: 'カスタムアバター',
      parts: { ...basePreset.parts, ...parts },
      colors: { ...basePreset.colors, ...colors },
      isDefault: false
    };
    
    this.presets.set(newPresetId, newPreset);
    
    // プレイヤーに適用
    avatar.presetId = newPresetId;
    if (colors) {
      avatar.customColors = colors;
    }
    if (Object.keys(parts).length > 0) {
      avatar.customParts = parts;
    }
    
    this.playerAvatars.set(playerId, avatar);
    this.unlockPreset(playerId, newPresetId);
    
    return avatar;
  }
  
  // アバターSVGの生成
  generateAvatarSVG(avatar: PlayerAvatar, size: number = 200): string {
    const preset = this.presets.get(avatar.presetId);
    if (!preset) return this.generateFallbackSVG(size);
    
    // パーツの取得
    const parts = { ...preset.parts, ...avatar.customParts };
    const colors = { ...preset.colors, ...avatar.customColors };
    
    // SVGの構築
    const svgParts = Object.entries(parts)
      .filter(([_, partId]) => partId && partId !== 'accessory_none')
      .map(([type, partId]) => {
        const part = this.parts.get(partId);
        if (!part || !part.assetUrl) return '';
        
        // パーツごとの色適用
        let fillColor = colors.primary;
        if (type === 'hair') fillColor = colors.secondary;
        if (type === 'accessory') fillColor = colors.accent;
        
        return `<g class="avatar-part ${type}">
          <image href="${part.assetUrl}" width="${size}" height="${size}" 
                 style="fill: ${fillColor};"/>
        </g>`;
      })
      .filter(Boolean)
      .join('\n');
    
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" 
           xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${colors.primary};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${colors.secondary};stop-opacity:0.8" />
          </linearGradient>
        </defs>
        
        <!-- 背景 -->
        <rect width="100%" height="100%" fill="url(#bg-gradient)" />
        
        <!-- アバターパーツ -->
        ${svgParts}
        
        <!-- アニメーションエフェクト -->
        <circle cx="${size/2}" cy="${size/2}" r="${size/3}" 
                fill="none" stroke="${colors.accent}" 
                stroke-width="2" stroke-dasharray="5,5" 
                opacity="0.3">
          <animate attributeName="r" values="${size/3};${size/2.5};${size/3}" 
                   dur="3s" repeatCount="indefinite" />
        </circle>
      </svg>
    `;
  }
  
  // フォールバックSVG
  private generateFallbackSVG(size: number): string {
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" 
           xmlns="http://www.w3.org/2000/svg">
        <circle cx="${size/2}" cy="${size/2}" r="${size/2.5}" 
                fill="#4a5568" />
        <circle cx="${size/3}" cy="${size/3}" r="${size/12}" 
                fill="#ffffff" />
        <circle cx="${2*size/3}" cy="${size/3}" r="${size/12}" 
                fill="#ffffff" />
        <path d="M ${size/3} ${2*size/3} Q ${size/2} ${3*size/4} ${2*size/3} ${2*size/3}" 
              stroke="#ffffff" stroke-width="3" fill="none" />
      </svg>
    `;
  }
  
  // アバターのデータURLを取得
  getAvatarDataURL(avatar: PlayerAvatar, size: number = 200): string {
    const svg = this.generateAvatarSVG(avatar, size);
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    return URL.createObjectURL(blob);
  }
  
  // 利用可能なパーツの取得
  getAvailableParts(playerLevel: number, filter?: {
    type?: AvatarPartType;
    rarity?: AvatarPart['rarity'][];
    tags?: string[];
  }): AvatarPart[] {
    return Array.from(this.parts.values()).filter(part => {
      // レベルチェック
      if (part.unlockLevel > playerLevel) return false;
      
      // タイプフィルター
      if (filter?.type && part.type !== filter.type) return false;
      
      // レアリティフィルター
      if (filter?.rarity && !filter.rarity.includes(part.rarity)) return false;
      
      // タグフィルター
      if (filter?.tags && !filter.tags.some(tag => part.tags.includes(tag))) {
        return false;
      }
      
      return true;
    });
  }
  
  // 利用可能なプリセットの取得
  getAvailablePresets(playerLevel: number): AvatarPreset[] {
    return Array.from(this.presets.values()).filter(preset => {
      // デフォルトプリセットは常に利用可能
      if (preset.isDefault) return true;
      
      // プリセットに含まれるパーツの最大必要レベルを計算
      const maxLevel = Math.max(
        ...Object.values(preset.parts)
          .map(partId => this.parts.get(partId)?.unlockLevel || 0)
      );
      
      return maxLevel <= playerLevel;
    });
  }
  
  // アバターの保存（ローカルストレージ）
  saveAvatarToStorage(playerId: string): void {
    const avatar = this.getPlayerAvatar(playerId);
    const storageKey = `avatar_${playerId}`;
    
    const serializableAvatar = {
      ...avatar,
      unlockedParts: Array.from(avatar.unlockedParts),
      unlockedPresets: Array.from(avatar.unlockedPresets)
    };
    
    localStorage.setItem(storageKey, JSON.stringify(serializableAvatar));
  }
  
  // アバターの読み込み（ローカルストレージ）
  loadAvatarFromStorage(playerId: string): PlayerAvatar | null {
    const storageKey = `avatar_${playerId}`;
    const saved = localStorage.getItem(storageKey);
    
    if (!saved) return null;
    
    try {
      const parsed = JSON.parse(saved);
      const avatar: PlayerAvatar = {
        ...parsed,
        unlockedParts: new Set(parsed.unlockedParts),
        unlockedPresets: new Set(parsed.unlockedPresets)
      };
      
      this.playerAvatars.set(playerId, avatar);
      return avatar;
    } catch (error) {
      console.error('Failed to load avatar from storage:', error);
      return null;
    }
  }
  
  // アバターレベル計算（プレイヤーの進捗に基づく）
  calculateAvatarLevel(playerStats: {
    gamesPlayed: number;
    gamesWon: number;
    totalPoints: number;
    achievements: number;
  }): number {
    const { gamesPlayed, gamesWon, totalPoints, achievements } = playerStats;
    
    // 経験値計算式
    const baseExp = gamesPlayed * 10;
    const winBonus = gamesWon * 50;
    const pointsExp = Math.floor(totalPoints / 1000);
    const achievementExp = achievements * 100;
    
    const totalExp = baseExp + winBonus + pointsExp + achievementExp;
    
    // レベル計算（1000EXPごとにレベルアップ）
    return Math.floor(totalExp / 1000) + 1;
  }
  
  // アバターのバッジ取得
  getAvatarBadges(avatar: PlayerAvatar): Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
  }> {
    const badges = [];
    const unlockedPartsCount = avatar.unlockedParts.size;
    
    // コレクターバッジ
    if (unlockedPartsCount >= 50) {
      badges.push({
        id: 'collector_master',
        name: 'コレクターマスター',
        description: '50個以上のパーツをコレクション',
        icon: '🏆'
      });
    } else if (unlockedPartsCount >= 20) {
      badges.push({
        id: 'collector_expert',
        name: 'コレクターエキスパート',
        description: '20個以上のパーツをコレクション',
        icon: '⭐'
      });
    }
    
    // レアリティバッジ
    const parts = Array.from(avatar.unlockedParts)
      .map(id => this.parts.get(id))
      .filter(Boolean) as AvatarPart[];
    
    const legendaryCount = parts.filter(p => p.rarity === 'legendary').length;
    if (legendaryCount >= 3) {
      badges.push({
        id: 'legendary_collector',
        name: 'レジェンダリーコレクター',
        description: '伝説のパーツを3つ以上所持',
        icon: '👑'
      });
    }
    
    return badges;
  }
}
