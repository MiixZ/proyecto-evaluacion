import { groupModel } from '@models/group/group.model';
import {
  CreateGroupInput,
  EnrollMemberInput,
} from '@validators/group.validator';
import { UUID } from '@CustomTypes/common.types';
import { courseModel } from '@models/course/course.model';
import { userModel } from '@models/user/user.model';
import { NotFoundError, ConflictError, ForbiddenError } from '@utils/errors';
import { parseStudentCsv, escapeCsvField } from '@utils/csv.parser';
import { UserStatus, UserRole } from '@CustomTypes/common.types';
import { auditService } from '@services/audit/audit.service';
import crypto from 'crypto';
import { emailService } from '@services/notification/email.service';
import { withTransaction } from '@config/database';

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

    const students = parseStudentCsv(csvContent);
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
            await groupModel.addMember(
              groupId as UUID,
              userId,
              'student',
              connection
            );
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
}

export const groupService = new GroupService();
