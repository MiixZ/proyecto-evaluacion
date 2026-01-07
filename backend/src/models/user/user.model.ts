import { Pool, ResultSetHeader } from 'mysql2/promise';
import { randomUUID } from 'crypto';
import { getPool } from '@config/database';
import { logger } from '@utils/logger';
import { PoolConnection } from 'mysql2/promise';
import { UUID, UserRole, UserStatus } from '@CustomTypes/common.types';
import { UserEntity } from './user.entity';
import { CreateUserInput } from '@validators/user.validator';
import { NotFoundError } from '@utils/errors';
import { userMapper } from '@mappers/user.mapper';
import { EnrollmentRow, UserRow } from './user.row';
import { CountResult } from '@models/common/count.row';
import { hashPassword } from '@utils/jwt.utils';

export class UserModel {
  private pool: Pool | null = null;

  private getPool(): Pool {
    if (!this.pool) {
      this.pool = getPool();
    }
    return this.pool;
  }

  async create(
    input: CreateUserInput,
    plainPassword?: string,
    connection?: PoolConnection
  ): Promise<UserEntity> {
    // Buscar usuario por email, aunque esté borrado lógicamente
    const db = connection || this.getPool();
    const [rows] = await db.execute<UserRow[]>(
      'SELECT * FROM users WHERE email = ? LIMIT 1',
      [input.email]
    );

    const passwordHash = plainPassword
      ? await hashPassword(plainPassword)
      : null;

    if (rows.length > 0) {
      // Si está borrado lógicamente, lo reactivamos y actualizamos datos
      const user = rows[0];
      await db.execute(
        `UPDATE users SET 
          auth_id = ?, first_name = ?, last_name = ?, role = ?, status = ?, phone = ?, bio = ?, preferred_language = ?, profile_image_url = ?, deleted_at = NULL, must_change_password = 1, updated_at = NOW()
        WHERE id = ?`,
        [
          passwordHash || `auth_${user.id}`,
          input.firstName,
          input.lastName,
          input.role || UserRole.STUDENT,
          input.status || UserStatus.ACTIVE,
          input.phone || null,
          input.bio || null,
          input.preferredLanguage || 'es',
          input.profileImageUrl || null,
          user.id,
        ]
      );
      // Devolver el usuario reactivado
      return {
        id: user.id as UUID,
        authId: passwordHash || `auth_${user.id}`,
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        role: input.role || UserRole.STUDENT,
        status: input.status || UserStatus.ACTIVE,
        phone: input.phone,
        bio: input.bio,
        profileImageUrl: input.profileImageUrl || null,
        preferredLanguage: input.preferredLanguage || 'es',
        createdAt: user.created_at,
        updatedAt: new Date(),
        mustChangePassword: true,
      };
    }

    // Si no existe, crear usuario nuevo
    const id = randomUUID();
    const query = `
      INSERT INTO users (
        id, auth_id, email, first_name, last_name, role, status, 
        phone, bio, preferred_language, profile_image_url, created_at, updated_at, must_change_password
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), 1)
    `;

    await db.execute(query, [
      id,
      passwordHash || `auth_${id}`,
      input.email,
      input.firstName,
      input.lastName,
      input.role || UserRole.STUDENT,
      input.status || UserStatus.ACTIVE,
      input.phone || null,
      input.bio || null,
      input.preferredLanguage || 'es',
      input.profileImageUrl || null,
    ]);

    return {
      id: id as UUID,
      authId: passwordHash || `auth_${id}`,
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      role: input.role || UserRole.STUDENT,
      status: input.status || UserStatus.ACTIVE,
      phone: input.phone,
      bio: input.bio,
      profileImageUrl: input.profileImageUrl || null,
      preferredLanguage: input.preferredLanguage || 'es',
      createdAt: new Date(),
      updatedAt: new Date(),
      mustChangePassword: true,
    };
  }

  async getById(id: UUID): Promise<UserEntity> {
    const query = `SELECT * FROM users WHERE id = ? AND deleted_at IS NULL LIMIT 1`;
    const [rows] = await this.getPool().execute<UserRow[]>(query, [id]);

    if (rows.length === 0) throw new NotFoundError(`Usuario con id: ${id}`);

    return userMapper.toEntity(rows[0]);
  }

  async getEnrollments(userId: string): Promise<EnrollmentRow[]> {
    const query = `
      SELECT 
        s.name AS subject_name,
        g.name AS group_name,
        c.academic_year,
        ug.role
      FROM user_groups ug
      INNER JOIN \`groups\` g ON ug.group_id = g.id
      INNER JOIN courses c ON g.course_id = c.id
      INNER JOIN subjects s ON c.subject_id = s.id
      WHERE ug.user_id = ? 
        AND ug.status = 'active'
        AND c.status IN ('active', 'planning')
        AND s.status = 'active'
      ORDER BY c.academic_year DESC, s.name ASC
    `;

    const [rows] = await this.getPool().query<EnrollmentRow[]>(query, [userId]);

    return rows;
  }

  async getByEmail(email: string): Promise<UserEntity> {
    const query = `SELECT * FROM users WHERE email = ? AND deleted_at IS NULL LIMIT 1`;
    const [rows] = await this.getPool().execute<UserRow[]>(query, [
      email.toLowerCase(),
    ]);

    if (rows.length === 0)
      throw new NotFoundError(`Usuario con email: ${email}`);

    return userMapper.toEntity(rows[0]);
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const [rows] = await getPool().execute<UserRow[]>(
      'SELECT * FROM users WHERE email = ? AND deleted_at IS NULL',
      [email]
    );

    if (rows.length === 0) {
      return null;
    }

    return userMapper.toEntity(rows[0]);
  }

  async existsByEmail(email: string): Promise<boolean> {
    const query = `SELECT COUNT(*) as count FROM users WHERE email = ? AND deleted_at IS NULL LIMIT 1`;
    const [rows] = await this.getPool().execute<CountResult[]>(query, [
      email.toLowerCase(),
    ]);

    return rows[0].count > 0;
  }

  async update(id: UUID, data: Partial<UserEntity>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.firstName) {
      fields.push('first_name = ?');
      values.push(data.firstName);
    }
    if (data.lastName) {
      fields.push('last_name = ?');
      values.push(data.lastName);
    }
    if (data.email) {
      fields.push('email = ?');
      values.push(data.email);
    }
    if (data.status) {
      fields.push('status = ?');
      values.push(data.status);
    }
    if (data.phone !== undefined) {
      fields.push('phone = ?');
      values.push(data.phone);
    }
    if (data.bio !== undefined) {
      fields.push('bio = ?');
      values.push(data.bio);
    }
    if (data.preferredLanguage) {
      fields.push('preferred_language = ?');
      values.push(data.preferredLanguage);
    }
    if (data.profileImageUrl !== undefined) {
      fields.push('profile_image_url = ?');
      values.push(data.profileImageUrl);
    }
    if (data.mustChangePassword !== undefined) {
      fields.push('must_change_password = ?');
      values.push(data.mustChangePassword ? 1 : 0);
    }

    if (fields.length === 0) return;

    values.push(id);
    const query = `UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`;

    await getPool().execute(query, values);
  }

  async updatePassword(id: UUID, newPasswordHash: string): Promise<void> {
    const query = `UPDATE users SET auth_id = ?, updated_at = NOW() WHERE id = ? AND deleted_at IS NULL`;
    const [result] = await this.getPool().execute<ResultSetHeader>(query, [
      newPasswordHash,
      id,
    ]);

    if (result.affectedRows === 0) {
      throw new NotFoundError(`Usuario con id: ${id}`);
    }

    logger.info(`Contraseña actualizada para usuario: ${id}`);
  }

  async getPasswordHash(id: UUID): Promise<string> {
    const query = `SELECT auth_id FROM users WHERE id = ? AND deleted_at IS NULL LIMIT 1`;
    const [rows] = await this.getPool().execute<UserRow[]>(query, [id]);

    if (rows.length === 0) {
      throw new NotFoundError(`Usuario con id: ${id}`);
    }

    return rows[0].auth_id;
  }

  async softDelete(id: UUID): Promise<void> {
    const query = `UPDATE users SET deleted_at = NOW(), updated_at = NOW() WHERE id = ? AND deleted_at IS NULL`;
    const [result] = await this.getPool().execute<ResultSetHeader>(query, [id]);

    if (result.affectedRows === 0) {
      throw new NotFoundError(`Usuario con id: ${id}`);
    }

    logger.info(`Usuario eliminado (soft): ${id}`);
  }

  async updateRole(id: UUID, newRole: UserRole): Promise<UserEntity> {
    const query = `UPDATE users SET role = ?, updated_at = NOW() WHERE id = ? AND deleted_at IS NULL`;
    const [result] = await this.getPool().execute<ResultSetHeader>(query, [
      newRole,
      id,
    ]);

    if (result.affectedRows === 0)
      throw new NotFoundError(`Usuario con id: ${id}`);

    logger.info(`Rol actualizado para ${id}: ${newRole}`);

    return this.getById(id);
  }

  async updateStatus(id: UUID, newStatus: UserStatus): Promise<UserEntity> {
    const query = `UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?`;
    const [result] = await this.getPool().execute<ResultSetHeader>(query, [
      newStatus,
      id,
    ]);

    if (result.affectedRows === 0)
      throw new NotFoundError(`Usuario con id: ${id}`);

    return this.getById(id);
  }

  async list(
    page: number,
    limit: number,
    filters?: {
      role?: string;
      status?: string;
      search?: string;
      groupId?: string;
    }
  ) {
    let whereClause = 'u.deleted_at IS NULL';
    const params: any[] = [];
    let joinClause = '';

    if (filters?.groupId) {
      joinClause = 'JOIN user_groups ug ON u.id = ug.user_id';
      whereClause += ' AND ug.group_id = ?';
      params.push(filters.groupId);
    }

    if (filters?.role && filters.role !== 'all') {
      whereClause += ' AND u.role = ?';
      params.push(filters.role);
    }

    if (filters?.status && filters.status !== 'all') {
      whereClause += ' AND u.status = ?';
      params.push(filters.status);
    }

    if (filters?.search) {
      whereClause +=
        ' AND (u.email LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)';

      const term = `%${filters.search}%`;
      params.push(term, term, term);
    }

    const countQuery = `SELECT COUNT(DISTINCT u.id) as count FROM users u ${joinClause} WHERE ${whereClause}`;
    const [countRows] = await this.getPool().query<CountResult[]>(
      countQuery,
      params
    );
    const total = countRows[0]?.count || 0;

    const offset = (page - 1) * limit;
    const query = `
      SELECT DISTINCT u.id, u.auth_id, u.email, u.first_name, u.last_name, 
      u.role, u.status, u.phone, u.bio, u.preferred_language, 
      u.profile_image_url, u.created_at, u.updated_at, u.deleted_at
      FROM users u 
      ${joinClause} 
      WHERE ${whereClause} 
      ORDER BY u.created_at DESC 
      LIMIT ? OFFSET ?
    `;

    const [rows] = await this.getPool().query<UserRow[]>(query, [
      ...params,
      limit,
      offset,
    ]);
    const items = rows.map((row) => userMapper.toEntity(row));

    return {
      items,
      total,
      page,
      limit,
      hasMore: offset + limit < total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async assignToGroup(
    userId: UUID,
    groupId: UUID,
    role: string
  ): Promise<void> {
    const query = `
      INSERT INTO user_groups (user_id, group_id, role, enrolled_at)
      VALUES (?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE role = VALUES(role)
    `;

    await this.getPool().execute(query, [userId, groupId, role]);
  }

  async getTeachers(): Promise<UserEntity[]> {
    const query = `SELECT * FROM users WHERE role = ? AND status = ? AND deleted_at IS NULL ORDER BY first_name, last_name`;
    const [rows] = await this.getPool().execute<UserRow[]>(query, [
      UserRole.TEACHER,
      UserStatus.ACTIVE,
    ]);

    return rows.map((row) => userMapper.toEntity(row));
  }

  async getStudents(): Promise<UserEntity[]> {
    const query = `SELECT * FROM users WHERE role = ? AND status = ? AND deleted_at IS NULL ORDER BY first_name, last_name`;
    const [rows] = await this.getPool().execute<UserRow[]>(query, [
      UserRole.STUDENT,
      UserStatus.ACTIVE,
    ]);

    return rows.map((row) => userMapper.toEntity(row));
  }
}

export const userModel = new UserModel();
