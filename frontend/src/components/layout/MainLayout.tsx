import React, { useEffect, useState } from 'react';
import { useRoomStore } from '../../store/roomStore';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import { useNotificationStore } from '../../store/notificationStore';
import ThemeSwitcher from './ThemeSwitcher';
import UserProfileModal from '../modals/UserProfileModal';

export const THEME_PRESET_MAP: Record<string, string> = {
  purple: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
  blue: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
  green: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
  orange: 'linear-gradient(135deg, #f97316 0%, #c2410c 100%)',
  pink: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
  cyber: 'linear-gradient(135deg, #06b6d4 0%, #4f46e5 100%)',
  academic: 'linear-gradient(135deg, #64748b 0%, #334155 100%)',
  'dark-minimal': 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
};

export const AVATAR_COLOR_MAP: Record<string, string> = {
  purple: '#8b5cf6',
  blue: '#3b82f6',
  green: '#10b981',
  orange: '#f59e0b',
  pink: '#ec4899',
  cyber: '#06b6d4',
  academic: '#64748b',
  'dark-minimal': '#1e293b',
};

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { rooms, fetchRooms, currentRoom, setCurrentRoom } = useRoomStore();
  const { user, logout } = useAuthStore();
  const { socket } = useChatStore();
  const { unreads, fetchUnreads, clearRoomUnreads, syncWithSocket } = useNotificationStore();

  // Sidebar Layout States
  const [isSidebarPinned, setIsSidebarPinned] = useState(() => {
    const saved = localStorage.getItem('studyvault_sidebar_pinned');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [isHovered, setIsHovered] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    fetchRooms();
    fetchUnreads();
  }, [fetchRooms, fetchUnreads]);

  useEffect(() => {
    if (socket) {
      syncWithSocket(socket);
    }
  }, [socket, syncWithSocket]);

  const toggleSidebarPin = () => {
    const nextState = !isSidebarPinned;
    setIsSidebarPinned(nextState);
    localStorage.setItem('studyvault_sidebar_pinned', JSON.stringify(nextState));
  };

  // Determine active width
  const isExpanded = isSidebarPinned || isHovered;

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-background overflow-hidden relative text-foreground">
      {/* Mobile Top Header (only visible on small screens) */}
      <div className="md:hidden sticky top-0 left-0 right-0 h-14 border-b border-border bg-card flex items-center justify-between px-4 z-40 w-full shrink-0">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-1.5 rounded-lg border hover:bg-muted text-muted-foreground text-sm"
          title="Open Menu"
        >
          ☰
        </button>
        <span className="font-bold text-sm tracking-tight">StudyVault</span>
        <div className="h-8 w-8 rounded-full flex items-center justify-center border text-sm" style={{ backgroundColor: AVATAR_COLOR_MAP[user?.profileIdentity?.themePreset || 'purple'] || (user?.profileIdentity as any)?.color || '#8b5cf6' }}>
          {user?.profileIdentity?.avatar || '🐼'}
        </div>
      </div>

      {/* Sidebar Backdrop for Mobile */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity"
        />
      )}

      {/* Left Sidebar Panel */}
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed md:relative inset-y-0 left-0 bg-card border-r border-border flex flex-col py-4 shrink-0 transition-all duration-300 z-50 md:z-30 h-full ${
          isMobileOpen ? 'translate-x-0 w-[260px]' : '-translate-x-full md:translate-x-0'
        } ${
          isExpanded ? 'w-[260px]' : 'w-[72px]'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-4 mb-6">
          <div className={`flex items-center gap-2 overflow-hidden ${isExpanded ? 'opacity-100' : 'opacity-0 md:opacity-100'}`}>
            <span className="text-xl">🎒</span>
            {isExpanded && (
              <h2 className="text-lg font-bold tracking-tight truncate">StudyVault</h2>
            )}
          </div>
          {/* Desktop Pin Toggle */}
          {isExpanded && (
            <button
              onClick={toggleSidebarPin}
              className="hidden md:block p-1.5 hover:bg-muted rounded-md text-xs text-muted-foreground transition-all"
              title={isSidebarPinned ? 'Collapse Sidebar' : 'Pin Sidebar'}
            >
              {isSidebarPinned ? '📌' : '📍'}
            </button>
          )}
        </div>

        {/* Rooms Scroll List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1.5 w-full">
          {rooms.map((room) => {
            const isActive = currentRoom?._id === room._id;
            const roomUnreads = unreads[room._id] || { unreadChats: 0, unreadResources: 0 };
            const chatCount = roomUnreads.unreadChats;
            const resourceCount = roomUnreads.unreadResources;
            
            const presetName = room.appearance?.themePreset || 'purple';
            const bgGradient = THEME_PRESET_MAP[presetName] || THEME_PRESET_MAP.purple;

            return (
              <button
                key={room._id}
                onClick={() => {
                  setCurrentRoom(room);
                  clearRoomUnreads(room._id, 'chat');
                  clearRoomUnreads(room._id, 'resource');
                  setIsMobileOpen(false); // Close drawer on mobile click
                }}
                className={`w-full flex items-center p-2 rounded-xl transition-all relative group ${
                  isActive
                    ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent'
                }`}
                title={!isExpanded ? room.name : undefined}
              >
                {/* Discord-style Notification Notch/Pill */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 flex items-center pointer-events-none">
                  <div 
                    className={`w-[3px] rounded-r-full bg-primary transition-all duration-300 origin-left ${
                      isActive 
                        ? 'h-6 opacity-100' 
                        : (chatCount > 0 || resourceCount > 0)
                          ? 'h-2 opacity-70 group-hover:h-4 group-hover:opacity-100'
                          : 'h-0 opacity-0 group-hover:h-1.5 group-hover:opacity-30'
                    }`}
                  />
                </div>
                {/* Visual Room Circle */}
                <div className="relative shrink-0">
                  <div 
                    className="h-10 w-10 rounded-xl flex items-center justify-center font-bold border shadow-sm transition-transform text-lg"
                    style={{ 
                      background: bgGradient,
                      color: '#ffffff',
                      borderColor: 'var(--color-border)'
                    }}
                  >
                    {room.appearance?.icon || room.icon || room.name.charAt(0).toUpperCase()}
                  </div>
                  {/* New resources count (green dot or badge) */}
                  {resourceCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white text-[9px] font-black min-w-4 h-4 px-1 flex items-center justify-center rounded-full shadow-md animate-pulse border border-background">
                      {resourceCount > 99 ? '99+' : resourceCount}
                    </span>
                  )}
                  {/* Unread chats count (red dot or badge) */}
                  {chatCount > 0 && (
                    <span className={`absolute ${resourceCount > 0 ? '-bottom-1.5 -right-1.5' : '-top-1.5 -right-1.5'} bg-rose-500 text-white text-[9px] font-black min-w-4 h-4 px-1 flex items-center justify-center rounded-full shadow-md animate-bounce border border-background`}>
                      {chatCount > 99 ? '99+' : chatCount}
                    </span>
                  )}
                </div>
                {isExpanded && (
                  <div className="ml-3 text-left overflow-hidden flex-1">
                    <p className="font-semibold text-sm truncate leading-tight text-foreground">{room.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{room.members.length} members</p>
                  </div>
                )}
              </button>
            );
          })}

          {/* Add / Join Room Button */}
          <button
            onClick={() => {
              setCurrentRoom(null);
              setIsMobileOpen(false);
            }}
            className={`w-full flex items-center p-2 rounded-xl transition-all relative group ${
              !currentRoom
                ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent'
            }`}
            title={!isExpanded ? 'Add Room' : undefined}
          >
             <div className="relative shrink-0">
               <div className="h-10 w-10 rounded-xl flex items-center justify-center font-bold border border-dashed border-muted-foreground/40 group-hover:border-primary/50 text-xl bg-muted/20 group-hover:bg-primary/10 transition-colors">
                 +
               </div>
             </div>
             {isExpanded && (
               <div className="ml-3 text-left overflow-hidden flex-1">
                 <p className="font-semibold text-sm truncate leading-tight text-foreground">Add or Join Room</p>
               </div>
             )}
          </button>
        </div>

        {/* Theme switcher + User Profile Area */}
        <div className="mt-auto pt-4 border-t border-border px-4 w-full space-y-4">
          {isExpanded && (
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Appearance</span>
              <ThemeSwitcher />
            </div>
          )}

          <div 
            onClick={() => setIsProfileModalOpen(true)}
            className="flex items-center gap-3 cursor-pointer hover:scale-[1.03] active:scale-[0.98] transition-all"
            title="Edit Profile"
          >
            <div
              className="h-10 w-10 rounded-full flex items-center justify-center text-xl shadow-md shrink-0 border border-border"
              style={{ backgroundColor: AVATAR_COLOR_MAP[user?.profileIdentity?.themePreset || 'purple'] || (user?.profileIdentity as any)?.color || '#8b5cf6' }}
            >
              {user?.profileIdentity?.avatar || '🐼'}
            </div>
            {isExpanded && (
              <div className="overflow-hidden flex-1">
                <p className="font-bold text-foreground truncate text-sm leading-tight hover:underline">{user?.username}</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    logout();
                  }}
                  className="text-xs text-muted-foreground hover:text-destructive hover:underline text-left"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
        {children}
      </div>

      {/* User Profile Modal */}
      <UserProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      />
    </div>
  );
}
