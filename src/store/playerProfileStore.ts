import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PlayerProfile, AvatarCustomization } from '@/types/avatar.types';

interface PlayerProfileStore {
  profile: PlayerProfile | null;
  isEditing: boolean;
  
  // アクション
  loadProfile: (playerId: string) => Promise<void>;
  createProfile: (username: string) => Promise<void>;
  updateAvatar: (customization: Partial<AvatarCustomization>) => void;
  unlockPart: (partId: string) => void;
  selectTitle: (titleId: string) => void;
  startEditing: () => void;
  saveProfile: () => Promise<void>;
  
  // 一時的な編集状態
  editingAvatar: AvatarCustomization | null;
}

export const usePlayerProfileStore = create<PlayerProfileStore>()(
  persist(
    (set, get) => ({
      profile: null,
      isEditing: false,
      editingAvatar: null,
      
      loadProfile: async (playerId) => {
        // TODO: バックエンドAPIから取得
        const mockProfile: PlayerProfile = {
          playerId,
          username: '雀士',
          avatar: {
            hair: 'hair_01',
            hairColor: '#4A2C2A',
            clothing: 'kimono_01',
            clothingColor: '#1B365D',
            accessories: ['fan_01'],
            background: 'bg_moonlight',
            expression: 'neutral'
          },
          unlockedParts: ['hair_01', 'kimono_01', 'fan_01', 'bg_moonlight'],
          createdAt: new Date(),
          updatedAt: new Date()
        };
        set({ profile: mockProfile });
      },
      
      createProfile: async (username) => {
        const defaultAvatar: AvatarCustomization = {
          hair: 'hair_default',
          hairColor: '#000000',
          clothing: 'kimono_default',
          clothingColor: '#2C3E50',
          accessories: [],
          background: 'bg_default',
          expression: 'neutral'
        };
        
        const newProfile: PlayerProfile = {
          playerId: `player_${Date.now()}`,
          username,
          avatar: defaultAvatar,
          unlockedParts: ['hair_default', 'kimono_default', 'bg_default'],
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        set({ profile: newProfile });
      },
      
      updateAvatar: (customization) => {
        const { profile, editingAvatar } = get();
        if (!profile) return;
        
        const currentAvatar = editingAvatar || profile.avatar;
        const updatedAvatar = { ...currentAvatar, ...customization };
        
        set({ editingAvatar: updatedAvatar });
      },
      
      unlockPart: (partId) => {
        const { profile } = get();
        if (!profile) return;
        
        const updatedProfile = {
          ...profile,
          unlockedParts: [...new Set([...profile.unlockedParts, partId])],
          updatedAt: new Date()
        };
        
        set({ profile: updatedProfile });
      },
      
      selectTitle: (titleId) => {
        const { profile } = get();
        if (!profile) return;
        
        set({
          profile: {
            ...profile,
            selectedTitle: titleId,
            updatedAt: new Date()
          }
        });
      },
      
      startEditing: () => {
        const { profile } = get();
        if (!profile) return;
        
        set({
          isEditing: true,
          editingAvatar: { ...profile.avatar }
        });
      },
      
      saveProfile: async () => {
        const { profile, editingAvatar } = get();
        if (!profile || !editingAvatar) return;
        
        const updatedProfile = {
          ...profile,
          avatar: editingAvatar,
          updatedAt: new Date()
        };
        
        // TODO: バックエンドAPIに保存
        set({
          profile: updatedProfile,
          isEditing: false,
          editingAvatar: null
        });
      }
    }),
    {
      name: 'player-profile-storage'
    }
  )
);
