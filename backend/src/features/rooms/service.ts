import { Room } from './model';
import { AppError } from '../../utils/AppError';
import mongoose from 'mongoose';

export const RoomService = {
  async createRoom(data: any, userId: string) {
    const room = await Room.create({
      ...data,
      members: [
        {
          user: new mongoose.Types.ObjectId(userId),
          role: 'owner',
        },
      ],
    });

    return room;
  },

  async getUserRooms(userId: string) {
    // Find rooms where the user is a member
    const rooms = await Room.find({ 'members.user': userId })
      .select('-members._id') // Exclude subdocument IDs for cleanliness
      .populate('members.user', 'username profileIdentity')
      .sort({ updatedAt: -1 });
    
    return rooms;
  },

  async getRoomByJoinCode(joinCode: string, userId: string) {
    const room = await Room.findOne({ joinCode })
      .populate('members.user', 'username profileIdentity');

    if (!room) {
      throw new AppError('Room not found with this join code', 404);
    }

    // Ensure the user is a member to view details
    const isMember = room.members.some(
      (m) => m.user._id.toString() === userId.toString()
    );

    if (!isMember) {
      throw new AppError('You are not a member of this room', 403);
    }

    return room;
  },

  async joinRoom(joinCode: string, userId: string) {
    const room = await Room.findOne({ joinCode });

    if (!room) {
      throw new AppError('Invalid join code', 404);
    }

    const isMember = room.members.some(
      (m) => m.user.toString() === userId.toString()
    );

    if (isMember) {
      throw new AppError('You are already a member of this room', 400);
    }

    room.members.push({
      user: new mongoose.Types.ObjectId(userId),
      role: 'member',
    } as any); // Cast as any to bypass mongoose array types loosely for push

    await room.save();

    // Return populated room
    return await Room.findById(room._id).populate(
      'members.user',
      'username profileIdentity'
    );
  },
};
