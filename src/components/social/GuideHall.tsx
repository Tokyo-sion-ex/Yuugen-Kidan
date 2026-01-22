import React, { useState } from 'react';
import { Guild, GuildEvent, GuildAnnouncement } from '@/types/social.types';
import { Button } from '@/components/ui/Button';

export const GuildHall: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'events' | 'announcements' | 'settings'>('overview');
  const [guild, setGuild] = useState<Guild>({
    id: 'guild_1',
    name: '月下雀荘',
    tag: '月雀',
    description: '月明かりの下で切磋琢磨する雀士たちの集い',
    leaderId: 'player_leader',
    members: Array.from({ length: 25 }, (_, i) => ({
      playerId: `member_${i}`,
      username: `雀士${i + 1}`,
      role: i === 0 ? 'leader' : i < 5 ? 'officer' : i < 10 ? 'member' : 'recruit',
      joinedAt: new Date(Date.now() - i * 86400000),
      contribution: Math.floor(Math.random() * 10000),
      lastActive: new Date(Date.now() - Math.random() * 86400000)
    })),
    memberCount: 25,
    maxMembers: 50,
    level: 15,
    experience: 12500,
    rank: 42,
    joinType: 'approval',
    requirements: {
      minRank: 1000,
      minGames: 50
    },
    announcements: [],
    events: [],
    createdAt: new Date('2024-01-01')
  });
  
  const [announcements, setAnnouncements] = useState<GuildAnnouncement[]>([
    {
      id: 'ann_1',
      authorId: 'leader',
      title: '月例大会の開催について',
      content: '来週の日曜日に月例大会を開催します。多数のご参加をお待ちしています。',
      priority: 'important',
      createdAt: new Date(Date.now() - 86400000)
    }
  ]);
  
  const [events, setEvents] = useState<GuildEvent[]>([
    {
      id: 'event_1',
      type: 'tournament',
      title: '雀荘内ランキング戦',
      description: '雀荘内の順位を決定する月例大会',
      startTime: new Date(Date.now() + 7 * 86400000),
      endTime: new Date(Date.now() + 7 * 86400000 + 3 * 3600000),
      organizerId: 'leader',
      participants: ['member_1', 'member_2', 'member_3'],
      maxParticipants: 16,
      status: 'upcoming'
    }
  ]);
  
  const [applications, setApplications] = useState([
    { id: 'app_1', username: '申請者A', rank: 1200, games: 60, appliedAt: new Date() }
  ]);
  
  const calculateGuildProgress = () => {
    const nextLevelExp = guild.level * 1000;
    return (guild.experience / nextLevelExp) * 100;
  };
  
  const renderOverview = () => (
    <div className="guild-overview">
      <div className="guild-header">
        <div className="guild-banner">
          <h1 className="guild-name">{guild.name}</h1>
          <span className="guild-tag">[{guild.tag}]</span>
          <span className="guild-level">Lv.{guild.level}</span>
        </div>
        
        <div className="guild-stats">
          <div className="stat">
            <span className="stat-label">ランキング</span>
            <span className="stat-value">#{guild.rank}</span>
          </div>
          <div className="stat">
            <span className="stat-label">メンバー</span>
            <span className="stat-value">{guild.memberCount}/{guild.maxMembers}</span>
          </div>
          <div className="stat">
            <span className="stat-label">経験値</span>
            <span className="stat-value">{guild.experience.toLocaleString()}</span>
          </div>
        </div>
      </div>
      
      <div className="guild-progress">
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${calculateGuildProgress()}%` }}
          />
        </div>
        <span className="progress-text">
          次のレベルまで: {guild.level * 1000 - guild.experience} EXP
        </span>
      </div>
      
      <div className="guild-description">
        <h3>雀荘紹介</h3>
        <p>{guild.description}</p>
      </div>
      
      <div className="guild-requirements">
        <h3>入会条件</h3>
        <div className="requirements-list">
          <div className="requirement">
            <span className="requirement-label">最低段位:</span>
            <span className="requirement-value">{guild.requirements?.minRank || 'なし'}</span>
          </div>
          <div className="requirement">
            <span className="requirement-label">最低対戦数:</span>
            <span className="requirement-value">{guild.requirements?.minGames || 'なし'}</span>
          </div>
          <div className="requirement">
            <span className="requirement-label">入会方法:</span>
            <span className="requirement-value">
              {guild.joinType === 'open' ? '自由参加' : 
               guild.joinType === 'approval' ? '承認制' : '招待制'}
            </span>
          </div>
        </div>
      </div>
      
      <div className="guild-actions">
        <Button variant="primary">雀荘対戦を開始</Button>
        <Button variant="secondary">雀荘チャット</Button>
        <Button variant="ghost">メンバーを招待</Button>
      </div>
    </div>
  );
  
  const renderMembers = () => (
    <div className="guild-members">
      <div className="members-header">
        <h3>メンバー一覧</h3>
        <div className="member-filters">
          <select>
            <option>役職で絞り込み</option>
            <option>貢献度順</option>
            <option>最近の活動順</option>
          </select>
        </div>
      </div>
      
      <div className="members-table">
        <div className="table-header">
          <div className="col-name">プレイヤー名</div>
          <div className="col-role">役職</div>
          <div className="col-contribution">貢献度</div>
          <div className="col-joined">入会日</div>
          <div className="col-last-active">最終活動</div>
          <div className="col-actions">操作</div>
        </div>
        
        <div className="table-body">
          {guild.members.map(member => (
            <div key={member.playerId} className="member-row">
              <div className="col-name">
                <div className="member-avatar" />
                <span className="member-username">{member.username}</span>
              </div>
              <div className="col-role">
                <span className={`role-badge role-${member.role}`}>
                  {member.role === 'leader' ? '雀荘長' :
                   member.role === 'officer' ? '幹部' :
                   member.role === 'member' ? '正会員' : '見習い'}
                </span>
              </div>
              <div className="col-contribution">
                {member.contribution.toLocaleString()}
              </div>
              <div className="col-joined">
                {new Date(member.joinedAt).toLocaleDateString()}
              </div>
              <div className="col-last-active">
                {Math.floor((Date.now() - member.lastActive.getTime()) / 86400000)}日前
              </div>
              <div className="col-actions">
                <Button size="small">メッセージ</Button>
                {member.role !== 'leader' && (
                  <Button size="small" variant="secondary">役職変更</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  
  const renderAnnouncements = () => (
    <div className="guild-announcements">
      <div className="announcements-header">
        <h3>お知らせ</h3>
        <Button size="small">新規作成</Button>
      </div>
      
      <div className="announcements-list">
        {announcements.map(announcement => (
          <div key={announcement.id} className={`announcement-card priority-${announcement.priority}`}>
            <div className="announcement-header">
              <h4>{announcement.title}</h4>
              <span className="announcement-date">
                {new Date(announcement.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className="announcement-content">{announcement.content}</p>
            {announcement.expiresAt && (
              <div className="announcement-expiry">
                期限: {new Date(announcement.expiresAt).toLocaleDateString()}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
  
  return (
    <div className="guild-hall">
      <div className="guild-tabs">
        <button
          className={`guild-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          雀荘情報
        </button>
        <button
          className={`guild-tab ${activeTab === 'members' ? 'active' : ''}`}
          onClick={() => setActiveTab('members')}
        >
          メンバー ({guild.memberCount})
        </button>
        <button
          className={`guild-tab ${activeTab === 'announcements' ? 'active' : ''}`}
          onClick={() => setActiveTab('announcements')}
        >
          お知らせ ({announcements.length})
        </button>
        <button
          className={`guild-tab ${activeTab === 'events' ? 'active' : ''}`}
          onClick={() => setActiveTab('events')}
        >
          イベント ({events.length})
        </button>
        <button
          className={`guild-tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          設定
        </button>
      </div>
      
      <div className="guild-content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'members' && renderMembers()}
        {activeTab === 'announcements' && renderAnnouncements()}
        {activeTab === 'events' && (
          <div className="guild-events">
            <h3>雀荘イベント</h3>
            <div className="events-grid">
              {events.map(event => (
                <div key={event.id} className="event-card">
                  <div className="event-header">
                    <span className={`event-type type-${event.type}`}>
                      {event.type === 'tournament' ? '大会' :
                       event.type === 'practice' ? '練習会' :
                       event.type === 'social' ? '交流会' : '勉強会'}
                    </span>
                    <span className="event-status">{event.status}</span>
                  </div>
                  <h4>{event.title}</h4>
                  <p>{event.description}</p>
                  <div className="event-details">
                    <span>開催: {new Date(event.startTime).toLocaleString()}</span>
                    <span>参加者: {event.participants.length}/{event.maxParticipants}</span>
                  </div>
                  <div className="event-actions">
                    <Button size="small">参加する</Button>
                    <Button size="small" variant="secondary">詳細</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {activeTab === 'settings' && (
          <div className="guild-settings">
            <h3>雀荘設定</h3>
            {/* 設定フォーム */}
          </div>
        )}
      </div>
      
      <div className="guild-sidebar">
        <div className="sidebar-section">
          <h4>雀荘申請 ({applications.length})</h4>
          {applications.map(app => (
            <div key={app.id} className="application-item">
              <span>{app.username}</span>
              <div className="application-actions">
                <Button size="small">承認</Button>
                <Button size="small" variant="secondary">拒否</Button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="sidebar-section">
          <h4>最近の活動</h4>
          {/* 活動ログ */}
        </div>
        
        <div className="sidebar-section">
          <h4>雀荘ランキング</h4>
          {/* ランキング表示 */}
        </div>
      </div>
    </div>
  );
};
