import { Resource } from './model';
import { CreateResourceDTO } from './validation';
import { AppError } from '../../utils/AppError';
import cloudinary from '../../config/cloudinary';

export type SortOption = 'newest' | 'oldest' | 'most_reacted' | 'pinned';
export type FileTypeFilter = 'all' | 'pdf' | 'image';

export interface SearchResourcesQuery {
  roomId: string;
  q?: string;              // Full-text search query
  type?: FileTypeFilter;   // Filter by file type
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
      url: dto.file.path,
      publicId: dto.file.filename,
      fileType: dto.file.mimetype === 'application/pdf' ? 'pdf' : 'image',
      mimeType: dto.file.mimetype,
      fileSize: dto.file.size,
      tags: dto.tags || [],
      room: dto.roomId,
      uploader: dto.uploaderId,
    });

    return await newResource.populate('uploader', UPLOADER_POPULATE);
  },

  // ─── Search & Filter ────────────────────────────────────────────────────
  async searchRoomResources(query: SearchResourcesQuery) {
    const { roomId, q, type, pinned, sort = 'newest' } = query;

    // Build filter object
    const filter: Record<string, unknown> = { room: roomId, isDeleted: false };

    if (type && type !== 'all') filter.fileType = type;
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
        // Sort by size of reactions array descending, then newest
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

    // Only uploader or room admin can pin (room admin check done in middleware)
    resource.isPinned = !resource.isPinned;
    await resource.save();
    return await resource.populate('uploader', UPLOADER_POPULATE);
  },

  // ─── Delete ──────────────────────────────────────────────────────────
  async deleteResource(resourceId: string) {
    const resource = await Resource.findById(resourceId);
    if (!resource || resource.isDeleted) throw new AppError('Resource not found', 404);

    try {
      const resourceType = resource.fileType === 'pdf' ? 'raw' : 'image';
      await cloudinary.v2.uploader.destroy(resource.publicId, { resource_type: resourceType });
    } catch (err) {
      console.error('Cloudinary deletion failed:', err);
    }

    await resource.deleteOne();
    return { success: true };
  },
};
