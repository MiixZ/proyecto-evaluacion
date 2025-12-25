import { UUID } from '@CustomTypes/common.types';
import { UserRole, UserStatus, Timestamps } from '@CustomTypes/common.types';

/**
 * Mapeo directo de la tabla 'users' en la base de datos
 * Incluye TODOS los campos tal como están en MySQL
 */
export interface UserEntity extends Timestamps {
  id: UUID;
  authId: string;
  email: string;
  passwordHash: string;  // Hash bcrypt de la contraseña
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  phone?: string | null;
  bio?: string | null;
  profileImageUrl?: string | null;
  preferredLanguage: 'es' | 'en';
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

/**
 * DTO para respuesta de usuario (excluye datos sensibles)
 */
export interface UserDTO {
  id: UUID;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  phone?: string | null;
  bio?: string | null;
  profileImageUrl?: string | null;
  preferredLanguage: 'es' | 'en';
  createdAt: Date;
}

/**
 * DTO para perfil público (máximo restringido)
 */
export interface UserPublicDTO {
  id: UUID;
  firstName: string;
  lastName: string;
  profileImageUrl?: string | null;
  bio?: string | null;
}
