import React, { useEffect, useState } from 'react';
import { useResourceStore } from '../../store/resourceStore';
import type { Resource } from '../../store/resourceStore';
import { useRoomStore } from '../../store/roomStore';
import { useAuthStore } from '../../store/authStore';
import UploadModal from './UploadModal';
import CommentPanel from '../comments/CommentPanel';

export default function ResourceBoard() {
  const { currentRoom } = useRoomStore();
  const { user } = useAuthStore();
  const { resources, isLoading, error, fetchResources, deleteResource } = useResourceStore();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [activeResource, setActiveResource] = useState<Resource | null>(null);

  useEffect(() => {
    if (currentRoom) {
      fetchResources(currentRoom._id);
    }
    // Close panel when room changes
    setActiveResource(null);
  }, [currentRoom?._id]);

  if (!currentRoom) return null;

  const memberRecord = currentRoom.members.find((m) => m.user._id === user?._id);
  const isRoomAdmin = memberRecord && (memberRecord.role === 'owner' || memberRecord.role === 'admin');

  const canDelete = (resource: Resource) => isRoomAdmin || resource.uploader._id === user?._id;

  const handleDelete = async (e: React.MouseEvent, resourceId: string, title: string) => {
    e.stopPropagation(); // Prevent opening the comment panel
    if (window.confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
      await deleteResource(resourceId);
      if (activeResource?._id === resourceId) setActiveResource(null);
    }
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="flex-1 flex h-full bg-background overflow-hidden relative">
      {/* Main Board Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b p-4 md:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{currentRoom.name}</h1>
            <p className="text-sm text-muted-foreground">{currentRoom.description || 'Important Resources'}</p>
          </div>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium text-sm shadow-sm hover:bg-primary/90 transition-colors"
          >
            + Upload
          </button>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-lg text-sm">{error}</div>
          )}

          {isLoading && resources.length === 0 ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-muted-foreground animate-pulse">Loading resources...</p>
            </div>
          ) : resources.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full max-h-[60vh] text-center px-4">
              <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
                <span className="text-4xl opacity-50">📂</span>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">No resources yet</h3>
              <p className="text-muted-foreground max-w-sm mb-6">
                This room doesn't have any shared files. Upload the first resource to start collaborating!
              </p>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-medium shadow-sm hover:bg-primary/90 transition-colors"
              >
                Upload the first resource
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 pb-20">
              {resources.map((resource) => (
                <div
                  key={resource._id}
                  onClick={() => setActiveResource(resource._id === activeResource?._id ? null : resource)}
                  className={`group bg-card border rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col cursor-pointer ${
                    activeResource?._id === resource._id
                      ? 'border-primary ring-2 ring-primary/30'
                      : 'border-border'
                  }`}
                >
                  {/* Preview */}
                  <div className="bg-muted aspect-video w-full flex items-center justify-center border-b border-border relative overflow-hidden">
                    {resource.fileType === 'image' ? (
                      <img src={resource.url} alt={resource.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center">
                        <span className="text-5xl">📄</span>
                        <p className="mt-2 text-xs font-semibold text-muted-foreground uppercase">PDF Document</p>
                      </div>
                    )}
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className="bg-background/90 backdrop-blur-sm text-foreground text-[10px] font-bold px-2 py-1 rounded shadow-sm uppercase tracking-wider">
                        {resource.fileType}
                      </span>
                    </div>
                    {/* Open link icon */}
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="absolute top-3 right-3 bg-background/80 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                      title="Open file"
                    >
                      ↗
                    </a>
                  </div>

                  {/* Details */}
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <h3 className="font-bold text-foreground leading-tight line-clamp-2" title={resource.title}>
                        {resource.title}
                      </h3>
                      {canDelete(resource) && (
                        <button
                          onClick={(e) => handleDelete(e, resource._id, resource.title)}
                          className="text-muted-foreground hover:text-destructive shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete Resource"
                        >
                          🗑️
                        </button>
                      )}
                    </div>

                    {resource.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3 flex-1">
                        {resource.description}
                      </p>
                    )}

                    {resource.tags && resource.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3 mt-auto">
                        {resource.tags.slice(0, 3).map((tag, idx) => (
                          <span key={idx} className="bg-secondary text-secondary-foreground text-[10px] px-1.5 py-0.5 rounded-sm">
                            #{tag}
                          </span>
                        ))}
                        {resource.tags.length > 3 && (
                          <span className="text-[10px] text-muted-foreground">+{resource.tags.length - 3}</span>
                        )}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center gap-2 mt-auto pt-3 border-t border-border">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] shadow-sm shrink-0"
                        style={{ backgroundColor: resource.uploader.profileIdentity?.color || '#ccc' }}
                        title={resource.uploader.username}
                      >
                        {resource.uploader.profileIdentity?.avatar || '👤'}
                      </div>
                      <div className="flex-1 flex justify-between items-center text-xs text-muted-foreground truncate">
                        <span className="truncate pr-2">{resource.uploader.username}</span>
                        <span className="shrink-0">{formatDate(resource.createdAt)}</span>
                      </div>
                      {/* Comment count indicator */}
                      <span className="text-xs text-muted-foreground flex items-center gap-1" title="Click card to discuss">
                        💬
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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
