import React, { useState } from 'react';
import { useRoomStore } from '../store/roomStore';
import ResourceBoard from '../components/resources/ResourceBoard';

export default function Dashboard() {
  const { currentRoom, createRoom, joinRoom, isLoading, error } = useRoomStore();
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [joinCode, setJoinCode] = useState('');

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
      <ResourceBoard />
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center h-full">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="text-4xl font-extrabold text-foreground tracking-tight">Welcome to StudyVault</h2>
          <p className="mt-4 text-lg text-muted-foreground">
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
              <label className="block text-sm font-medium mb-1">Room Name</label>
              <input 
                autoFocus
                required
                minLength={3}
                className="w-full px-3 py-2 bg-background border border-input rounded-md mb-3"
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
              <label className="block text-sm font-medium mb-1">Join Code</label>
              <input 
                autoFocus
                required
                minLength={8}
                maxLength={8}
                className="w-full px-3 py-2 bg-background border border-input rounded-md mb-3 font-mono tracking-widest uppercase"
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
