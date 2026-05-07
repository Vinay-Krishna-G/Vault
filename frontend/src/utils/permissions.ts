export const ROLE_HIERARCHY: Record<string, number> = {
  owner: 3,
  admin: 2,
  member: 1,
};

export interface RoomWithSettings {
  isArchived?: boolean;
  members: Array<{
    user: any;
    role: string;
  }>;
  settings?: {
    chatPermission?: 'everyone' | 'admins-only' | 'owner-only';
    resourcePermission?: 'everyone' | 'admins-only' | 'owner-only';
    textCardPermission?: 'everyone' | 'admins-only' | 'owner-only';
    pinPermission?: 'everyone' | 'admins-only' | 'owner-only';
    roomInfoPermission?: 'everyone' | 'admins-only' | 'owner-only';
  };
}

function getUserRole(room: RoomWithSettings, userId: string): string | null {
  const member = room.members.find((m) => {
    const mId = m.user?._id || m.user;
    return mId?.toString() === userId;
  });
  return member ? member.role : null;
}

function evaluatePermission(
  requiredPermission: 'everyone' | 'admins-only' | 'owner-only',
  userRole: string | null
): boolean {
  if (!userRole) return false;
  if (requiredPermission === 'everyone') return true;
  
  const userPower = ROLE_HIERARCHY[userRole] || 1;
  if (requiredPermission === 'admins-only') {
    return userPower >= ROLE_HIERARCHY.admin;
  }
  if (requiredPermission === 'owner-only') {
    return userPower >= ROLE_HIERARCHY.owner;
  }
  return false;
}

export const FrontendPermissions = {
  canSendChat(room: RoomWithSettings, userId: string): boolean {
    if (room.isArchived) return false;
    const role = getUserRole(room, userId);
    const perm = room.settings?.chatPermission || 'everyone';
    return evaluatePermission(perm, role);
  },

  canUploadResource(room: RoomWithSettings, userId: string): boolean {
    if (room.isArchived) return false;
    const role = getUserRole(room, userId);
    const perm = room.settings?.resourcePermission || 'everyone';
    return evaluatePermission(perm, role);
  },

  canCreateTextCard(room: RoomWithSettings, userId: string): boolean {
    if (room.isArchived) return false;
    const role = getUserRole(room, userId);
    const perm = room.settings?.textCardPermission || 'everyone';
    return evaluatePermission(perm, role);
  },

  canPin(room: RoomWithSettings, userId: string): boolean {
    if (room.isArchived) return false;
    const role = getUserRole(room, userId);
    const perm = room.settings?.pinPermission || 'everyone';
    return evaluatePermission(perm, role);
  },

  canEditRoomInfo(room: RoomWithSettings, userId: string): boolean {
    const role = getUserRole(room, userId);
    const perm = room.settings?.roomInfoPermission || 'admins-only';
    return evaluatePermission(perm, role);
  },

  isOwner(room: RoomWithSettings, userId: string): boolean {
    const role = getUserRole(room, userId);
    return role === 'owner';
  },

  isOwnerOrAdmin(room: RoomWithSettings, userId: string): boolean {
    const role = getUserRole(room, userId);
    return role === 'owner' || role === 'admin';
  },
};
