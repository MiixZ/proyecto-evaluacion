import { UserRole, UserStatus, UUID } from '@CustomTypes/common.types';
import { UserEntity, UserDTO } from '@models/user/user.entity';
import { BaseMapper } from '@utils/mapper';
import { RowDataPacket } from 'mysql2';

interface UserRow extends RowDataPacket {
  id: string;
  auth_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  status: string;
  phone: string | null;
  bio: string | null;
  profile_image_url: string | null;
  preferred_language: string;
  created_at: Date;
  updated_at: Date;
}

class UserMapper extends BaseMapper<UserEntity, UserDTO, UserRow> {
  toEntity(row: UserRow): UserEntity {
    return {
      id: row.id as UUID,
      authId: row.auth_id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      role: row.role as UserRole,
      status: row.status as UserStatus,
      phone: row.phone,
      bio: row.bio,
      profileImageUrl: row.profile_image_url,
      preferredLanguage: row.preferred_language as 'es' | 'en',
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
    };
  }

  toDTO(entity: UserEntity): UserDTO {
    return {
      id: entity.id,
      email: entity.email,
      firstName: entity.firstName,
      lastName: entity.lastName,
      role: entity.role,
      status: entity.status,
      phone: entity.phone,
      bio: entity.bio,
      profileImageUrl: entity.profileImageUrl,
      preferredLanguage: entity.preferredLanguage,
      createdAt: entity.createdAt,
    };
  }
}

export const userMapper = new UserMapper();
