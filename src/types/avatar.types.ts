export interface AvatarPart {
  id: string;
  name: string;
  type: 'hair' | 'clothing' | 'accessory' | 'background';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockLevel: number;
  assetPath: string;
  colorable: boolean;
  defaultColor?: string;
}

export interface AvatarCustomization {
  hair: string;
  hairColor: string;
  clothing: string;
  clothingColor: string;
  accessories: string[];
  background: string;
  expression: 'neutral' | 'happy' | 'focused' | 'confident';
}

export interface PlayerProfile {
  playerId: string;
  username: string;
  avatar: AvatarCustomization;
  unlockedParts: string[];
  selectedTitle?: string;
  createdAt: Date;
  updatedAt: Date;
}
