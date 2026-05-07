import React, { useEffect, useRef, useState } from 'react';
import { useCommentStore } from '../../store/commentStore';
import type { Comment } from '../../store/commentStore';
import { useAuthStore } from '../../store/authStore';
import type { Resource } from '../../store/resourceStore';

interface CommentPanelProps {
  resource: Resource | null;
  onClose: () => void;
}

const COMMENT_REACTIONS = ['👍', '🧠', '😂', '🔥'];
const RESOURCE_REACTIONS = ['🔥', '🧠', '📌', '✅'];

function CommentItem({
  comment,
  allComments,
  currentUserId,
  onReply,
  onDelete,
  onReact,
}: {
  comment: Comment;
  allComments: Comment[];
  currentUserId: string;
  onReply: (commentId: string, username: string) => void;
  onDelete: (commentId: string) => void;
  onReact: (commentId: string, type: string) => void;
}) {
  const replies = allComments.filter((c) => c.parentComment === comment._id);

  const getReactionCount = (type: string) =>
    comment.reactions.filter((r) => r.type === type).length;

  const myReaction = comment.reactions.find((r) => r.user === currentUserId)?.type;

  const formatTime = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`${comment.depth === 1 ? 'ml-8 border-l-2 border-border pl-3' : ''}`}>
      <div className="flex gap-2 group py-2">
        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 mt-0.5"
          style={{ backgroundColor: comment.author.profileIdentity?.color || '#ccc' }}
        >
          {comment.author.profileIdentity?.avatar || '👤'}
        </div>
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-sm text-foreground">{comment.author.username}</span>
            <span className="text-[11px] text-muted-foreground">{formatTime(comment.createdAt)}</span>
          </div>
          <p className={`text-sm mt-0.5 break-words ${comment.isDeleted ? 'text-muted-foreground italic' : 'text-foreground'}`}>
            {comment.content}
          </p>

          {/* Actions */}
          {!comment.isDeleted && (
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              {/* Reactions */}
              <div className="flex gap-1">
                {COMMENT_REACTIONS.map((emoji) => {
                  const count = getReactionCount(emoji);
                  return (
                    <button
                      key={emoji}
                      onClick={() => onReact(comment._id, emoji)}
                      className={`text-xs px-1.5 py-0.5 rounded-full transition-all ${
                        myReaction === emoji
                          ? 'bg-primary/20 text-primary font-bold'
                          : 'hover:bg-muted text-muted-foreground'
                      }`}
                    >
                      {emoji}{count > 0 ? ` ${count}` : ''}
                    </button>
                  );
                })}
              </div>

              {/* Reply (only for top-level) */}
              {comment.depth === 0 && (
                <button
                  onClick={() => onReply(comment._id, comment.author.username)}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  Reply
                </button>
              )}

              {/* Delete (own comments only) */}
              {comment.author._id === currentUserId && (
                <button
                  onClick={() => onDelete(comment._id)}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Replies */}
      {replies.map((reply) => (
        <CommentItem
          key={reply._id}
          comment={reply}
          allComments={allComments}
          currentUserId={currentUserId}
          onReply={onReply}
          onDelete={onDelete}
          onReact={onReact}
        />
      ))}
    </div>
  );
}

export default function CommentPanel({ resource, onClose }: CommentPanelProps) {
  const { user } = useAuthStore();
  const {
    comments,
    isLoading,
    fetchComments,
    postComment,
    deleteComment,
    toggleCommentReaction,
    toggleResourceReaction,
  } = useCommentStore();

  const [input, setInput] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Only top-level comments; replies are rendered as children
  const topLevelComments = comments.filter((c) => !c.parentComment);

  useEffect(() => {
    if (resource) fetchComments(resource._id);
  }, [resource?._id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !resource) return;

    await postComment(resource._id, input.trim(), user!, replyingTo?.id);
    setInput('');
    setReplyingTo(null);
  };

  const handleReply = (commentId: string, username: string) => {
    setReplyingTo({ id: commentId, username });
    setInput(`@${username} `);
  };

  const resourceReactionCounts = (type: string) =>
    (resource as any)?.reactions?.filter((r: any) => r.type === type).length || 0;

  const myResourceReaction = (resource as any)?.reactions?.find(
    (r: any) => r.user === user?._id
  )?.type;

  if (!resource) return null;

  return (
    <>
      {/* Backdrop for mobile */}
      <div
        className="fixed inset-0 bg-background/60 backdrop-blur-sm z-30 md:hidden"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-full md:w-96 bg-card border-l border-border z-40 flex flex-col shadow-2xl transition-transform">
        {/* Header */}
        <div className="p-4 border-b border-border flex justify-between items-start shrink-0">
          <div className="flex-1 min-w-0 pr-2">
            <h3 className="font-bold text-foreground truncate">{resource.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5 capitalize">
              {resource.fileType} · {(resource.fileSize / 1024 / 1024).toFixed(2)} MB
            </p>
            {/* Resource Reactions */}
            <div className="flex gap-1 mt-2">
              {RESOURCE_REACTIONS.map((emoji) => {
                const count = resourceReactionCounts(emoji);
                return (
                  <button
                    key={emoji}
                    onClick={() => toggleResourceReaction(resource._id, emoji)}
                    className={`text-xs px-2 py-1 rounded-full transition-all border ${
                      myResourceReaction === emoji
                        ? 'bg-primary/20 border-primary/30 text-primary font-bold'
                        : 'border-border hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    {emoji}{count > 0 ? ` ${count}` : ''}
                  </button>
                );
              })}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-lg shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {isLoading ? (
            <p className="text-center text-muted-foreground animate-pulse text-sm">Loading...</p>
          ) : topLevelComments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <span className="text-4xl mb-3">💬</span>
              <p className="font-medium">No discussion yet</p>
              <p className="text-sm mt-1">Be the first to comment on this resource!</p>
            </div>
          ) : (
            topLevelComments.map((comment) => (
              <CommentItem
                key={comment._id}
                comment={comment}
                allComments={comments}
                currentUserId={user?._id || ''}
                onReply={handleReply}
                onDelete={deleteComment}
                onReact={toggleCommentReaction}
              />
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-border shrink-0">
          {replyingTo && (
            <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-md mb-2">
              <span>Replying to <strong>@{replyingTo.username}</strong></span>
              <button onClick={() => { setReplyingTo(null); setInput(''); }} className="hover:text-foreground">✕</button>
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
              maxLength={2000}
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
