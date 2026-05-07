import React, { useEffect } from 'react';
import { useRoomStore } from '../../store/roomStore';
import { useAuthStore } from '../../store/authStore';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { rooms, fetchRooms, currentRoom, setCurrentRoom } = useRoomStore();
  const { user, logout } = useAuthStore();

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Left Sidebar - Rooms List */}
      <div className="w-20 md:w-64 border-r border-border bg-sidebar flex flex-col items-center md:items-stretch py-4 shrink-0 transition-all">
        <div className="mb-8 px-4 hidden md:block">
          <h2 className="text-xl font-bold text-sidebar-foreground tracking-tight">StudyVault</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto px-2 space-y-2 w-full">
          {rooms.map((room) => (
            <button
              key={room._id}
              onClick={() => setCurrentRoom(room)}
              className={`w-full flex items-center p-2 md:p-3 rounded-xl transition-all ${
                currentRoom?._id === room._id
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
              }`}
            >
              <div className="h-10 w-10 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-semibold border border-primary/20">
                {room.name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block ml-3 text-left overflow-hidden">
                <p className="font-medium truncate leading-tight">{room.name}</p>
                <p className="text-xs text-muted-foreground truncate">{room.members.length} members</p>
              </div>
            </button>
          ))}
        </div>

        {/* User Profile Area */}
        <div className="mt-auto p-4 border-t border-sidebar-border mt-4 w-full">
          <div className="flex items-center justify-center md:justify-start gap-3">
            <div 
              className="h-10 w-10 rounded-full flex items-center justify-center text-xl shadow-sm shrink-0"
              style={{ backgroundColor: user?.profileIdentity.color }}
            >
              {user?.profileIdentity.avatar}
            </div>
            <div className="hidden md:block overflow-hidden flex-1">
              <p className="font-medium text-sidebar-foreground truncate text-sm">{user?.username}</p>
              <button onClick={logout} className="text-xs text-muted-foreground hover:text-destructive hover:underline text-left">
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
        {children}
      </div>
    </div>
  );
}
