import { Resource } from './model';
import { CreateResourceDTO } from './validation';
import { AppError } from '../../utils/AppError';
import cloudinary from '../../config/cloudinary';

export type SortOption = 'newest' | 'oldest' | 'most_reacted' | 'pinned';
export type FileTypeFilter = 'all' | 'pdf' | 'image' | 'text-note' | 'question' | 'task' | 'announcement';

export interface SearchResourcesQuery {
  roomId: string;
  q?: string;              // Full-text search query
  type?: FileTypeFilter;   // Filter by file/card type
  pinned?: boolean;        // Only show pinned resources
  sort?: SortOption;       // Sort order
}

const UPLOADER_POPULATE = 'username profileIdentity';

export const ResourceService = {
  async uploadResource(dto: CreateResourceDTO) {
    if (!dto.file) throw new AppError('No file provided for upload', 400);

    const newResource = await Resource.create({
      title: dto.title,
      description: dto.description || '',
      type: 'file',
      url: dto.file.path,
      publicId: dto.file.filename,
      fileType: dto.file.mimetype === 'application/pdf' ? 'pdf' : 'image',
      mimeType: dto.file.mimetype,
      fileSize: dto.file.size,
      cardTheme: (dto.color || 'purple') as any,
      tags: dto.tags || [],
      room: dto.roomId,
      uploader: dto.uploaderId,
    });

    return await (newResource as any).populate('uploader', UPLOADER_POPULATE);
  },

  async createTextCard(dto: {
    title: string;
    description?: string;
    type: 'text-note' | 'question' | 'task' | 'announcement';
    content: string;
    color?: string;
    tags?: string[];
    roomId: string;
    uploaderId: string;
  }) {
    const newResource = await Resource.create({
      title: dto.title,
      description: dto.description || '',
      type: dto.type,
      content: dto.content,
      cardTheme: (dto.color || 'purple') as any,
      tags: dto.tags || [],
      room: dto.roomId,
      uploader: dto.uploaderId,
      fileType: 'none',
    });
    return await (newResource as any).populate('uploader', UPLOADER_POPULATE);
  },

  // ─── Search & Filter ────────────────────────────────────────────────────
  async searchRoomResources(query: SearchResourcesQuery) {
    const { roomId, q, type, pinned, sort = 'newest' } = query;

    // Build filter object
    const filter: Record<string, unknown> = { room: roomId, isDeleted: false };

    if (type && type !== 'all') {
      if (type === 'pdf' || type === 'image') {
        filter.fileType = type;
        filter.type = 'file';
      } else {
        filter.type = type;
      }
    }
    if (pinned === true) filter.isPinned = true;

    // Build MongoDB query
    let dbQuery = q && q.trim()
      // Use text index for keyword search
      ? Resource.find({ ...filter, $text: { $search: q.trim() } }, { score: { $meta: 'textScore' } })
      : Resource.find(filter);

    // Apply sort
    switch (sort) {
      case 'newest':
        dbQuery = dbQuery.sort({ isPinned: -1, createdAt: -1 });
        break;
      case 'oldest':
        dbQuery = dbQuery.sort({ isPinned: -1, createdAt: 1 });
        break;
      case 'most_reacted':
        dbQuery = dbQuery.sort({ isPinned: -1, 'reactions.length': -1, createdAt: -1 });
        break;
      case 'pinned':
        dbQuery = dbQuery.sort({ isPinned: -1, createdAt: -1 });
        break;
      default:
        dbQuery = dbQuery.sort({ isPinned: -1, createdAt: -1 });
    }

    if (q && q.trim()) {
      dbQuery = dbQuery.sort({ score: { $meta: 'textScore' } });
    }

    return await dbQuery.populate('uploader', UPLOADER_POPULATE);
  },

  // ─── Basic list (non-search) ─────────────────────────────────────────
  async getRoomResources(roomId: string) {
    return await Resource.find({ room: roomId, isDeleted: false })
      .populate('uploader', UPLOADER_POPULATE)
      .sort({ isPinned: -1, createdAt: -1 });
  },

  // ─── Pin/Unpin ───────────────────────────────────────────────────────
  async togglePin(resourceId: string, _userId: string) {
    const resource = await Resource.findById(resourceId);
    if (!resource || resource.isDeleted) throw new AppError('Resource not found', 404);

    resource.isPinned = !resource.isPinned;
    await resource.save();
    return await resource.populate('uploader', UPLOADER_POPULATE);
  },

  // ─── Delete ──────────────────────────────────────────────────────────
  async deleteResource(resourceId: string) {
    const resource = await Resource.findById(resourceId);
    if (!resource || resource.isDeleted) throw new AppError('Resource not found', 404);

    if (resource.type === 'file' && resource.publicId) {
      try {
        const resourceType = resource.fileType === 'pdf' ? 'raw' : 'image';
        await cloudinary.v2.uploader.destroy(resource.publicId, { resource_type: resourceType });
      } catch (err) {
        console.error('Cloudinary deletion failed:', err);
      }
    }

    await resource.deleteOne();
    return { success: true };
  },

  async toggleReaction(resourceId: string, userId: string, type: '🔥' | '🧠' | '📌' | '✅') {
    const resource = await Resource.findById(resourceId);
    if (!resource || resource.isDeleted) throw new AppError('Resource not found', 404);

    const existingIndex = resource.reactions.findIndex(
      (r) => r.user.toString() === userId
    );

    if (existingIndex > -1) {
      const existingReaction = resource.reactions[existingIndex];
      if (existingReaction.type === type) {
        resource.reactions.splice(existingIndex, 1);
      } else {
        existingReaction.type = type;
      }
    } else {
      resource.reactions.push({ user: userId as any, type });
    }

    await resource.save();
    return await resource.populate('uploader', UPLOADER_POPULATE);
  },

  async updateResource(resourceId: string, userId: string, updateData: { title?: string; description?: string; content?: string; color?: string; tags?: string[] }) {
    const resource = await Resource.findById(resourceId);
    if (!resource || resource.isDeleted) throw new AppError('Resource not found', 404);

    if (resource.uploader.toString() !== userId) {
      throw new AppError('Only the creator can edit this resource card', 403);
    }

    const createdAt = new Date(resource.createdAt);
    const now = new Date();
    const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);
    if (diffMinutes > 15) {
      throw new AppError('Editing window has expired. Cards can only be edited within 15 minutes of creation.', 400);
    }

    if (updateData.title !== undefined) resource.title = updateData.title;
    if (updateData.description !== undefined) resource.description = updateData.description;
    if (updateData.content !== undefined) resource.content = updateData.content;
    if (updateData.color !== undefined) resource.set('cardTheme', updateData.color);
    if (updateData.tags !== undefined) resource.tags = updateData.tags;

    await resource.save();
    return await resource.populate('uploader', UPLOADER_POPULATE);
  },
};
