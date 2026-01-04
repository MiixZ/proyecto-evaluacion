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
    const id = randomUUID();
    const passwordHash = plainPassword
      ? await hashPassword(plainPassword)
      : null;

    const query = `
      INSERT INTO users (
        id, auth_id, email, first_name, last_name, role, status, 
        phone, bio, preferred_language, profile_image_url, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const db = connection || this.getPool();

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
      id: id as any,
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

  async existsByEmail(email: string): Promise<boolean> {
    const query = `SELECT COUNT(*) as count FROM users WHERE email = ? AND deleted_at IS NULL LIMIT 1`;
    const [rows] = await this.getPool().execute<CountResult[]>(query, [
      email.toLowerCase(),
    ]);

    return rows[0].count > 0;
  }

  async update(
    id: string,
    data: Partial<UserEntity>
  ): Promise<UserEntity | null> {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.firstName !== undefined) {
      fields.push('first_name = ?');
      values.push(data.firstName);
    }
    if (data.lastName !== undefined) {
      fields.push('last_name = ?');
      values.push(data.lastName);
    }
    if (data.phone !== undefined) {
      fields.push('phone = ?');
      values.push(data.phone);
    }
    if (data.bio !== undefined) {
      fields.push('bio = ?');
      values.push(data.bio);
    }
    if (data.preferredLanguage !== undefined) {
      fields.push('preferred_language = ?');
      values.push(data.preferredLanguage);
    }

    if (fields.length === 0) return this.getById(id as UUID);

    fields.push('updated_at = NOW()');

    values.push(id);

    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;

    await this.getPool().query(query, values);

    return this.getById(id as UUID);
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
    filters?: { role?: UserRole; status?: UserStatus; search?: string }
  ) {
    let whereClause = 'deleted_at IS NULL';
    const filterValues: any[] = [];

    if (filters?.role) {
      whereClause += ' AND role = ?';
      filterValues.push(filters.role);
    }
    if (filters?.status) {
      whereClause += ' AND status = ?';
      filterValues.push(filters.status);
    }
    if (filters?.search) {
      whereClause +=
        ' AND (email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      filterValues.push(searchTerm, searchTerm, searchTerm);
    }

    const [countRows] = await this.getPool().execute<CountResult[]>(
      `SELECT COUNT(*) as total FROM users WHERE ${whereClause}`,
      filterValues
    );
    const total = countRows[0].count;

    const offset = (page - 1) * limit;
    const query = `SELECT * FROM users WHERE ${whereClause} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    const [rows] = await this.getPool().execute<UserRow[]>(query, filterValues);
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
