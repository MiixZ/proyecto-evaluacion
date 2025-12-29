import { UUID, Timestamps, UserRole } from '@CustomTypes/common.types';

export interface GroupEntity extends Timestamps {
  id: UUID;
  courseId: UUID;
  name: string;
  description: string | null;
  capacity: number | null;
  status: 'active' | 'archived';
}

export interface GroupMemberEntity {
  userId: UUID;
  groupId: UUID;
  role: UserRole;
  enrolledAt: Date;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface GroupDTO {
  id: UUID;
  courseId: UUID;
  name: string;
  description: string | null;
  capacity: number | null;
  status: string;
}

export interface GroupMemberDTO {
  userId: UUID;
  role: string;
  enrolledAt: Date;
  fullName?: string;
  email?: string;
}
