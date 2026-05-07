import React, { useState, useEffect } from 'react';
import { useRoomStore } from '../store/roomStore';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { THEME_PRESET_MAP } from '../components/layout/MainLayout';
import ResourceBoard from '../components/resources/ResourceBoard';
import ChatPanel from '../components/chat/ChatPanel';
import RoomSettingsModal from '../components/modals/RoomSettingsModal';

export default function Dashboard() {
  const { currentRoom, createRoom, joinRoom, isLoading, error, restoreRoom } = useRoomStore();
  const { user } = useAuthStore();
  const { unreads, clearRoomUnreads } = useNotificationStore();
  
  const [activeTab, setActiveTab] = useState<'resources' | 'chat'>(() => {
    return (localStorage.getItem('activeWorkspaceTab') as 'resources' | 'chat') || 'resources';
  });
  const [isRoomSettingsOpen, setIsRoomSettingsOpen] = useState(false);

  useEffect(() => {
    if (currentRoom) {
      localStorage.setItem('activeWorkspaceTab', activeTab);
      clearRoomUnreads(currentRoom._id, activeTab === 'resources' ? 'resource' : 'chat');
    }
  }, [activeTab, currentRoom?._id, clearRoomUnreads]);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [joinCode, setJoinCode] = useState('');

  // Determine owner/admin role
  const currentMember = currentRoom?.members.find((m) => m.user._id === user?._id);
  const isOwnerOrAdmin = currentMember?.role === 'owner' || currentMember?.role === 'admin';

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createRoom({ name: roomName });
    setIsCreating(false);
    setRoomName('');
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    await joinRoom(joinCode);
    setIsJoining(false);
    setJoinCode('');
  };

  if (currentRoom) {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
        {/* Archived warning banner */}
        {currentRoom.isArchived && (
          <div className="bg-amber-500/15 border-b border-amber-500/25 px-6 py-2.5 flex items-center justify-between text-xs text-amber-700 dark:text-amber-400 gap-4 shrink-0 font-medium">
            <div className="flex items-center gap-2">
              <span className="text-sm">⚠️</span>
              <span>This workspace is archived and read-only. No new messages, notes, edits, or uploads are allowed.</span>
            </div>
            {currentRoom.members.some(m => m.user?._id === user?._id && m.role === 'owner') && (
              <button
                onClick={async () => {
                  try {
                    await restoreRoom(currentRoom._id);
                  } catch (err: any) {
                    alert(err.message || 'Failed to restore room');
                  }
                }}
                className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-3 py-1 rounded-md shadow-sm transition-all text-[11px]"
              >
                Restore Workspace
              </button>
            )}
          </div>
        )}

        {/* Workspace Tab Header */}
        <div className="bg-card border-b border-border/60 px-6 py-3 flex flex-col sm:flex-row items-center justify-between shrink-0 gap-3">
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <div 
              className="h-10 w-10 rounded-xl flex items-center justify-center font-bold border shadow-sm text-lg text-white"
              style={{ background: THEME_PRESET_MAP[currentRoom.appearance?.themePreset || 'purple'] || THEME_PRESET_MAP.purple }}
            >
              {currentRoom.appearance?.icon || currentRoom.icon || '🏫'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-foreground text-base leading-none">{currentRoom.name}</h1>
                {currentRoom.expirySettings?.enabled && currentRoom.expirySettings?.expiresAt && (
                  (() => {
                    const diff = new Date(currentRoom.expirySettings.expiresAt).getTime() - Date.now();
                    if (diff <= 0) return <span className="bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-bold px-2 py-0.5 rounded-full">🕒 Expired</span>;
                    const hours = Math.floor(diff / (1000 * 60 * 60));
                    const days = Math.floor(hours / 24);
                    const label = days > 0 ? `${days}d left` : `${hours}h left`;
                    return (
                      <span className="bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1">
                        🕒 {label}
                      </span>
                    );
                  })()
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{currentRoom.members.length} Active Members</p>
            </div>
          </div>

          {/* Tab Pill Switches */}
          <div className="flex bg-muted/60 p-1 rounded-xl border border-border/45 scale-95 shrink-0">
            <button
              onClick={() => setActiveTab('resources')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'resources'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>📂</span>
              <span>Resource Board</span>
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'chat'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>💬</span>
              <span>Room Chat</span>
              {currentRoom && (unreads[currentRoom._id]?.unreadChats || 0) > 0 && (
                <span className="bg-rose-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full shadow-sm animate-pulse ml-0.5">
                  {unreads[currentRoom._id].unreadChats}
                </span>
              )}
            </button>
          </div>

          {/* Invitation and Settings Actions */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 bg-muted/40 border px-3 py-1.5 rounded-lg text-xs font-mono font-bold tracking-wider text-muted-foreground self-end sm:self-auto">
              <span>INVITE CODE:</span>
              <span className="text-primary uppercase selection:bg-primary/20">{currentRoom.joinCode}</span>
            </div>

            {isOwnerOrAdmin && (
              <button
                onClick={() => setIsRoomSettingsOpen(true)}
                className="p-1.5 border border-border hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                title="Room Settings"
              >
                ⚙️ Settings
              </button>
            )}
          </div>
        </div>

        {/* Cohesive workspace render area */}
        <div className="flex-1 overflow-hidden relative flex">
          {activeTab === 'resources' ? <ResourceBoard /> : <ChatPanel />}
        </div>

        {/* Room Settings Customizer Modal */}
        {isRoomSettingsOpen && (
          <RoomSettingsModal
            isOpen={isRoomSettingsOpen}
            onClose={() => setIsRoomSettingsOpen(false)}
            room={currentRoom}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center h-full bg-background text-foreground">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight">Welcome to StudyVault</h2>
          <p className="mt-4 text-sm text-muted-foreground">
            Select a room from the sidebar, or create/join a new one to get started.
          </p>
        </div>

        {error && (
          <div className="bg-destructive/15 text-destructive p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-4 mt-8">
          {/* Create Room */}
          {isCreating ? (
            <form onSubmit={handleCreate} className="bg-card border border-border p-4 rounded-xl shadow-sm text-left">
              <label className="block text-sm font-medium mb-1 text-foreground">Room Name</label>
              <input 
                autoFocus
                required
                minLength={3}
                className="w-full px-3 py-2 bg-background border border-input rounded-md mb-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="e.g. CS101 Study Group"
              />
              <div className="flex gap-2">
                <button type="submit" disabled={isLoading} className="flex-1 bg-primary text-primary-foreground py-2 rounded-md font-medium text-sm hover:bg-primary/90">
                  {isLoading ? 'Creating...' : 'Create'}
                </button>
                <button type="button" onClick={() => setIsCreating(false)} className="px-4 bg-muted text-muted-foreground rounded-md text-sm hover:bg-muted/80">
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button onClick={() => setIsCreating(true)} className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold shadow-sm hover:bg-primary/90 transition-colors">
              Create New Room
            </button>
          )}

          {/* Join Room */}
          {isJoining ? (
            <form onSubmit={handleJoin} className="bg-card border border-border p-4 rounded-xl shadow-sm text-left">
              <label className="block text-sm font-medium mb-1 text-foreground">Join Code</label>
              <input 
                autoFocus
                required
                minLength={8}
                maxLength={8}
                className="w-full px-3 py-2 bg-background border border-input rounded-md mb-3 font-mono tracking-widest uppercase text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toLowerCase())}
                placeholder="8-char code"
              />
              <div className="flex gap-2">
                <button type="submit" disabled={isLoading} className="flex-1 bg-secondary text-secondary-foreground py-2 rounded-md font-medium text-sm hover:bg-secondary/80">
                  {isLoading ? 'Joining...' : 'Join'}
                </button>
                <button type="button" onClick={() => setIsJoining(false)} className="px-4 bg-muted text-muted-foreground rounded-md text-sm hover:bg-muted/80">
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button onClick={() => setIsJoining(true)} className="w-full bg-secondary text-secondary-foreground py-3 rounded-xl font-semibold shadow-sm hover:bg-secondary/80 transition-colors">
              Join with Code
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
