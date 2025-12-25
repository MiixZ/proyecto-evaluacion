import { RowDataPacket, Pool } from 'mysql2/promise';
import { getPool } from '@config/database';
import { logger } from '@utils/logger';
import {
  UUID,
  UserRole,
  UserStatus,
  NotFoundError,
  ValidationError,
  PaginatedResponse,
} from '@CustomTypes/common.types';
import { UserEntity, UserDTO } from './user.entity';
import { CreateUserInput, UpdateUserInput } from '@validators/schemas';

/**
 * Modelo User: contiene todas las queries relacionadas con usuarios
 */
export class UserModel {
  private pool: Pool;

  constructor() {
    this.pool = getPool();
  }

  /**
   * Crea un nuevo usuario en la base de datos
   * @throws ValidationError si el email ya existe
   * @throws Error si hay problemas en BD
   */
  async create(input: CreateUserInput, authId: string): Promise<UserEntity> {
    const query = `
      INSERT INTO users (
        id, auth_id, email, first_name, last_name, 
        role, status, phone, bio, profile_image_url, preferred_language,
        created_at, updated_at
      ) VALUES (
        UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW()
      )
    `;

    const values = [
      authId,
      input.email,
      input.firstName,
      input.lastName,
      input.role,
      UserStatus.ACTIVE,
      input.phone || null,
      input.bio || null,
      input.profileImageUrl || null,
      input.preferredLanguage || 'es',
    ];

    try {
      const result = await this.pool.execute(query, values);
      const insertedId = (result[0] as any).insertId;

      logger.info(`Usuario creado: ${input.email} (ID: ${insertedId})`);

      // Retornar el usuario creado
      return this.getById(insertedId as UUID);
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new ValidationError('El email ya existe en el sistema', {
          field: 'email',
          value: input.email,
        });
      }
      throw error;
    }
  }

  /**
   * Obtiene un usuario por ID
   * @throws NotFoundError si no existe
   */
  async getById(id: UUID): Promise<UserEntity> {
    const query = `
      SELECT 
        id, auth_id as authId, email, first_name as firstName,
        last_name as lastName, role, status, phone, bio,
        profile_image_url as profileImageUrl, preferred_language as preferredLanguage,
        created_at as createdAt, updated_at as updatedAt, deleted_at as deletedAt
      FROM users
      WHERE id = ? AND deleted_at IS NULL
      LIMIT 1
    `;

    const [rows] = await this.pool.execute<RowDataPacket[]>(query, [id]);

    if (rows.length === 0) {
      throw new NotFoundError(`Usuario no encontrado: ${id}`);
    }

    return this.mapRowToEntity(rows[0]);
  }

  /**
   * Obtiene un usuario por email
   * @throws NotFoundError si no existe
   */
  async getByEmail(email: string): Promise<UserEntity> {
    const query = `
      SELECT 
        id, auth_id as authId, email, first_name as firstName,
        last_name as lastName, role, status, phone, bio,
        profile_image_url as profileImageUrl, preferred_language as preferredLanguage,
        created_at as createdAt, updated_at as updatedAt, deleted_at as deletedAt
      FROM users
      WHERE email = ? AND deleted_at IS NULL
      LIMIT 1
    `;

    const [rows] = await this.pool.execute<RowDataPacket[]>(query, [
      email.toLowerCase(),
    ]);

    if (rows.length === 0) {
      throw new NotFoundError(`Usuario no encontrado: ${email}`);
    }

    return this.mapRowToEntity(rows[0]);
  }

  /**
   * Obtiene un usuario por auth_id (desde Authgear)
   */
  async getByAuthId(authId: string): Promise<UserEntity | null> {
    const query = `
      SELECT 
        id, auth_id as authId, email, first_name as firstName,
        last_name as lastName, role, status, phone, bio,
        profile_image_url as profileImageUrl, preferred_language as preferredLanguage,
        created_at as createdAt, updated_at as updatedAt, deleted_at as deletedAt
      FROM users
      WHERE auth_id = ? AND deleted_at IS NULL
      LIMIT 1
    `;

    const [rows] = await this.pool.execute<RowDataPacket[]>(query, [authId]);

    if (rows.length === 0) {
      return null;
    }

    return this.mapRowToEntity(rows[0]);
  }

  /**
   * Actualiza un usuario existente
   * @throws NotFoundError si no existe
   */
  async update(id: UUID, input: UpdateUserInput): Promise<UserEntity> {
    // Construir query dinámicamente según qué campos se actualizan
    const updates: string[] = [];
    const values: any[] = [];

    if (input.firstName !== undefined) {
      updates.push('first_name = ?');
      values.push(input.firstName);
    }
    if (input.lastName !== undefined) {
      updates.push('last_name = ?');
      values.push(input.lastName);
    }
    if (input.phone !== undefined) {
      updates.push('phone = ?');
      values.push(input.phone);
    }
    if (input.bio !== undefined) {
      updates.push('bio = ?');
      values.push(input.bio);
    }
    if (input.profileImageUrl !== undefined) {
      updates.push('profile_image_url = ?');
      values.push(input.profileImageUrl);
    }
    if (input.preferredLanguage !== undefined) {
      updates.push('preferred_language = ?');
      values.push(input.preferredLanguage);
    }

    if (updates.length === 0) {
      // Si no hay updates, retornar usuario actual
      return this.getById(id);
    }

    updates.push('updated_at = NOW()');
    values.push(id);

    const query = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = ? AND deleted_at IS NULL
    `;

    const result = await this.pool.execute(query, values);

    if ((result[0] as any).affectedRows === 0) {
      throw new NotFoundError(`Usuario no encontrado: ${id}`);
    }

    logger.info(`Usuario actualizado: ${id}`);

    return this.getById(id);
  }

  /**
   * Soft delete de usuario (marca como eliminado)
   */
  async softDelete(id: UUID): Promise<void> {
    const query = `
      UPDATE users
      SET deleted_at = NOW(), updated_at = NOW()
      WHERE id = ? AND deleted_at IS NULL
    `;

    const result = await this.pool.execute(query, [id]);

    if ((result[0] as any).affectedRows === 0) {
      throw new NotFoundError(`Usuario no encontrado: ${id}`);
    }

    logger.info(`Usuario eliminado (soft): ${id}`);
  }

  /**
   * Cambia el rol de un usuario (admin only)
   */
  async updateRole(id: UUID, newRole: UserRole): Promise<UserEntity> {
    const query = `
      UPDATE users
      SET role = ?, updated_at = NOW()
      WHERE id = ? AND deleted_at IS NULL
    `;

    const result = await this.pool.execute(query, [newRole, id]);

    if ((result[0] as any).affectedRows === 0) {
      throw new NotFoundError(`Usuario no encontrado: ${id}`);
    }

    logger.info(`Rol actualizado para ${id}: ${newRole}`);

    return this.getById(id);
  }

  /**
   * Cambia el estado de un usuario
   */
  async updateStatus(id: UUID, newStatus: UserStatus): Promise<UserEntity> {
    const query = `
      UPDATE users
      SET status = ?, updated_at = NOW()
      WHERE id = ?
    `;

    const result = await this.pool.execute(query, [newStatus, id]);

    if ((result[0] as any).affectedRows === 0) {
      throw new NotFoundError(`Usuario no encontrado: ${id}`);
    }

    logger.info(`Estado actualizado para ${id}: ${newStatus}`);

    return this.getById(id);
  }

  /**
   * Lista todos los usuarios con paginación y filtros
   */
  async list(
    page: number = 1,
    limit: number = 20,
    filters?: {
      role?: UserRole;
      status?: UserStatus;
      search?: string; // Busca en email, firstName, lastName
    }
  ): Promise<PaginatedResponse<UserDTO>> {
    let whereClause = 'deleted_at IS NULL';
    const values: any[] = [];

    if (filters?.role) {
      whereClause += ' AND role = ?';
      values.push(filters.role);
    }

    if (filters?.status) {
      whereClause += ' AND status = ?';
      values.push(filters.status);
    }

    if (filters?.search) {
      whereClause +=
        ' AND (email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      values.push(searchTerm, searchTerm, searchTerm);
    }

    // Total count
    const countQuery = `SELECT COUNT(*) as total FROM users WHERE ${whereClause}`;
    const [countRows] = await this.pool.execute<RowDataPacket[]>(
      countQuery,
      values.slice(0, values.length - (filters?.search ? 3 : 0))
    );

    const total = (countRows[0] as any).total;

    // Paginación
    const offset = (page - 1) * limit;

    const query = `
      SELECT 
        id, auth_id as authId, email, first_name as firstName,
        last_name as lastName, role, status, phone, bio,
        profile_image_url as profileImageUrl, preferred_language as preferredLanguage,
        created_at as createdAt, updated_at as updatedAt, deleted_at as deletedAt
      FROM users
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    values.push(limit, offset);

    const [rows] = await this.pool.execute<RowDataPacket[]>(query, values);

    const items = rows.map((row) => this.mapRowToDTO(row));

    return {
      items,
      total,
      page,
      limit,
      hasMore: offset + limit < total,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Obtiene todos los profesores
   */
  async getTeachers(): Promise<UserDTO[]> {
    const query = `
      SELECT 
        id, auth_id as authId, email, first_name as firstName,
        last_name as lastName, role, status, phone, bio,
        profile_image_url as profileImageUrl, preferred_language as preferredLanguage,
        created_at as createdAt, updated_at as updatedAt, deleted_at as deletedAt
      FROM users
      WHERE role = 'teacher' AND status = 'active' AND deleted_at IS NULL
      ORDER BY first_name, last_name
    `;

    const [rows] = await this.pool.execute<RowDataPacket[]>(query);

    return rows.map((row) => this.mapRowToDTO(row));
  }

  /**
   * Obtiene todos los estudiantes
   */
  async getStudents(): Promise<UserDTO[]> {
    const query = `
      SELECT 
        id, auth_id as authId, email, first_name as firstName,
        last_name as lastName, role, status, phone, bio,
        profile_image_url as profileImageUrl, preferred_language as preferredLanguage,
        created_at as createdAt, updated_at as updatedAt, deleted_at as deletedAt
      FROM users
      WHERE role = 'student' AND status = 'active' AND deleted_at IS NULL
      ORDER BY first_name, last_name
    `;

    const [rows] = await this.pool.execute<RowDataPacket[]>(query);

    return rows.map((row) => this.mapRowToDTO(row));
  }

  /**
   * ============================================================================
   * HELPERS PRIVADOS
   * ============================================================================
   */

  /**
   * Convierte un RowDataPacket en UserEntity
   */
  private mapRowToEntity(row: RowDataPacket): UserEntity {
    return {
      id: row.id,
      authId: row.authId,
      email: row.email,
      firstName: row.firstName,
      lastName: row.lastName,
      role: row.role as UserRole,
      status: row.status as UserStatus,
      phone: row.phone,
      bio: row.bio,
      profileImageUrl: row.profileImageUrl,
      preferredLanguage: row.preferredLanguage,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      deletedAt: row.deletedAt ? new Date(row.deletedAt) : null,
    };
  }

  /**
   * Convierte un RowDataPacket en UserDTO (sin datos sensibles)
   */
  private mapRowToDTO(row: RowDataPacket): UserDTO {
    return {
      id: row.id,
      email: row.email,
      firstName: row.firstName,
      lastName: row.lastName,
      role: row.role,
      status: row.status,
      phone: row.phone,
      bio: row.bio,
      profileImageUrl: row.profileImageUrl,
      preferredLanguage: row.preferredLanguage,
      createdAt: new Date(row.createdAt),
    };
  }
}

/**
 * Instancia singleton del modelo
 */
export const userModel = new UserModel();
