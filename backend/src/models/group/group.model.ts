import { getPool } from '@config/database';
import { v4 as uuidv4 } from 'uuid';
import { GroupEntity, GroupMemberEntity } from './group.entity';
import { GroupRow, UserGroupRow } from './group.row';
import { groupMapper } from '@mappers/group.mapper';
import {
  CreateGroupInput,
  UpdateGroupInput,
} from '@validators/group.validator';
import { UUID } from '@CustomTypes/common.types';
import { NotFoundError, ConflictError } from '@utils/errors';

export class GroupModel {
  async create(input: CreateGroupInput): Promise<GroupEntity> {
    const id = uuidv4();
    const query = `
      INSERT INTO \`groups\` (
        id, course_id, name, description, capacity, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    await getPool().execute(query, [
      id,
      input.courseId,
      input.name,
      input.description || null,
      input.capacity || null,
      input.status,
    ]);

    return this.getById(id as UUID);
  }

  async getById(id: UUID): Promise<GroupEntity> {
    const [rows] = await getPool().execute<GroupRow[]>(
      'SELECT * FROM `groups` WHERE id = ?',
      [id]
    );

    if (rows.length === 0) throw new NotFoundError('Grupo no encontrado');

    return groupMapper.toEntity(rows[0]);
  }

  async listByCourse(courseId: UUID): Promise<GroupEntity[]> {
    const [rows] = await getPool().execute<GroupRow[]>(
      'SELECT * FROM `groups` WHERE course_id = ? ORDER BY name ASC',
      [courseId]
    );

    return rows.map((row) => groupMapper.toEntity(row));
  }

  // --- MEMBERSHIP (user_groups) ---

  async addMember(groupId: UUID, userId: UUID, role: string): Promise<void> {
    const query = `
      INSERT INTO user_groups (user_id, group_id, role, enrolled_at)
      VALUES (?, ?, ?, NOW())
    `;
    try {
      await getPool().execute(query, [userId, groupId, role]);
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new ConflictError('El usuario ya es miembro de este grupo');
      }
      throw error;
    }
  }

  async isUserEnrolledInCourse(userId: UUID, courseId: UUID): Promise<boolean> {
    const query = `
      SELECT 1 
      FROM user_groups ug
      JOIN \`groups\` g ON ug.group_id = g.id
      WHERE ug.user_id = ? AND g.course_id = ?
      LIMIT 1
    `;

    const [rows] = await getPool().execute<GroupRow[]>(query, [
      userId,
      courseId,
    ]);

    return rows.length > 0;
  }

  async removeMember(groupId: UUID, userId: UUID): Promise<void> {
    const query = 'DELETE FROM user_groups WHERE group_id = ? AND user_id = ?';
    const [result] = await getPool().execute<any>(query, [groupId, userId]);
    if (result.affectedRows === 0)
      throw new NotFoundError('Usuario no encontrado en este grupo');
  }

  async getStudentGroupInCourse(
    courseId: UUID,
    studentId: UUID
  ): Promise<UUID | null> {
    const query = `
      SELECT g.id 
      FROM \`groups\` g
      JOIN user_groups ug ON g.id = ug.group_id
      WHERE g.course_id = ? AND ug.user_id = ? AND ug.role = 'student'
      LIMIT 1
    `;

    const [rows] = await getPool().execute<GroupRow[]>(query, [
      courseId,
      studentId,
    ]);

    return rows.length > 0 ? (rows[0].id as UUID) : null;
  }

  async getMembers(groupId: UUID, role?: string): Promise<GroupMemberEntity[]> {
    let query = `
      SELECT ug.*, u.first_name, u.last_name, u.email
      FROM user_groups ug
      JOIN users u ON ug.user_id = u.id
      WHERE ug.group_id = ?
    `;

    const params: any[] = [groupId];

    if (role) {
      query += ' AND ug.role = ?';
      params.push(role);
    }

    query += ' ORDER BY u.last_name, u.first_name';

    const [rows] = await getPool().execute<UserGroupRow[]>(query, params);

    return rows.map((row) => groupMapper.toMemberEntity(row));
  }

  async isMember(groupId: UUID, userId: UUID): Promise<boolean> {
    const [rows] = await getPool().execute<any[]>(
      'SELECT 1 FROM user_groups WHERE group_id = ? AND user_id = ?',
      [groupId, userId]
    );

    return rows.length > 0;
  }

  async update(id: UUID, input: UpdateGroupInput): Promise<GroupEntity> {
    const fields: string[] = [];
    const params: any[] = [];

    if (input.name !== undefined) {
      fields.push('name = ?');
      params.push(input.name);
    }
    if (input.description !== undefined) {
      fields.push('description = ?');
      params.push(input.description);
    }
    if (input.capacity !== undefined) {
      fields.push('capacity = ?');
      params.push(input.capacity);
    }
    if (input.status !== undefined) {
      fields.push('status = ?');
      params.push(input.status);
    }
    if (fields.length === 0) {
      return this.getById(id);
    }

    const query = `
      UPDATE \`groups\`
      SET ${fields.join(', ')}, updated_at = NOW()
      WHERE id = ?
    `;
    params.push(id);

    await getPool().execute(query, params);

    return this.getById(id);
  }
}

export const groupModel = new GroupModel();
