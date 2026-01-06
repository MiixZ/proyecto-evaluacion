import { LanguageType, UUID } from '@CustomTypes/common.types';
import { UserRole, UserStatus, Timestamps } from '@CustomTypes/common.types';

/**
 * Mapeo directo de la tabla 'users' en la base de datos
 * Incluye TODOS los campos
 */
export interface UserEntity extends Timestamps {
  id: UUID;
  authId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  phone?: string | null;
  bio?: string | null;
  profileImageUrl?: string | null;
  mustChangePassword: boolean;
  preferredLanguage: LanguageType;
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
  mustChangePassword: boolean;
  preferredLanguage: LanguageType;
  createdAt: Date;
  enrollments?: UserEnrollmentDTO[];
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

export interface UserEnrollmentDTO {
  subjectName: string;
  groupName: string;
  academicYear: string;
  role: string;
}

/**
 * DTO para respuesta de creación de usuario
 * Incluye la contraseña temporal generada (solo se devuelve una vez)
 */
export interface CreateUserResponse extends UserDTO {
  temporaryPassword?: string;
}
