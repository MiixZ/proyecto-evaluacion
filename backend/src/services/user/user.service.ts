import { userModel } from '@models/user/user.model';
import {
  UserDTO,
  UserEntity,
  CreateUserResponse,
} from '@models/user/user.entity';
import {
  PaginatedResponse,
  UUID,
  UserRole,
  UserStatus,
} from '@CustomTypes/common.types';
import { CreateUserInput, UpdateUserInput } from '@validators/user.validator';
import { UserFilters } from './user.filter';
import { emailService } from '@services/notification/email.service';
import { userMapper } from '@mappers/user.mapper';
import { auditService } from '@services/audit/audit.service';
import {
  AuthenticationError,
  ConflictError,
  NotFoundError,
} from '@utils/errors';
import { generateTemporaryPassword } from '@utils/jwt.utils';
import { logger } from '@utils/logger';

/**
 * Servicio para gestión de usuarios del sistema
 * Incluye creación, actualización, listado y asignación a grupos
 */
export class UserService {
  /**
   * Crea un nuevo usuario en el sistema
   * @param input - Datos del usuario a crear
   * @param creatorId - ID del usuario que crea (para auditoría)
   * @returns DTO del usuario creado con contraseña temporal si fue generada
   */
  async createUser(
    input: CreateUserInput,
    creatorId?: UUID
  ): Promise<CreateUserResponse> {
    // Generar contraseña temporal segura (siempre)
    const temporaryPassword = generateTemporaryPassword();
    const password = input.password || temporaryPassword;

    // El modelo ya gestiona reactivación si el usuario existe y está borrado lógicamente
    const newUser = await userModel.create(input, password);

    // Intentar enviar email de bienvenida (no bloquear si falla)
    try {
      await emailService.sendWelcomeEmail(
        newUser.email,
        newUser.firstName,
        password
      );
    } catch (error) {
      logger.warn('No se pudo enviar email de bienvenida', {
        email: newUser.email,
        error,
      });
    }

    if (creatorId) {
      await auditService.log(
        'CREATE_USER',
        'user',
        newUser.id,
        {
          email: newUser.email,
          role: newUser.role,
          hasTemporaryPassword: true,
        },
        creatorId
      );
    }

    const userDTO = userMapper.toDTO(newUser);

    // Devolver contraseña temporal en respuesta (solo una vez)
    return {
      ...userDTO,
      temporaryPassword: password,
    };
  }

  /**
   * Obtiene un usuario por su ID
   * @param id - ID del usuario
   * @returns DTO del usuario
   * @throws NotFoundError si el usuario no existe
   */
  async getUserById(id: string): Promise<UserDTO> {
    const user = await userModel.getById(id as UUID);

    if (!user) throw new NotFoundError('Usuario no encontrado');

    return userMapper.toDTO(user);
  }

  async getUserByEmail(email: string): Promise<UserEntity> {
    return await userModel.getByEmail(email);
  }

  /**
   * Lista usuarios con paginación y filtros
   * @param page - Número de página
   * @param limit - Cantidad de resultados por página
   * @param filters - Filtros de búsqueda
   * @returns Respuesta paginada con usuarios
   */
  async listUsers(
    page: number,
    limit: number,
    filters: UserFilters
  ): Promise<PaginatedResponse<UserEntity>> {
    return await userModel.list(page, limit, filters);
  }

  async assignGroup(
    userId: string,
    groupId: string,
    role: string
  ): Promise<void> {
    const user = await userModel.getById(userId as UUID);
    if (!user) throw new NotFoundError('Usuario no encontrado');

    await userModel.assignToGroup(userId as UUID, groupId as UUID, role);

    await auditService.log(
      'ASSIGN_GROUP',
      'user',
      userId as UUID,
      { groupId, role },
      userId as UUID
    );
  }

  async getUserEnrollments(userId: string) {
    const enrollments = await userModel.getEnrollments(userId as UUID);
    return enrollments.map((e) => ({
      subjectName: e.subject_name,
      groupName: e.group_name,
      academicYear: e.academic_year,
      role: e.role,
    }));
  }

  async getProfile(userId: string): Promise<UserDTO> {
    const user = await userModel.getById(userId as UUID);

    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    const userDTO = userMapper.toDTO(user);

    const enrollments = await userModel.getEnrollments(userId);

    userDTO.enrollments = enrollments.map((e) => ({
      subjectName: e.subject_name,
      groupName: e.group_name,
      academicYear: e.academic_year,
      role: e.role,
    }));

    return userDTO;
  }

  /**
   * Busca un estudiante por email o lo crea si no existe
   * Útil para importaciones masivas de estudiantes
   * @param email - Email del estudiante
   * @param firstName - Nombre del estudiante
   * @param lastName - Apellidos del estudiante
   * @returns DTO del estudiante encontrado o creado
   */
  async findOrCreateStudent(
    email: string,
    firstName: string,
    lastName: string
  ): Promise<UserDTO> {
    // El modelo ya gestiona reactivación si el usuario existe y está borrado lógicamente
    const password = generateTemporaryPassword();
    const newUser = await userModel.create(
      {
        email,
        firstName,
        lastName,
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
        preferredLanguage: 'es',
      },
      password
    );

    try {
      await emailService.sendWelcomeEmail(
        newUser.email,
        newUser.firstName,
        password
      );
    } catch (error) {
      logger.warn('No se pudo enviar email de bienvenida', {
        email: newUser.email,
        error,
      });
    }

    // Devolver DTO y contraseña temporal
    return {
      ...userMapper.toDTO(newUser),
      temporaryPassword: password,
    };
  }

  async updateProfile(
    userId: string,
    input: UpdateUserInput
  ): Promise<UserDTO> {
    const user = await userModel.getById(userId as UUID);

    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    await userModel.update(userId as UUID, {
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      bio: input.bio,
      preferredLanguage: input.preferredLanguage,
    });

    await auditService.log(
      'UPDATE_PROFILE',
      'user',
      userId,
      input,
      userId as UUID
    );

    const updatedUser = await userModel.getById(userId as UUID);
    const userDTO = userMapper.toDTO(updatedUser!);

    const enrollments = await userModel.getEnrollments(userId as UUID);
    userDTO.enrollments = enrollments.map((e) => ({
      subjectName: e.subject_name,
      groupName: e.group_name,
      academicYear: e.academic_year,
      role: e.role,
    }));

    return userDTO;
  }

  /**
   * Cambia la contraseña del usuario
   * @param userId - ID del usuario
   * @param currentPassword - Contraseña actual
   * @param newPassword - Nueva contraseña
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const currentHash = await userModel.getPasswordHash(userId as UUID);

    const { comparePassword, hashPassword } = await import('@utils/jwt.utils');
    const isValidPassword = await comparePassword(currentPassword, currentHash);

    if (!isValidPassword) {
      throw new AuthenticationError('La contraseña actual es incorrecta');
    }

    const newHash = await hashPassword(newPassword);
    await userModel.updatePassword(userId as UUID, newHash);

    // Limpiar flag de cambio obligatorio si existe
    await userModel.update(userId as UUID, {
      mustChangePassword: false,
    });

    await auditService.log(
      'CHANGE_PASSWORD',
      'user',
      userId as UUID,
      {},
      userId as UUID
    );
  }

  /**
   * Primer cambio de contraseña (no requiere contraseña actual)
   * Solo disponible para usuarios con must_change_password = true
   * @param userId - ID del usuario
   * @param newPassword - Nueva contraseña
   */
  async firstPasswordChange(
    userId: string,
    newPassword: string
  ): Promise<void> {
    const user = await userModel.getById(userId as UUID);

    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    if (!user.mustChangePassword) {
      throw new AuthenticationError(
        'Este usuario no requiere cambio de contraseña obligatorio'
      );
    }

    const { hashPassword } = await import('@utils/jwt.utils');
    const newHash = await hashPassword(newPassword);

    await userModel.updatePassword(userId as UUID, newHash);

    // Limpiar flag de cambio obligatorio
    await userModel.update(userId as UUID, {
      mustChangePassword: false,
    });

    await auditService.log(
      'FIRST_PASSWORD_CHANGE',
      'user',
      userId as UUID,
      {},
      userId as UUID
    );
  }

  /**
   * Actualiza la imagen de perfil del usuario
   * @param userId - ID del usuario
   * @param imageUrl - URL de la nueva imagen de perfil
   */
  async updateProfileImage(
    userId: string,
    imageUrl: string | null
  ): Promise<UserDTO> {
    const user = await userModel.getById(userId as UUID);

    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    await userModel.update(userId as UUID, {
      profileImageUrl: imageUrl,
    });

    await auditService.log(
      'UPDATE_PROFILE_IMAGE',
      'user',
      userId as UUID,
      { imageUrl },
      userId as UUID
    );

    return this.getProfile(userId);
  }

  /**
   * Cambia el rol de un usuario
   * @param id - ID del usuario
   * @param role - Nuevo rol
   * @returns Usuario actualizado
   */
  async changeRole(id: string, role: UserRole): Promise<UserEntity> {
    return await userModel.updateRole(id as UUID, role);
  }

  /**
   * Cambia el estado de un usuario (activo/inactivo/pendiente)
   * @param id - ID del usuario
   * @param status - Nuevo estado
   * @returns Usuario actualizado
   */
  async changeStatus(id: string, status: UserStatus): Promise<UserEntity> {
    return await userModel.updateStatus(id as UUID, status);
  }

  async deleteUser(id: string, deleterId?: UUID): Promise<void> {
    const user = await userModel.getById(id as UUID);

    if (!user) throw new NotFoundError('Usuario no encontrado');

    await userModel.softDelete(id as UUID);

    if (deleterId) {
      await auditService.log(
        'DELETE_USER',
        'user',
        id as UUID,
        { email: user.email },
        deleterId
      );
    }
  }

  // --- SPECIFIC LISTS ---

  async getTeachers(): Promise<UserEntity[]> {
    return await userModel.getTeachers();
  }

  async getStudents(): Promise<UserEntity[]> {
    return await userModel.getStudents();
  }
}

export const userService = new UserService();
