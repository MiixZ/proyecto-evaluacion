import { groupModel } from '@models/group/group.model';
import {
  CreateGroupInput,
  EnrollMemberInput,
} from '@validators/group.validator';
import { UUID } from '@CustomTypes/common.types';
import { courseModel } from '@models/course/course.model';
import { userModel } from '@models/user/user.model';
import {
  NotFoundError,
  ConflictError,
  ForbiddenError,
  AppError,
} from '@utils/errors';
import { escapeCsvField, parseStudentCsv } from '@utils/csv.parser';
import { UserStatus, UserRole } from '@CustomTypes/common.types';
import { auditService } from '@services/audit/audit.service';
import crypto from 'crypto';
import { emailService } from '@services/notification/email.service';
import { withTransaction } from '@config/database';
import { UserDTO } from '@models/user/user.entity';
import { userService } from '@services/user/user.service';
import { dashboardModel } from '@models/dashboard/dashboard.model';
import { dashboardMapper } from '@mappers/dashboard.mapper';

export class GroupService {
  async createGroup(input: CreateGroupInput) {
    const courseExists = await courseModel.exists(input.courseId as UUID);
    if (!courseExists)
      throw new NotFoundError('El curso con id: ' + input.courseId);

    return await groupModel.create(input);
  }

  async getGroupById(id: string) {
    return await groupModel.getById(id as UUID);
  }

  async listByCourse(courseId: string) {
    return await groupModel.listByCourse(courseId as UUID);
  }

  async listBySubjectAndYear(subjectId: string, academicYear: string) {
    return await groupModel.listBySubjectAndYear(
      subjectId as UUID,
      academicYear
    );
  }

  async enrollMember(groupId: string, input: EnrollMemberInput) {
    const group = await groupModel.getById(groupId as UUID);

    if (input.role === UserRole.STUDENT && group.capacity) {
      const currentMembers = await groupModel.countMembers(
        groupId as UUID,
        UserRole.STUDENT
      );
      if (currentMembers >= group.capacity) {
        throw new ConflictError(
          `El grupo ha alcanzado su capacidad máxima (${group.capacity} estudiantes).`
        );
      }
    }

    let userId = input.userId;

    if (!userId && input.email) {
      const user = await userModel.getByEmail(input.email);
      userId = user.id as string;
    }

    if (!userId) {
      throw new NotFoundError('Usuario');
    }

    if (input.userId) {
      await userModel.getById(userId as UUID);
    }

    await groupModel.addMember(groupId as UUID, userId as UUID, input.role);
  }

  async removeMember(groupId: string, userId: string) {
    await groupModel.removeMember(groupId as UUID, userId as UUID);
  }

  async getGroupMembers(groupId: string, role?: string) {
    await groupModel.getById(groupId as UUID);

    return await groupModel.getMembers(groupId as UUID, role);
  }

  async importStudentsFromCsv(groupId: string, csvContent: string) {
    const group = await groupModel.getById(groupId as UUID);

    if (group.capacity) {
      const currentMembers = await groupModel.countMembers(
        groupId as UUID,
        UserRole.STUDENT
      );

      const lines = csvContent.trim().split(/\r?\n/);
      const newMembersCount = Math.max(0, lines.length - 1);

      if (currentMembers + newMembersCount > group.capacity) {
        throw new ConflictError(
          `Capacidad excedida: ${group.capacity}, Actual: ${currentMembers}`
        );
      }
    }

    const students = parseStudentCsv(Buffer.from(csvContent));
    const results = {
      total: students.length,
      imported: 0,
      errors: [] as string[],
    };

    for (const studentData of students) {
      try {
        await withTransaction(async (connection) => {
          let userId: UUID;
          let isNewUser = false;
          let tempPassword = '';

          let existingUser;

          try {
            existingUser = await userModel.getByEmail(studentData.email);
          } catch {
            existingUser = null;
          }

          if (existingUser) {
            userId = existingUser.id;
          } else {
            tempPassword = crypto.randomBytes(8).toString('hex');
            const newUser = await userModel.create(
              {
                email: studentData.email,
                firstName: studentData.firstName,
                lastName: studentData.lastName,
                password: tempPassword,
                role: UserRole.STUDENT,
                status: UserStatus.ACTIVE,
                preferredLanguage: 'es',
              },
              tempPassword,
              connection
            );
            userId = newUser.id;
            isNewUser = true;
          }

          const isMember = await groupModel.isMember(groupId as UUID, userId);
          if (!isMember) {
            await groupModel.addMember(userId, groupId as UUID, 'student');
            results.imported++;
          }

          if (isNewUser) {
            await emailService.sendWelcomeEmail(
              studentData.email,
              studentData.firstName,
              tempPassword
            );
          }
        });
      } catch (error: any) {
        results.errors.push(`Error con ${studentData.email}: ${error.message}`);
      }
    }
    return results;
  }

  async generateGroupExport(
    groupId: string,
    requesterId: string,
    role: UserRole
  ): Promise<string> {
    const group = await groupModel.getById(groupId as UUID);

    if (role === UserRole.STUDENT) {
      throw new ForbiddenError(
        'Solo profesores pueden exportar datos del grupo'
      );
    }

    if (role === UserRole.TEACHER) {
      const isMember = await groupModel.isMember(group.id, requesterId as UUID);
      if (!isMember) throw new ForbiddenError('No perteneces a este grupo');
    }

    const progressData = await groupModel.getGroupProgressData(group.id);

    let csv =
      'Apellido,Nombre,Asignatura,Ejercicio,Estado,Intentos,Mejor Puntuacion,Ultimo Intento\n';

    for (const row of progressData) {
      const lastAttemptStr = row.last_attempt
        ? row.last_attempt.toISOString().split('T')[0]
        : 'N/A';

      const status = row.is_completed ? 'Completado' : 'Pendiente';

      const fields = [
        `${row.last_name}, ${row.first_name}`,
        row.subject_name,
        row.exercise_title,
        status,
        row.attempts,
        row.best_score,
        lastAttemptStr,
      ];

      csv += fields.map(escapeCsvField).join(',') + '\n';
    }

    await auditService.log(
      'EXPORT_GROUP_DATA',
      'group',
      group.id,
      { format: 'csv', rows: progressData.length },
      requesterId as UUID
    );

    return csv;
  }

  private async checkGroupAccess(
    userId: UUID,
    role: UserRole,
    groupId: UUID
  ): Promise<void> {
    if (role === UserRole.TEACHER) {
      const isOwner = await groupModel.isTeacherOfGroup(userId, groupId);
      if (!isOwner) {
        throw new AppError(
          'FORBIDDEN',
          403,
          'No tienes permiso sobre este grupo'
        );
      }
    }
  }

  async getGroupStudents(userId: UUID, role: UserRole, groupId: UUID) {
    await this.checkGroupAccess(userId, role, groupId);

    const students = await dashboardModel.getStudentsByGroup(groupId);

    return students.map(dashboardMapper.toGroupStudentDTO);
  }

  async addStudent(
    userId: UUID,
    role: UserRole,
    groupId: UUID,
    data: { email: string; firstName: string; lastName: string }
  ) {
    await this.checkGroupAccess(userId, role, groupId);

    const user = await userService.findOrCreateStudent(
      data.email,
      data.firstName,
      data.lastName
    );

    await groupModel.addMember(user.id as UUID, groupId);

    return user;
  }

  async importStudentsCsv(
    userId: UUID,
    role: UserRole,
    groupId: UUID,
    fileBuffer: Buffer
  ) {
    await this.checkGroupAccess(userId, role, groupId);

    const students = parseStudentCsv(fileBuffer);
    const results = { added: 0, errors: 0 };

    for (const student of students) {
      try {
        if (!student.email) continue;

        const user = await userService.findOrCreateStudent(
          student.email,
          student.firstName || 'Estudiante',
          student.lastName || ''
        );

        await groupModel.addMember(user.id as UUID, groupId);
        results.added++;
      } catch (error) {
        results.errors++;
        console.error(`Error importando estudiante ${student.email}:`, error);
      }
    }

    return results;
  }

  async removeStudent(
    userId: UUID,
    role: UserRole,
    groupId: UUID,
    studentId: UUID
  ) {
    await this.checkGroupAccess(userId, role, groupId);
    await groupModel.removeMember(studentId, groupId);
  }

  async updateStudent(
    userId: UUID,
    role: UserRole,
    groupId: UUID,
    studentId: UUID,
    data: Partial<UserDTO>
  ) {
    await this.checkGroupAccess(userId, role, groupId);

    try {
      await userModel.update(studentId, data);
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new AppError(
          'VALIDATION_ERROR',
          400,
          'El email ya está en uso por otro usuario'
        );
      }
      throw error;
    }
  }

  async toggleStudentStatus(
    userId: UUID,
    role: UserRole,
    groupId: UUID,
    studentId: UUID
  ) {
    await this.checkGroupAccess(userId, role, groupId);

    const student = await userModel.getById(studentId);
    if (!student)
      throw new AppError('NOT_FOUND', 404, 'Estudiante no encontrado');

    await groupModel.toggleMemberStatus(studentId, groupId);

    return 'Status actualizado';
  }
}

export const groupService = new GroupService();
