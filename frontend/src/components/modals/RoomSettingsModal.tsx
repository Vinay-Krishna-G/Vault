import React, { useState } from 'react';
import { useRoomStore, type Room } from '../../store/roomStore';
import { useAuthStore } from '../../store/authStore';
import { FrontendPermissions } from '../../utils/permissions';

interface RoomSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room;
}

const ROOM_ICON_OPTIONS = ['🏫', '🚀', '📚', '💡', '💻', '🧪', '📊', '🔬', '🌍', '🧠', '📝', '🔥', '🎨', '🎯', '🎸', '🎮'];
const ROOM_THEME_OPTIONS = [
  { name: 'Purple Dream', value: 'purple', bg: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)' },
  { name: 'Electric Blue', value: 'blue', bg: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' },
  { name: 'Emerald Forest', value: 'green', bg: 'linear-gradient(135deg, #10b981 0%, #047857 100%)' },
  { name: 'Sunset Orange', value: 'orange', bg: 'linear-gradient(135deg, #f97316 0%, #c2410c 100%)' },
  { name: 'Pink Fizz', value: 'pink', bg: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)' },
  { name: 'Neon Cyber', value: 'cyber', bg: 'linear-gradient(135deg, #06b6d4 0%, #4f46e5 100%)' },
  { name: 'Classic Slate', value: 'academic', bg: 'linear-gradient(135deg, #64748b 0%, #334155 100%)' },
  { name: 'Minimalist Dark', value: 'dark-minimal', bg: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)' },
];

export default function RoomSettingsModal({ isOpen, onClose, room }: RoomSettingsModalProps) {
  const { updateRoomSettings, deleteRoom, isLoading, error } = useRoomStore();
  const { user } = useAuthStore();

  const userId = user?._id || '';
  const isOwner = FrontendPermissions.isOwner(room as any, userId);
  const canEditInfo = FrontendPermissions.canEditRoomInfo(room as any, userId);

  const [name, setName] = useState(room.name);
  const [description, setDescription] = useState(room.description || '');
  const [icon, setIcon] = useState(room.appearance?.icon || room.icon || '🏫');
  const [themePreset, setThemePreset] = useState(room.appearance?.themePreset || 'purple');

  // Governance Permissions
  const [chatPermission, setChatPermission] = useState(room.settings?.chatPermission || 'everyone');
  const [resourcePermission, setResourcePermission] = useState(room.settings?.resourcePermission || 'everyone');
  const [textCardPermission, setTextCardPermission] = useState(room.settings?.textCardPermission || 'everyone');
  const [pinPermission, setPinPermission] = useState(room.settings?.pinPermission || 'everyone');
  const [roomInfoPermission, setRoomInfoPermission] = useState(room.settings?.roomInfoPermission || 'admins-only');

  // Expiry
  const [expiryEnabled, setExpiryEnabled] = useState(room.expirySettings?.enabled || false);
  const [expiresAt, setExpiresAt] = useState(() => {
    if (room.expirySettings?.expiresAt) {
      return new Date(room.expirySettings.expiresAt).toISOString().substring(0, 16);
    }
    return '';
  });
  const [expiryBehavior, setExpiryBehavior] = useState<'archive' | 'delete'>(room.expirySettings?.behavior || 'archive');

  // Members Limit
  const [maxMembers, setMaxMembers] = useState(room.maxMembers || 100);
  const [isArchived, setIsArchived] = useState(room.isArchived || false);

  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaveSuccess(false);

      const payload: any = {
        name: name.trim(),
        description: description.trim(),
        icon,
        themePreset,
      };

      if (isOwner) {
        payload.chatPermission = chatPermission;
        payload.resourcePermission = resourcePermission;
        payload.textCardPermission = textCardPermission;
        payload.pinPermission = pinPermission;
        payload.roomInfoPermission = roomInfoPermission;
        payload.maxMembers = maxMembers;
        payload.isArchived = isArchived;
        payload.expirySettings = {
          enabled: expiryEnabled,
          expiresAt: expiryEnabled && expiresAt ? new Date(expiresAt).toISOString() : null,
          behavior: expiryBehavior,
        };
      }

      await updateRoomSettings(room._id, payload);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1000);
    } catch (err) {
      // Handled inside store
    }
  };

  const handleDeleteRoom = async () => {
    if (!room.isArchived) {
      alert('You must archive the room first before scheduling deletion!');
      return;
    }
    if (window.confirm('Are you absolutely sure you want to trigger room deletion? This is a permanent cascading delete.')) {
      try {
        await deleteRoom(room._id);
        onClose();
      } catch (err: any) {
        alert(err.message || 'Failed to delete room');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-card/75 border border-border/65 w-full max-w-xl rounded-2xl shadow-2xl p-6 relative flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold tracking-tight text-foreground">Room Settings Panel</h3>
            <p className="text-xs text-muted-foreground">Adjust metadata, layout themes, and governance for {room.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted text-sm transition-all"
            title="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-6 flex-1">
          {/* Metadata Section */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary border-b pb-1">1. Information & Layout</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Room Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading || !canEditInfo}
                  required
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Select Theme Preset</label>
                <select
                  value={themePreset}
                  onChange={(e) => setThemePreset(e.target.value as any)}
                  disabled={isLoading || !canEditInfo}
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {ROOM_THEME_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLoading || !canEditInfo}
                rows={2}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                placeholder="What is this room about?"
              />
            </div>

            {/* Icon Presets */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Select Icon</label>
              <div className="grid grid-cols-8 gap-2 bg-muted/40 p-2.5 rounded-xl border border-border/40">
                {ROOM_ICON_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    disabled={!canEditInfo}
                    onClick={() => setIcon(emoji)}
                    className={`text-2xl p-1.5 rounded-lg hover:scale-115 active:scale-90 transition-all ${
                      icon === emoji ? 'bg-primary/25 scale-110 border border-primary/30' : 'hover:bg-muted'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Governance Section - Owner Only */}
          {isOwner && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary border-b pb-1">2. Governance & Permissions</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Who can Chat?</label>
                  <select
                    value={chatPermission}
                    onChange={(e) => setChatPermission(e.target.value as any)}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none"
                  >
                    <option value="everyone">Everyone</option>
                    <option value="admins-only">Admins Only</option>
                    <option value="owner-only">Owner Only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Who can Upload Files?</label>
                  <select
                    value={resourcePermission}
                    onChange={(e) => setResourcePermission(e.target.value as any)}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none"
                  >
                    <option value="everyone">Everyone</option>
                    <option value="admins-only">Admins Only</option>
                    <option value="owner-only">Owner Only</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Who can Create Text Cards?</label>
                  <select
                    value={textCardPermission}
                    onChange={(e) => setTextCardPermission(e.target.value as any)}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none"
                  >
                    <option value="everyone">Everyone</option>
                    <option value="admins-only">Admins Only</option>
                    <option value="owner-only">Owner Only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Who can Pin Cards?</label>
                  <select
                    value={pinPermission}
                    onChange={(e) => setPinPermission(e.target.value as any)}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none"
                  >
                    <option value="everyone">Everyone</option>
                    <option value="admins-only">Admins Only</option>
                    <option value="owner-only">Owner Only</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Who can Edit Info?</label>
                  <select
                    value={roomInfoPermission}
                    onChange={(e) => setRoomInfoPermission(e.target.value as any)}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none"
                  >
                    <option value="everyone">Everyone</option>
                    <option value="admins-only">Admins Only</option>
                    <option value="owner-only">Owner Only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Maximum Members limit (2-500)</label>
                  <input
                    type="number"
                    min={2}
                    max={500}
                    value={maxMembers}
                    onChange={(e) => setMaxMembers(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Expiry Section - Owner Only */}
          {isOwner && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary border-b pb-1">3. Expiry & Archiving</h4>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">Enable Workspace Expiry</p>
                  <p className="text-[11px] text-muted-foreground">Automatically trigger an event or behavior when expiry matches</p>
                </div>
                <input
                  type="checkbox"
                  checked={expiryEnabled}
                  onChange={(e) => setExpiryEnabled(e.target.checked)}
                  className="w-4 h-4 text-primary bg-background border-input rounded"
                />
              </div>

              {expiryEnabled && (
                <div className="grid grid-cols-2 gap-4 bg-muted/40 p-3 rounded-xl border border-border/40">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Expires At</label>
                    <input
                      type="datetime-local"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Expiry Action</label>
                    <select
                      value={expiryBehavior}
                      onChange={(e) => setExpiryBehavior(e.target.value as any)}
                      className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none"
                    >
                      <option value="archive">Archive Room</option>
                      <option value="delete">Schedule Deletion</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Archive Toggler */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">Archive Room Workspace</p>
                  <p className="text-[11px] text-muted-foreground">Locks room workspace immediately, preventing messaging or card uploads</p>
                </div>
                <input
                  type="checkbox"
                  checked={isArchived}
                  onChange={(e) => setIsArchived(e.target.checked)}
                  className="w-4 h-4 text-primary bg-background border-input rounded"
                />
              </div>
            </div>
          )}

          {/* Save & Cancel */}
          <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
            {error && (
              <p className="text-xs text-destructive mr-auto font-medium">{error}</p>
            )}
            {saveSuccess && (
              <p className="text-xs text-emerald-500 mr-auto font-bold animate-pulse">✓ Room settings updated!</p>
            )}
            {isOwner && isArchived && (
              <button
                type="button"
                onClick={handleDeleteRoom}
                className="bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs px-4 py-2 rounded-lg transition-all mr-auto shadow-md"
              >
                Delete Room
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 hover:bg-muted text-muted-foreground hover:text-foreground text-sm font-semibold rounded-lg transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-lg shadow-lg hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
