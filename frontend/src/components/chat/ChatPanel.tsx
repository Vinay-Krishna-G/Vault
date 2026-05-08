import React, { useEffect, useRef, useState } from 'react';
import { useChatStore } from '../../store/chatStore';
import { useRoomStore } from '../../store/roomStore';
import { useAuthStore } from '../../store/authStore';

export default function ChatPanel() {
  const { currentRoom } = useRoomStore();
  const { user } = useAuthStore();
  const {
    messages,
    isLoading,
    hasMore,
    typingUser,
    connectSocket,
    disconnectSocket,
    fetchHistory,
    sendMessage,
    startTyping,
    stopTyping,
    toggleReaction,
    editMessage,
    clearStore,
  } = useChatStore();

  const [input, setInput] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editInput, setEditInput] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  // Connect sockets and fetch history on room load
  useEffect(() => {
    let pollInterval: any;

    if (currentRoom) {
      clearStore();
      connectSocket(currentRoom._id);
      fetchHistory(currentRoom._id);

      // HTTP Polling Fallback for Vercel
      pollInterval = setInterval(() => {
        fetchHistory(currentRoom._id);
      }, 5000);
    }

    return () => {
      if (currentRoom) {
        disconnectSocket(currentRoom._id);
      }
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [currentRoom?._id, connectSocket, disconnectSocket, fetchHistory, clearStore]);

  // Auto scroll to bottom when messages list updates
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typingUser]);

  if (!currentRoom) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(currentRoom._id, input.trim());
    setInput('');
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      stopTyping(currentRoom._id);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    
    // Trigger typing indicator
    if (!typingTimeoutRef.current) {
      startTyping(currentRoom._id);
    } else {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(currentRoom._id);
      typingTimeoutRef.current = null;
    }, 2000);
  };

  const startEditing = (messageId: string, currentContent: string, createdAt: string) => {
    // 15 minutes editing limit
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    if (new Date(createdAt) < fifteenMinutesAgo) {
      alert('Messages can only be edited within 15 minutes of sending.');
      return;
    }
    setEditingMessageId(messageId);
    setEditInput(currentContent);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMessageId && editInput.trim()) {
      await editMessage(editingMessageId, editInput.trim());
      setEditingMessageId(null);
      setEditInput('');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const emojis = ['👍', '🔥', '😂', '🧠'];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {/* Scrollable messages area */}
      <div 
        ref={scrollRef} 
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4"
      >
        {hasMore && messages.length >= 50 && (
          <div className="text-center">
            <button
              onClick={() => fetchHistory(currentRoom._id, true)}
              className="text-xs bg-muted hover:bg-muted/80 text-muted-foreground font-medium px-3 py-1.5 rounded-full transition-colors"
            >
              Load Older Messages
            </button>
          </div>
        )}

        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-60 py-12">
            <span className="text-4xl mb-3">💬</span>
            <h4 className="font-bold text-foreground">Welcome to general chat!</h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              This is the beginning of the room's casual discussion space.
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const isSenderMe = msg.sender._id === user?._id;
          const isEditable = isSenderMe && (new Date(msg.createdAt) > new Date(Date.now() - 15 * 60 * 1000));

          return (
            <div 
              key={msg._id} 
              className={`group flex items-start gap-3 max-w-[85%] relative ${
                isSenderMe ? 'ml-auto flex-row-reverse' : ''
              }`}
            >
              {/* Profile Avatar */}
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-sm shrink-0 border border-border"
                style={{ backgroundColor: (msg.sender.profileIdentity?.themePreset ? ({ purple: '#8b5cf6', blue: '#3b82f6', green: '#10b981', orange: '#f59e0b', pink: '#ec4899', cyber: '#06b6d4', academic: '#64748b', 'dark-minimal': '#1e293b' } as Record<string, string>)[msg.sender.profileIdentity.themePreset] : undefined) || msg.sender.profileIdentity?.color || '#8b5cf6' }}
                title={msg.sender.username}
              >
                {msg.sender.profileIdentity?.avatar || '👤'}
              </div>

              {/* Message Details */}
              <div className="flex flex-col space-y-1 w-full">
                <div className={`flex items-center gap-1.5 text-[11px] text-muted-foreground ${
                  isSenderMe ? 'justify-end' : ''
                }`}>
                  <span className="font-bold text-foreground truncate">{msg.sender.username}</span>
                  <span>•</span>
                  <span>{formatDate(msg.createdAt)}</span>
                  {msg.editedAt && <span className="text-[10px] italic">(edited)</span>}
                </div>

                {editingMessageId === msg._id ? (
                  <form onSubmit={handleSaveEdit} className="mt-1 flex gap-2">
                    <input
                      type="text"
                      value={editInput}
                      onChange={(e) => setEditInput(e.target.value)}
                      maxLength={2000}
                      className="flex-1 bg-muted border border-primary text-sm rounded-lg px-3 py-1.5 focus:outline-none"
                    />
                    <button type="submit" className="bg-primary text-primary-foreground text-xs px-3 py-1 rounded-md font-medium">
                      Save
                    </button>
                    <button onClick={() => setEditingMessageId(null)} className="text-xs text-muted-foreground hover:text-foreground">
                      Cancel
                    </button>
                  </form>
                ) : (
                  <div className={`p-3 rounded-2xl text-sm ${
                    isSenderMe 
                      ? 'bg-primary text-primary-foreground rounded-tr-none' 
                      : 'bg-card border text-foreground rounded-tl-none'
                  }`}>
                    {msg.content}
                  </div>
                )}

                {/* Reactions display */}
                {msg.reactions && msg.reactions.length > 0 && (
                  <div className={`flex flex-wrap gap-1 mt-1.5 ${isSenderMe ? 'justify-end' : ''}`}>
                    {emojis.map((emoji) => {
                      const count = msg.reactions.filter((r) => r.type === emoji).length;
                      if (count === 0) return null;
                      const hasIReacted = msg.reactions.some((r) => r.type === emoji && r.user === user?._id);

                      return (
                        <button
                          key={emoji}
                          onClick={() => toggleReaction(currentRoom._id, msg._id, emoji)}
                          className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border transition-all ${
                            hasIReacted
                              ? 'bg-primary/10 border-primary text-primary font-bold'
                              : 'bg-muted border-border text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <span>{emoji}</span>
                          <span>{count}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Hover actions menu */}
              <div className={`absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity bg-background border rounded-lg shadow-sm flex items-center p-0.5 z-10 ${
                isSenderMe ? '-left-20' : '-right-20'
              }`}>
                {/* Reaction Quick Picker */}
                {emojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => toggleReaction(currentRoom._id, msg._id, emoji)}
                    className="hover:bg-muted px-1.5 py-1 rounded text-xs"
                  >
                    {emoji}
                  </button>
                ))}
                {isEditable && (
                  <button
                    onClick={() => startEditing(msg._id, msg.content, msg.createdAt)}
                    className="hover:bg-muted p-1 text-[10px] text-muted-foreground hover:text-foreground border-l ml-0.5"
                    title="Edit Message"
                  >
                    ✏️
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Typing indicator */}
      {typingUser && (
        <div className="px-6 py-1 text-xs text-muted-foreground italic animate-pulse">
          ✍️ {typingUser} is typing...
        </div>
      )}

      {/* Bottom chat input */}
      <div className="p-4 border-t bg-card/40">
        <form onSubmit={handleSend} className="relative flex gap-2">
          <input
            type="text"
            placeholder={`Message #${currentRoom.name}...`}
            value={input}
            onChange={handleInputChange}
            maxLength={2000}
            className="flex-1 bg-background border border-input rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all pr-12 text-foreground"
          />
          <button
            type="submit"
            className="absolute right-3 top-2.5 bg-primary hover:bg-primary/90 text-primary-foreground h-8 w-8 rounded-lg flex items-center justify-center transition-colors shadow-sm"
          >
            ➔
          </button>
        </form>
      </div>
    </div>
  );
}
