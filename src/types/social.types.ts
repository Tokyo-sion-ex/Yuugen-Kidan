export interface PlayerFriend {
  id: string;
  username: string;
  avatar: string;
  status: 'online' | 'offline' | 'in_game' | 'away';
  lastSeen: Date;
  friendshipLevel: number;
  isFavorite: boolean;
  mutualFriends: number;
  lastPlayedTogether?: Date;
}

export interface Guild {
  id: string;
  name: string;
  tag: string;
  description: string;
  leaderId: string;
  members: GuildMember[];
  memberCount: number;
  maxMembers: number;
  level: number;
  experience: number;
  rank: number;
  joinType: 'open' | 'approval' | 'invite_only';
  requirements?: {
    minRank?: number;
    minGames?: number;
  };
  announcements: GuildAnnouncement[];
  events: GuildEvent[];
  createdAt: Date;
}

export interface GuildMember {
  playerId: string;
  username: string;
  role: 'leader' | 'officer' | 'member' | 'recruit';
  joinedAt: Date;
  contribution: number;
  lastActive: Date;
}

export interface GuildAnnouncement {
  id: string;
  authorId: string;
  title: string;
  content: string;
  priority: 'normal' | 'important' | 'urgent';
  createdAt: Date;
  expiresAt?: Date;
}

export interface GuildEvent {
  id: string;
  type: 'tournament' | 'practice' | 'social' | 'training';
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  organizerId: string;
  participants: string[];
  maxParticipants: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
}
