import React, { useEffect, useState } from 'react';
import { useResourceStore } from '../../store/resourceStore';
import type { Resource, SortOption, FileTypeFilter } from '../../store/resourceStore';
import { useRoomStore } from '../../store/roomStore';
import { useAuthStore } from '../../store/authStore';
import UploadModal from './UploadModal';
import CommentPanel from '../comments/CommentPanel';

export default function ResourceBoard() {
  const { currentRoom } = useRoomStore();
  const { user } = useAuthStore();
  const { 
    resources, 
    isLoading, 
    error, 
    searchResources, 
    deleteResource, 
    togglePinResource,
    reactToResource,
    editResource
  } = useResourceStore();

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [activeResource, setActiveResource] = useState<Resource | null>(null);
  const [activeReactionCardId, setActiveReactionCardId] = useState<string | null>(null);
  const [viewingFullTextResource, setViewingFullTextResource] = useState<Resource | null>(null);

  // Editing Resource State
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editColor, setEditColor] = useState<'default' | 'blue' | 'purple' | 'amber' | 'rose' | 'emerald'>('default');
  const [editTags, setEditTags] = useState('');
  const [editError, setEditError] = useState('');

  // Search, Filter, Sort local state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [fileType, setFileType] = useState<FileTypeFilter>('all');
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  // Fetch or Search resources on filter change
  useEffect(() => {
    if (currentRoom) {
      searchResources(currentRoom._id, {
        q: debouncedSearch,
        type: fileType,
        pinned: showPinnedOnly,
        sort: sortBy,
      });
    }
  }, [currentRoom?._id, debouncedSearch, fileType, showPinnedOnly, sortBy, searchResources]);

  useEffect(() => {
    setActiveResource(null);
  }, [currentRoom?._id]);

  if (!currentRoom) return null;

  const memberRecord = currentRoom.members.find((m) => m.user._id === user?._id);
  const isRoomOwner = memberRecord && memberRecord.role === 'owner';
  const isRoomAdmin = memberRecord && (memberRecord.role === 'owner' || memberRecord.role === 'admin');

  const canManagePin = (resource: Resource) => isRoomAdmin || resource.uploader._id === user?._id;
  const canDelete = (resource: Resource) => isRoomOwner || resource.uploader._id === user?._id;

  const canEdit = (resource: Resource) => {
    if (resource.uploader._id !== user?._id) return false;
    const createdAt = new Date(resource.createdAt);
    const now = new Date();
    const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);
    return diffMinutes <= 15;
  };

  const handleOpenEdit = (e: React.MouseEvent, resource: Resource) => {
    e.stopPropagation();
    setEditingResource(resource);
    setEditTitle(resource.title);
    setEditDescription(resource.description || '');
    setEditContent(resource.content || '');
    setEditColor(resource.color || 'default');
    setEditTags(resource.tags?.join(', ') || '');
    setEditError('');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError('');
    if (!editingResource) return;

    if (!editTitle.trim()) {
      setEditError('Title is required.');
      return;
    }

    const tagArray = editTags.split(',').map((t) => t.trim()).filter(Boolean);

    try {
      await editResource(editingResource._id, {
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        content: editingResource.type !== 'file' ? editContent.trim() : undefined,
        color: editColor,
        tags: tagArray,
      });
      setEditingResource(null);
    } catch (err: any) {
      setEditError(err.response?.data?.message || 'Failed to update card.');
    }
  };

  const handleDelete = async (e: React.MouseEvent, resourceId: string, title: string) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
      await deleteResource(resourceId);
      if (activeResource?._id === resourceId) setActiveResource(null);
    }
  };

  const handleTogglePin = async (e: React.MouseEvent, resourceId: string) => {
    e.stopPropagation();
    try {
      await togglePinResource(resourceId);
    } catch (err) {
      // Error handled in store
    }
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-50/80 border-blue-200 hover:bg-blue-100/70 dark:bg-blue-950/15 dark:border-blue-900/30 dark:hover:bg-blue-950/20';
      case 'purple':
        return 'bg-purple-50/80 border-purple-200 hover:bg-purple-100/70 dark:bg-purple-950/15 dark:border-purple-900/30 dark:hover:bg-purple-950/20';
      case 'amber':
        return 'bg-amber-50/80 border-amber-200 hover:bg-amber-100/70 dark:bg-amber-950/15 dark:border-amber-900/30 dark:hover:bg-amber-950/20';
      case 'rose':
        return 'bg-rose-50/80 border-rose-200 hover:bg-rose-100/70 dark:bg-rose-950/15 dark:border-rose-900/30 dark:hover:bg-rose-950/20';
      case 'emerald':
        return 'bg-emerald-50/80 border-emerald-200 hover:bg-emerald-100/70 dark:bg-emerald-950/15 dark:border-emerald-900/30 dark:hover:bg-emerald-950/20';
      default:
        return 'bg-card border-border hover:bg-card/90';
    }
  };

  const getTypeBadgeClasses = (type: string) => {
    switch (type) {
      case 'text-note':
        return 'bg-blue-500 text-white dark:bg-blue-600';
      case 'question':
        return 'bg-purple-500 text-white dark:bg-purple-600';
      case 'task':
        return 'bg-emerald-500 text-white dark:bg-emerald-600';
      case 'announcement':
        return 'bg-rose-500 text-white dark:bg-rose-600';
      default:
        return 'bg-slate-500 text-white dark:bg-slate-600';
    }
  };

  const parseBoldItalic = (text: string) => {
    const boldRegex = /\*\*(.*?)\*\*/g;
    const italicRegex = /\*(.*?)\*/g;

    const renderBold = (str: string): React.ReactNode[] => {
      const splitParts = str.split(boldRegex);
      return splitParts.map((part, i) => (i % 2 === 1 ? <strong key={i} className="font-bold text-foreground">{part}</strong> : part));
    };

    const res = renderBold(text);
    return res.map((part) => {
      if (typeof part === 'string') {
        const splitParts = part.split(italicRegex);
        return splitParts.map((subPart, j) => (j % 2 === 1 ? <em key={j} className="italic text-foreground/85">{subPart}</em> : subPart));
      }
      return part;
    });
  };

  const renderFormattedContent = (resource: Resource) => {
    const content = resource.content || '';
    if (!content) return null;
    const lines = content.split('\n');
    return (
      <div className="space-y-1 w-full text-left">
        {lines.slice(0, 4).map((line, idx) => {
          if (line.trim().startsWith('- [x]') || line.trim().startsWith('- [X]')) {
            return (
              <div key={idx} className="flex items-center gap-1.5 text-xs text-muted-foreground line-through">
                <input type="checkbox" checked readOnly className="rounded border-gray-300 text-primary focus:ring-primary w-3 h-3 cursor-default" />
                <span className="truncate">{line.replace(/^-\s*\[[xX]\]/, '').trim()}</span>
              </div>
            );
          }

          if (line.trim().startsWith('- [ ]')) {
            return (
              <div key={idx} className="flex items-center gap-1.5 text-xs text-foreground/80 font-mono">
                <input type="checkbox" checked={false} readOnly className="rounded border-gray-300 focus:ring-primary w-3 h-3 cursor-default" />
                <span className="truncate">{line.replace(/^-\s*\[\s*\]/, '').trim()}</span>
              </div>
            );
          }

          if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
            const cleanLine = line.replace(/^-\s*|^\*\s*/, '').trim();
            return (
              <div key={idx} className="flex items-start gap-1.5 text-xs pl-1.5 text-foreground/80 font-mono">
                <span className="text-primary/70">•</span>
                <span className="truncate">{parseBoldItalic(cleanLine)}</span>
              </div>
            );
          }

          return (
            <div key={idx} className="text-xs text-foreground/80 font-mono leading-relaxed truncate overflow-hidden break-words">
              {parseBoldItalic(line)}
            </div>
          );
        })}
        {lines.length > 4 && (
          <div 
            onClick={(e) => {
              e.stopPropagation();
              setViewingFullTextResource(resource);
            }}
            className="text-[10px] text-primary hover:text-primary/80 font-extrabold italic mt-1 underline cursor-pointer"
          >
            Read full card...
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 flex h-full bg-background overflow-hidden relative" onClick={() => setActiveReactionCardId(null)}>
      {/* Main Board Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b p-4 md:px-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <span>{currentRoom.name}</span>
              <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full font-normal">
                {resources.length} {resources.length === 1 ? 'Item' : 'Items'}
              </span>
            </h1>
            <p className="text-sm text-muted-foreground">{currentRoom.description || 'Important Resources'}</p>
          </div>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium text-sm shadow-sm hover:bg-primary/90 transition-colors shrink-0 self-start md:self-auto"
          >
            + Create Resource Card
          </button>
        </div>

        {/* Search, Sort, Filter Bar */}
        <div className="border-b bg-card/50 p-4 md:px-8 flex flex-col gap-3 md:flex-row md:items-center justify-between">
          <div className="flex flex-1 flex-col sm:flex-row gap-2 max-w-3xl">
            {/* Search Input */}
            <div className="relative flex-1">
              <span className="absolute left-3 top-2.5 text-muted-foreground">🔍</span>
              <input
                type="text"
                placeholder="Search title, description, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-background border border-input rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Content Filters */}
            <div className="flex bg-background border rounded-lg p-0.5 overflow-x-auto shrink-0 scrollbar-none">
              {(['all', 'pdf', 'image', 'text-note', 'question', 'task', 'announcement'] as const).map((type) => {
                const labels = {
                  all: 'All',
                  pdf: 'PDFs',
                  image: 'Images',
                  'text-note': 'Notes',
                  question: 'Queries',
                  task: 'Tasks',
                  announcement: 'Alerts',
                };
                return (
                  <button
                    key={type}
                    onClick={() => setFileType(type)}
                    className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all shrink-0 ${
                      fileType === type
                        ? 'bg-card text-foreground shadow-sm border border-border/10'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {labels[type]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Pinned filter toggle */}
            <button
              onClick={() => setShowPinnedOnly(!showPinnedOnly)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                showPinnedOnly
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-600'
                  : 'bg-background border-input text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>📌</span>
              <span>Pinned Only</span>
            </button>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground shrink-0">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-background border border-input rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-foreground cursor-pointer"
              >
                <option value="newest">Latest First</option>
                <option value="oldest">Oldest First</option>
                <option value="most_reacted">Popularity</option>
                <option value="pinned">Pinned First</option>
              </select>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-lg text-sm">{error}</div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-muted-foreground text-sm animate-pulse">Retrieving resources...</p>
            </div>
          ) : resources.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full max-h-[60vh] text-center px-4">
              <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
                <span className="text-4xl opacity-50">🔍</span>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">No matches found</h3>
              <p className="text-muted-foreground max-w-sm mb-6">
                Try adjusting your search keywords, file filters, or sort criteria.
              </p>
              {(searchQuery || fileType !== 'all' || showPinnedOnly) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFileType('all');
                    setShowPinnedOnly(false);
                  }}
                  className="bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Reset all filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 pb-20">
              {resources.map((resource) => (
                <div
                  key={resource._id}
                  className={`group border rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col ${
                    activeResource?._id === resource._id
                      ? 'border-primary ring-2 ring-primary/30'
                      : getColorClasses(resource.color || 'default')
                  }`}
                >
                  {/* Card Header Type Indicator & Preview - UPPER PART */}
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (resource.type === 'file') {
                        if (resource.url) window.open(resource.url, '_blank');
                      } else {
                        setViewingFullTextResource(resource);
                      }
                    }}
                    className="bg-muted/30 backdrop-blur-[2px] aspect-video w-full flex items-center justify-center border-b border-border relative overflow-hidden p-4 cursor-zoom-in"
                  >
                    {resource.type === 'file' ? (
                      <>
                        {resource.fileType === 'image' ? (
                          <img src={resource.url} alt={resource.title} className="w-full h-full object-cover absolute inset-0" />
                        ) : (
                          <div className="text-center">
                            <span className="text-5xl">📄</span>
                            <p className="mt-2 text-xs font-semibold text-muted-foreground uppercase">PDF Document</p>
                          </div>
                        )}
                        <div className="absolute top-3 left-3 flex gap-2">
                          <span className="bg-background/90 backdrop-blur-sm text-foreground text-[10px] font-bold px-2 py-1 rounded shadow-sm uppercase tracking-wider">
                            file
                          </span>
                          {resource.isPinned && (
                            <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1">
                              📌 PINNED
                            </span>
                          )}
                        </div>
                      </>
                    ) : (
                      /* Live Text/Tasks/Queries Preview Snippet (Structured to NOT Overlap!) */
                      <div className="w-full h-full overflow-hidden text-left flex flex-col bg-background/40 p-3 rounded-lg border border-border/40">
                        {/* Static upper flow bar inside the preview card */}
                        <div className="flex items-center justify-between mb-2 shrink-0">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded shadow-sm uppercase tracking-widest ${getTypeBadgeClasses(resource.type)}`}>
                            {resource.type === 'text-note' ? 'Note' : resource.type === 'question' ? 'Doubt' : resource.type === 'task' ? 'Task' : 'Alert'}
                          </span>
                          {resource.isPinned && (
                            <span className="text-amber-500 text-xs font-extrabold shrink-0">📌 Pinned</span>
                          )}
                        </div>
                        <div className="flex-1 overflow-hidden w-full">
                          {renderFormattedContent(resource)}
                        </div>
                      </div>
                    )}

                    {/* Actions Overlay */}
                    <div className="absolute top-3 right-3 flex items-center gap-1">
                      {canManagePin(resource) && (
                        <button
                          onClick={(e) => handleTogglePin(e, resource._id)}
                          className={`p-1.5 rounded-md shadow-sm transition-all text-xs ${
                            resource.isPinned
                              ? 'bg-amber-500 text-white hover:bg-amber-600'
                              : 'bg-background/85 text-muted-foreground hover:text-foreground hover:bg-background opacity-0 group-hover:opacity-100'
                          }`}
                          title={resource.isPinned ? 'Unpin card' : 'Pin card'}
                        >
                          📌
                        </button>
                      )}
                      {resource.type === 'file' && resource.url && (
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="bg-background/85 p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-background hover:text-foreground text-muted-foreground transition-all text-xs shadow-sm"
                          title="Open file"
                        >
                          ↗
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Details - LOWER PART */}
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveResource(resource._id === activeResource?._id ? null : resource);
                    }}
                    className="p-4 flex-1 flex flex-col cursor-pointer"
                  >
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <h3 className="font-bold text-foreground leading-tight line-clamp-2" title={resource.title}>
                        {resource.title}
                      </h3>
                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        {canEdit(resource) && (
                          <button
                            onClick={(e) => handleOpenEdit(e, resource)}
                            className="text-muted-foreground hover:text-primary p-1 rounded hover:bg-muted"
                            title="Edit card (within 15m)"
                          >
                            ✏️
                          </button>
                        )}
                        {canDelete(resource) && (
                          <button
                            onClick={(e) => handleDelete(e, resource._id, resource.title)}
                            className="text-muted-foreground hover:text-destructive p-1 rounded hover:bg-muted"
                            title="Delete card"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>

                    {resource.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {resource.description}
                      </p>
                    )}

                    {/* Interactive Reactions Bar with Click-Toggled Popover Selection */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-3 mt-1 relative">
                      {/* Active Reaction Badges */}
                      {(['🔥', '🧠', '📌', '✅', '😂', '👍'] as const).map((emoji) => {
                        const reactionsList = resource.reactions || [];
                        const count = reactionsList.filter((r) => r.type === emoji).length;
                        const hasReacted = reactionsList.some((r) => r.user === user?._id && r.type === emoji);
                        if (count === 0) return null;
                        return (
                          <button
                            key={emoji}
                            onClick={(e) => {
                              e.stopPropagation();
                              reactToResource(resource._id, emoji);
                            }}
                            className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-all ${
                              hasReacted
                                ? 'bg-primary/10 border-primary/30 text-primary scale-105 shadow-sm'
                                : 'bg-muted/40 border-transparent text-muted-foreground hover:bg-muted/70 hover:border-border/30'
                            }`}
                          >
                            <span>{emoji}</span>
                            <span className="text-[10px]">{count}</span>
                          </button>
                        );
                      })}

                      {/* Reaction Selector Trigger Button */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveReactionCardId(activeReactionCardId === resource._id ? null : resource._id);
                          }}
                          className="w-7 h-7 flex items-center justify-center rounded-full bg-secondary hover:bg-secondary/80 text-foreground transition-all shadow-sm text-xs border border-border/40 font-bold"
                          title="React to card"
                        >
                          ➕
                        </button>

                        {/* Popover Menu (Click-Toggled and 100% stable!) */}
                        {activeReactionCardId === resource._id && (
                          <div 
                            className="absolute bottom-full left-0 mb-2 bg-card border border-border/80 rounded-full p-1.5 shadow-xl flex items-center gap-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150 backdrop-blur-md bg-card/90"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {(['🔥', '🧠', '📌', '✅', '😂', '👍'] as const).map((emoji) => {
                              const reactionsList = resource.reactions || [];
                              const hasReacted = reactionsList.some((r) => r.user === user?._id && r.type === emoji);
                              return (
                                <button
                                  key={emoji}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    reactToResource(resource._id, emoji);
                                    setActiveReactionCardId(null);
                                  }}
                                  className={`w-7 h-7 flex items-center justify-center rounded-full text-sm transition-all hover:scale-125 ${
                                    hasReacted ? 'bg-primary/20' : 'hover:bg-muted'
                                  }`}
                                >
                                  {emoji}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {resource.tags && resource.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3 mt-auto">
                        {resource.tags.slice(0, 3).map((tag, idx) => (
                          <span key={idx} className="bg-secondary text-secondary-foreground text-[10px] px-1.5 py-0.5 rounded-sm">
                            #{tag}
                          </span>
                        ))}
                        {resource.tags.length > 3 && (
                          <span className="text-[10px] text-muted-foreground font-medium">+{resource.tags.length - 3}</span>
                        )}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center gap-2 mt-auto pt-3 border-t border-border">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] shadow-sm shrink-0"
                        style={{ backgroundColor: (resource.uploader.profileIdentity?.themePreset ? ({ purple: '#8b5cf6', blue: '#3b82f6', green: '#10b981', orange: '#f59e0b', pink: '#ec4899', cyber: '#06b6d4', academic: '#64748b', 'dark-minimal': '#1e293b' } as Record<string, string>)[resource.uploader.profileIdentity.themePreset] : undefined) || resource.uploader.profileIdentity?.color || '#8b5cf6' }}
                        title={resource.uploader.username}
                      >
                        {resource.uploader.profileIdentity?.avatar || '👤'}
                      </div>
                      <div className="flex-1 flex justify-between items-center text-xs text-muted-foreground truncate">
                        <span className="truncate pr-2">{resource.uploader.username}</span>
                        <span className="shrink-0">{formatDate(resource.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {resource.type !== 'file' && (
                          <span 
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingFullTextResource(resource);
                            }}
                            className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 font-extrabold cursor-pointer"
                            title="View Full Note"
                          >
                            📖 <span className="text-[10px] opacity-90 font-bold">view</span>
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium" title="Click card to discuss">
                          💬 <span className="text-[10px] opacity-75">discuss</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sleek inline edit dialog overlay */}
      {editingResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4" onClick={() => setEditingResource(null)}>
          <div className="bg-card w-full max-w-lg rounded-2xl shadow-xl border border-border overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h2 className="text-lg font-bold text-foreground">✏️ Edit Card <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full ml-2">15 mins limit</span></h2>
              <button onClick={() => setEditingResource(null)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              {editError && <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg">{editError}</div>}
              
              {editingResource.type !== 'file' && (
                <div>
                  <label className="block text-sm font-medium mb-1 text-foreground">Card Content</label>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    required
                    rows={4}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Card Color Theme</label>
                <div className="flex gap-2 bg-muted/60 p-1.5 rounded-xl border border-border/40 w-fit">
                  {([
                    { name: 'default', bg: 'bg-card border-border/60', active: 'ring-2 ring-primary' },
                    { name: 'blue', bg: 'bg-blue-100 border-blue-200 dark:bg-blue-950/40 dark:border-blue-900/40', active: 'ring-2 ring-blue-500' },
                    { name: 'purple', bg: 'bg-purple-100 border-purple-200 dark:bg-purple-950/40 dark:border-purple-900/40', active: 'ring-2 ring-purple-500' },
                    { name: 'amber', bg: 'bg-amber-100 border-amber-200 dark:bg-amber-950/40 dark:border-amber-900/40', active: 'ring-2 ring-amber-500' },
                    { name: 'rose', bg: 'bg-rose-100 border-rose-200 dark:bg-rose-950/40 dark:border-rose-900/40', active: 'ring-2 ring-rose-500' },
                    { name: 'emerald', bg: 'bg-emerald-100 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900/40', active: 'ring-2 ring-emerald-500' },
                  ] as const).map((colorItem) => (
                    <button
                      key={colorItem.name}
                      type="button"
                      onClick={() => setEditColor(colorItem.name)}
                      className={`w-7 h-7 rounded-full border transition-all ${colorItem.bg} ${
                        editColor === colorItem.name ? colorItem.active : 'hover:scale-105'
                      }`}
                      title={`${colorItem.name.toUpperCase()} Theme`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-foreground">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-foreground">Short Description</label>
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-foreground">Tags</label>
                <input
                  type="text"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditingResource(null)} className="flex-1 px-4 py-2 bg-muted text-muted-foreground rounded-lg text-sm font-medium hover:bg-muted/80">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Glassy Note View Popup (Premium Glassmorphic Note Modal!) */}
      {viewingFullTextResource && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onClick={() => setViewingFullTextResource(null)}
        >
          <div 
            className={`w-full max-w-2xl rounded-2xl shadow-2xl border border-white/20 dark:border-white/10 overflow-hidden flex flex-col max-h-[85vh] transition-all backdrop-blur-xl ${getColorClasses(viewingFullTextResource.color || 'default')}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-border/30 flex justify-between items-center bg-background/25 backdrop-blur-sm shrink-0">
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-black px-2 py-0.5 rounded shadow-sm uppercase tracking-widest ${getTypeBadgeClasses(viewingFullTextResource.type)}`}>
                  {viewingFullTextResource.type === 'text-note' ? 'Note' : viewingFullTextResource.type === 'question' ? 'Doubt' : viewingFullTextResource.type === 'task' ? 'Task' : 'Alert'}
                </span>
                <h2 className="text-xl font-extrabold text-foreground truncate max-w-md">{viewingFullTextResource.title}</h2>
              </div>
              <button 
                onClick={() => setViewingFullTextResource(null)} 
                className="w-8 h-8 rounded-full bg-background/45 hover:bg-background/80 text-foreground flex items-center justify-center transition-all shadow-sm font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Note Body with Full Markdown Rendering */}
            <div className="p-8 overflow-y-auto space-y-4 bg-background/15 backdrop-blur-sm flex-1">
              {viewingFullTextResource.description && (
                <p className="text-sm text-muted-foreground italic border-l-2 border-primary/40 pl-3 py-1 bg-background/5 rounded-r">
                  {viewingFullTextResource.description}
                </p>
              )}
              
              <div className="text-sm text-foreground/95 leading-relaxed font-mono whitespace-pre-wrap py-2">
                {viewingFullTextResource.content ? (
                  <div className="space-y-3">
                    {viewingFullTextResource.content.split('\n').map((line, idx) => {
                      if (line.trim().startsWith('- [x]') || line.trim().startsWith('- [X]')) {
                        return (
                          <div key={idx} className="flex items-center gap-2.5 text-sm text-muted-foreground line-through">
                            <input type="checkbox" checked readOnly className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4 cursor-default" />
                            <span>{line.replace(/^-\s*\[[xX]\]/, '').trim()}</span>
                          </div>
                        );
                      }

                      if (line.trim().startsWith('- [ ]')) {
                        return (
                          <div key={idx} className="flex items-center gap-2.5 text-sm text-foreground/95 font-mono">
                            <input type="checkbox" checked={false} readOnly className="rounded border-gray-300 focus:ring-primary w-4 h-4 cursor-default" />
                            <span>{line.replace(/^-\s*\[\s*\]/, '').trim()}</span>
                          </div>
                        );
                      }

                      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
                        const cleanLine = line.replace(/^-\s*|^\*\s*/, '').trim();
                        return (
                          <div key={idx} className="flex items-start gap-2.5 text-sm pl-2 text-foreground/95 font-mono">
                            <span className="text-primary font-bold">•</span>
                            <span>{parseBoldItalic(cleanLine)}</span>
                          </div>
                        );
                      }

                      return (
                        <div key={idx} className="text-sm text-foreground/95 font-mono leading-relaxed break-words">
                          {parseBoldItalic(line)}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <span className="text-muted-foreground italic">No content inside this card.</span>
                )}
              </div>
            </div>

            {/* Glassy Footer */}
            <div className="p-4 border-t border-border/30 flex justify-between items-center bg-background/20 backdrop-blur-md text-xs text-muted-foreground shrink-0">
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-sm shrink-0"
                  style={{ backgroundColor: (viewingFullTextResource.uploader.profileIdentity?.themePreset ? ({ purple: '#8b5cf6', blue: '#3b82f6', green: '#10b981', orange: '#f59e0b', pink: '#ec4899', cyber: '#06b6d4', academic: '#64748b', 'dark-minimal': '#1e293b' } as Record<string, string>)[viewingFullTextResource.uploader.profileIdentity.themePreset] : undefined) || viewingFullTextResource.uploader.profileIdentity?.color || '#8b5cf6' }}
                >
                  {viewingFullTextResource.uploader.profileIdentity?.avatar || '👤'}
                </div>
                <span>Shared by <strong>{viewingFullTextResource.uploader.username}</strong></span>
              </div>
              <span>Posted on {formatDate(viewingFullTextResource.createdAt)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Comment Panel (slide-in) */}
      {activeResource && (
        <CommentPanel
          resource={activeResource}
          onClose={() => setActiveResource(null)}
        />
      )}

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
    </div>
  );
}
