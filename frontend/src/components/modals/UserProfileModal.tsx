import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { THEME_PRESET_MAP } from '../layout/MainLayout';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AVATAR_OPTIONS = ['🐼', '🦊', '🐯', '🦁', '🐸', '🐙', '🚀', '👑', '🎨', '🍕', '🎮', '💎', '🔥', '✨', '🧠', '🧙‍♂️'];
const PRESET_OPTIONS = [
  { name: 'Purple Dream', value: 'purple' },
  { name: 'Electric Blue', value: 'blue' },
  { name: 'Emerald Forest', value: 'green' },
  { name: 'Sunset Orange', value: 'orange' },
  { name: 'Pink Fizz', value: 'pink' },
  { name: 'Neon Cyber', value: 'cyber' },
  { name: 'Classic Slate', value: 'academic' },
  { name: 'Minimalist Dark', value: 'dark-minimal' },
];

export default function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
  const { user, updateProfile, isLoading, error } = useAuthStore();

  const [displayName, setDisplayName] = useState(user?.profileIdentity?.displayName || user?.username || '');
  const [bio, setBio] = useState(user?.profileIdentity?.bio || '');
  const [avatar, setAvatar] = useState(user?.profileIdentity?.avatar || '🐼');
  const [themePreset, setThemePreset] = useState(user?.profileIdentity?.themePreset || 'purple');
  const [themePreference, setThemePreference] = useState(user?.profileIdentity?.themePreference || 'system');
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    try {
      setSaveSuccess(false);
      await updateProfile({
        displayName: displayName.trim(),
        bio: bio.trim(),
        avatar,
        themePreset,
        themePreference,
      });
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1000);
    } catch (err) {
      // Handled inside store
    }
  };

  const currentGradient = THEME_PRESET_MAP[themePreset] || THEME_PRESET_MAP.purple;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-card/75 border border-border/65 w-full max-w-lg rounded-2xl shadow-2xl p-6 relative flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold tracking-tight text-foreground">Customize Profile</h3>
            <p className="text-xs text-muted-foreground">Personalize your avatar, details and theme preference</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted text-sm transition-all"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Live Preview Card */}
        <div className="mb-6 border border-border/50 rounded-2xl overflow-hidden shadow-lg flex flex-col items-center py-6 relative" style={{ background: currentGradient }}>
          <div className="absolute top-2 right-3 bg-black/30 backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
            Live Preview
          </div>
          <div
            className="h-20 w-20 rounded-full flex items-center justify-center text-4xl shadow-2xl border-2 border-white/60 hover:scale-110 transition-transform cursor-pointer bg-white/20 backdrop-blur-md"
          >
            {avatar}
          </div>
          <h4 className="mt-4 text-lg font-black text-white drop-shadow-md">{displayName || user?.username}</h4>
          <p className="text-xs text-white/90 drop-shadow-sm px-4 text-center truncate max-w-full italic">{bio || 'No bio written yet'}</p>
        </div>

        <div className="space-y-5 flex-1">
          {/* Display Name and Bio */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={30}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none"
                placeholder="Full Name / Handle"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Theme Preference</label>
              <select
                value={themePreference}
                onChange={(e) => setThemePreference(e.target.value as any)}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none"
              >
                <option value="system">Follow System</option>
                <option value="light">Light Mode</option>
                <option value="dark">Dark Mode</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">Bio</label>
              <span className="text-[10px] text-muted-foreground">{bio.length}/150</span>
            </div>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={150}
              rows={2}
              className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none resize-none"
              placeholder="Tell other students about yourself..."
            />
          </div>

          {/* Avatar Presets */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Select Avatar Emoji</label>
            <div className="grid grid-cols-8 gap-2 bg-muted/40 p-2.5 rounded-xl border border-border/40">
              {AVATAR_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setAvatar(emoji)}
                  className={`text-2xl p-1.5 rounded-lg hover:scale-115 active:scale-90 transition-all ${
                    avatar === emoji ? 'bg-primary/25 scale-110 border border-primary/30 shadow-inner' : 'hover:bg-muted'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Theme Preset Colors */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Select Theme Accent Preset</label>
            <div className="grid grid-cols-4 gap-2 bg-muted/40 p-2.5 rounded-xl border border-border/40">
              {PRESET_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setThemePreset(opt.value as any)}
                  className={`h-9 rounded-lg flex items-center justify-center border text-[11px] font-extrabold text-white shadow-sm transition-all hover:scale-105 relative ${
                    themePreset === opt.value ? 'ring-2 ring-primary border-transparent' : 'border-border/40'
                  }`}
                  style={{ background: THEME_PRESET_MAP[opt.value] }}
                >
                  {opt.name.split(' ')[0]}
                  {themePreset === opt.value && (
                    <span className="absolute top-1 right-1 text-[9px] font-black">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 pt-4 border-t border-border flex items-center justify-end gap-3">
          {error && (
            <p className="text-xs text-destructive mr-auto font-medium">{error}</p>
          )}
          {saveSuccess && (
            <p className="text-xs text-emerald-500 mr-auto font-bold animate-pulse">✓ Profile updated!</p>
          )}
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 hover:bg-muted text-muted-foreground hover:text-foreground text-sm font-semibold rounded-lg transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-5 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-lg shadow-lg hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Save Customizations'}
          </button>
        </div>
      </div>
    </div>
  );
}
