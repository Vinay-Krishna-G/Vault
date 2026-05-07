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
  const { uploadResource, isLoading, uploadProgress, error, resetUploadProgress } = useResourceStore();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
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
        // Auto-fill title with filename (without extension) if empty
        const nameWithoutExt = selectedFile.name.split('.').slice(0, -1).join('.');
        setTitle(nameWithoutExt);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setValidationError('Please select a file to upload.');
      return;
    }
    if (!title.trim()) {
      setValidationError('Title is required.');
      return;
    }

    const formData = new FormData();
    formData.append('title', title.trim());
    if (description.trim()) formData.append('description', description.trim());
    if (tags.trim()) formData.append('tags', JSON.stringify(tags.split(',').map(t => t.trim()).filter(Boolean)));
    formData.append('file', file);

    try {
      await uploadResource(currentRoom._id, formData);
      // Wait a tiny bit to show 100% before closing
      setTimeout(() => {
        handleClose();
      }, 500);
    } catch (err) {
      // Error is handled by store
    }
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setTags('');
    setFile(null);
    setValidationError('');
    resetUploadProgress();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border overflow-hidden">
        <div className="p-6 border-b border-border flex justify-between items-center">
          <h2 className="text-xl font-bold text-foreground">Upload Resource</h2>
          <button onClick={handleClose} disabled={isLoading} className="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>

        <div className="p-6">
          {(error || validationError) && (
            <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
              {validationError || error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* File Selection */}
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

            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-1">Title <span className="text-destructive">*</span></label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isLoading}
                className="w-full px-3 py-2 bg-background border border-input rounded-md"
                placeholder="e.g. Chapter 1 Notes"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-1">Description <span className="text-muted-foreground font-normal">(optional)</span></label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLoading}
                className="w-full px-3 py-2 bg-background border border-input rounded-md resize-none"
                placeholder="Briefly describe this resource"
                rows={2}
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium mb-1">Tags <span className="text-muted-foreground font-normal">(comma separated)</span></label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                disabled={isLoading}
                className="w-full px-3 py-2 bg-background border border-input rounded-md"
                placeholder="math, midterms, formulas"
              />
            </div>

            {/* Progress Bar & Actions */}
            <div className="pt-2">
              {isLoading && uploadProgress > 0 && (
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
                  disabled={isLoading || !file}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                >
                  {isLoading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
