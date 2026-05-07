import React, { useState, useRef } from 'react';
import { useResourceStore } from '../../store/resourceStore';
import { useRoomStore } from '../../store/roomStore';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const { currentRoom } = useRoomStore();
  const { uploadResource, createTextCard, isLoading, uploadProgress, error, resetUploadProgress } = useResourceStore();
  
  const [resourceType, setResourceType] = useState<'file' | 'text-note' | 'question' | 'task' | 'announcement'>('file');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [cardColor, setCardColor] = useState<'default' | 'blue' | 'purple' | 'amber' | 'rose' | 'emerald'>('default');
  const [tags, setTags] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !currentRoom) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValidationError('');
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      
      if (!ALLOWED_TYPES.includes(selectedFile.type)) {
        setValidationError('Only PDF, JPG, and PNG files are allowed.');
        setFile(null);
        return;
      }
      
      if (selectedFile.size > MAX_FILE_SIZE) {
        setValidationError(`File is too large. Maximum size is 10MB.`);
        setFile(null);
        return;
      }
      
      setFile(selectedFile);
      if (!title) {
        const nameWithoutExt = selectedFile.name.split('.').slice(0, -1).join('.');
        setTitle(nameWithoutExt);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!title.trim()) {
      setValidationError('Title is required.');
      return;
    }

    const tagArray = tags.split(',').map(t => t.trim()).filter(Boolean);

    try {
      if (resourceType === 'file') {
        if (!file) {
          setValidationError('Please select a file to upload.');
          return;
        }

        const formData = new FormData();
        formData.append('title', title.trim());
        if (description.trim()) formData.append('description', description.trim());
        formData.append('tags', JSON.stringify(tagArray));
        formData.append('file', file);
        formData.append('color', cardColor);

        await uploadResource(currentRoom._id, formData);
      } else {
        if (!content.trim()) {
          setValidationError('Content is required for text cards.');
          return;
        }

        await createTextCard(currentRoom._id, {
          title: title.trim(),
          description: description.trim() || undefined,
          type: resourceType,
          content: content.trim(),
          color: cardColor,
          tags: tagArray,
        });
      }

      setTimeout(() => {
        handleClose();
      }, 500);
    } catch (err) {
      // Error is handled in store
    }
  };

  const handleClose = () => {
    setResourceType('file');
    setTitle('');
    setDescription('');
    setContent('');
    setCardColor('default');
    setTags('');
    setFile(null);
    setValidationError('');
    resetUploadProgress();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-lg rounded-2xl shadow-xl border border-border overflow-hidden">
        <div className="p-6 border-b border-border flex justify-between items-center">
          <h2 className="text-xl font-bold text-foreground">Create Resource Card</h2>
          <button onClick={handleClose} disabled={isLoading} className="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>

        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {(error || validationError) && (
            <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
              {validationError || error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Resource Type Tabs */}
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">Card Type</label>
              <div className="grid grid-cols-5 gap-1.5 bg-muted p-1 rounded-xl border border-border/40">
                {(['file', 'text-note', 'question', 'task', 'announcement'] as const).map((t) => {
                  const icons = {
                    file: '📂',
                    'text-note': '📝',
                    question: '❓',
                    task: '✅',
                    announcement: '📢',
                  };
                  const labels = {
                    file: 'File',
                    'text-note': 'Note',
                    question: 'Query',
                    task: 'Task',
                    announcement: 'Alert',
                  };
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setResourceType(t)}
                      className={`flex flex-col items-center justify-center py-2 text-[10px] font-bold rounded-lg transition-all ${
                        resourceType === t
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <span className="text-sm mb-0.5">{icons[t]}</span>
                      <span>{labels[t]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* File Selection (Only for file type) */}
            {resourceType === 'file' ? (
              <div>
                <div 
                  onClick={() => !isLoading && fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                    file ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                    accept=".pdf,.jpg,.jpeg,.png"
                    disabled={isLoading}
                  />
                  {file ? (
                    <div className="text-sm font-medium text-primary break-all">
                      📄 {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Click to select</span> or drag and drop<br/>
                      PDF, JPG, or PNG (Max 10MB)
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Content Area (For text based cards) */
              <div>
                <label className="block text-sm font-medium mb-1 text-foreground">Card Content <span className="text-destructive">*</span></label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  disabled={isLoading}
                  required
                  rows={4}
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none font-mono"
                  placeholder={`Supports Markdown: **bold**, *italics*, bulleted lists, and checklists (- [ ] task1).`}
                />
              </div>
            )}

            {/* Card Theme Picker */}
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
                      onClick={() => setCardColor(colorItem.name)}
                      className={`w-7 h-7 rounded-full border transition-all ${colorItem.bg} ${
                        cardColor === colorItem.name ? colorItem.active : 'hover:scale-105'
                      }`}
                      title={`${colorItem.name.toUpperCase()} Theme`}
                    />
                  ))}
                </div>
              </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-1 text-foreground">Title <span className="text-destructive">*</span></label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isLoading}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="e.g. Chapter 1 Notes"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-1 text-foreground">Short Description <span className="text-muted-foreground font-normal">(optional)</span></label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLoading}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="A brief subtitle for this card"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium mb-1 text-foreground">Tags <span className="text-muted-foreground font-normal">(comma separated)</span></label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                disabled={isLoading}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="formula, quiz, important"
              />
            </div>

            {/* Progress Bar & Actions */}
            <div className="pt-2">
              {isLoading && resourceType === 'file' && uploadProgress > 0 && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1 font-medium">
                    <span className="text-primary">Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-primary h-2 transition-all duration-300 ease-out" 
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={handleClose} 
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-muted text-muted-foreground rounded-lg text-sm font-medium hover:bg-muted/80 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                >
                  {isLoading ? 'Processing...' : 'Create'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
