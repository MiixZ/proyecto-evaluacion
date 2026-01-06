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
import { NotFoundError } from '@utils/errors';
import { CountResult } from '@models/common/count.row';
import { StudentProgressRow } from '@models/dashboard/dashboard.row';
import { RowDataPacket } from 'mysql2/promise';

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

    if (rows.length === 0) throw new NotFoundError('Grupo con id: ' + id);

    return groupMapper.toEntity(rows[0]);
  }

  async listByCourse(courseId: UUID): Promise<GroupEntity[]> {
    const [rows] = await getPool().execute<GroupRow[]>(
      'SELECT * FROM `groups` WHERE course_id = ? ORDER BY name ASC',
      [courseId]
    );

    return rows.map((row) => groupMapper.toEntity(row));
  }

  async listBySubjectAndYear(
    subjectId: UUID,
    academicYear: string
  ): Promise<GroupEntity[]> {
    const query = `
      SELECT g.* FROM \`groups\` g
      JOIN courses c ON g.course_id = c.id
      WHERE c.subject_id = ? AND c.academic_year = ?
        AND c.status IN ('active', 'planning')
      ORDER BY g.name ASC
    `;

    const [rows] = await getPool().execute<GroupRow[]>(query, [
      subjectId,
      academicYear,
    ]);

    return rows.map((row) => groupMapper.toEntity(row));
  }

  // --- MEMBERSHIP (user_groups) ---

  async addMember(
    userId: UUID,
    groupId: UUID,
    role: string = 'student'
  ): Promise<void> {
    const [existing] = await getPool().execute<any[]>(
      'SELECT status FROM user_groups WHERE user_id = ? AND group_id = ?',
      [userId, groupId]
    );

    if (existing.length === 0) {
      await getPool().execute(
        'INSERT INTO user_groups (user_id, group_id, role, enrolled_at) VALUES (?, ?, ?, NOW())',
        [userId, groupId, role]
      );

      // Si es estudiante, restaurar sus entregas archivadas previas
      if (role === 'student') {
        await getPool().query('CALL restore_student_submissions(?, ?)', [
          userId,
          groupId,
        ]);
      }
    } else if (existing[0].status === 'inactive') {
      // Si el usuario ya existe pero está inactivo, reactivarlo
      await getPool().execute(
        "UPDATE user_groups SET status = 'active' WHERE user_id = ? AND group_id = ?",
        [userId, groupId]
      );

      // Si es estudiante, restaurar sus entregas archivadas previas
      if (role === 'student') {
        await getPool().query('CALL restore_student_submissions(?, ?)', [
          userId,
          groupId,
        ]);
      }
    }
  }

  async countMembers(groupId: UUID, role: string = 'student'): Promise<number> {
    const query = `SELECT COUNT(*) as count FROM user_groups WHERE group_id = ? AND role = ?`;
    const [rows] = await getPool().execute<CountResult[]>(query, [
      groupId,
      role,
    ]);

    return rows[0].count;
  }

  async isUserEnrolledInCourse(userId: UUID, courseId: UUID): Promise<boolean> {
    const query = `
      SELECT 1 
      FROM user_groups ug
      JOIN \`groups\` g ON ug.group_id = g.id
      WHERE ug.user_id = ? AND g.course_id = ? AND ug.status = 'active'
      LIMIT 1
    `;

    const [rows] = await getPool().execute<GroupRow[]>(query, [
      userId,
      courseId,
    ]);

    return rows.length > 0;
  }

  async removeMember(userId: UUID, groupId: UUID): Promise<void> {
    await getPool().query('CALL archive_student_submissions(?, ?, ?)', [
      userId,
      groupId,
      userId,
    ]);

    await getPool().execute(
      'DELETE FROM user_groups WHERE user_id = ? AND group_id = ?',
      [userId, groupId]
    );
  }

  async toggleMemberStatus(userId: UUID, groupId: UUID): Promise<void> {
    const [rows] = await getPool().execute<any[]>(
      'SELECT status FROM user_groups WHERE user_id = ? AND group_id = ?',
      [userId, groupId]
    );

    if (rows.length === 0) {
      throw new Error('El usuario no pertenece al grupo');
    }

    const currentStatus = rows[0].status;
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

    await getPool().execute(
      'UPDATE user_groups SET status = ? WHERE user_id = ? AND group_id = ?',
      [newStatus, userId, groupId]
    );
  }

  async getStudentGroupInCourse(
    courseId: UUID,
    studentId: UUID
  ): Promise<UUID | null> {
    const query = `
      SELECT g.id 
      FROM \`groups\` g
      JOIN user_groups ug ON g.id = ug.group_id
      WHERE g.course_id = ? AND ug.user_id = ? AND ug.role = 'student' AND ug.status = 'active'
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

  async getGroupProgressData(groupId: UUID): Promise<StudentProgressRow[]> {
    const query = `
      SELECT v.* FROM v_student_progress v
      INNER JOIN user_groups ug ON v.student_id = ug.user_id
      WHERE ug.group_id = ? AND ug.role = 'student' AND ug.status = 'active'
      ORDER BY v.last_name, v.first_name, v.exercise_title
    `;

    const [rows] = await getPool().execute<StudentProgressRow[]>(query, [
      groupId,
    ]);

    return rows;
  }

  async isTeacherOfGroup(userId: UUID, groupId: UUID): Promise<boolean> {
    const [rows] = await getPool().execute<RowDataPacket[]>(
      'SELECT 1 FROM user_groups WHERE user_id = ? AND group_id = ? AND role = "teacher"',
      [userId, groupId]
    );

    return rows.length > 0;
  }

  async isStudentInGroup(email: string, groupId: UUID): Promise<boolean> {
    const [rows] = await getPool().execute<RowDataPacket[]>(
      `SELECT 1 FROM users u 
       JOIN user_groups ug ON u.id = ug.user_id 
       WHERE u.email = ? AND ug.group_id = ?`,
      [email, groupId]
    );

    return rows.length > 0;
  }
}

export const groupModel = new GroupModel();
