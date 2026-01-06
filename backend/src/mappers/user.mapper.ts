import { UserRole, UserStatus, UUID } from '@CustomTypes/common.types';
import { UserEntity, UserDTO } from '@models/user/user.entity';
import { UserRow } from '@models/user/user.row';
import { BaseMapper } from '@utils/mapper';

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
      mustChangePassword: Boolean(row.must_change_password),
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
      mustChangePassword: entity.mustChangePassword,
      preferredLanguage: entity.preferredLanguage,
      createdAt: entity.createdAt,
      enrollments: [],
    };
  }
}

export const userMapper = new UserMapper();
