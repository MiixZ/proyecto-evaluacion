import { groupModel } from '@models/group/group.model';
import {
  CreateGroupInput,
  EnrollMemberInput,
} from '@validators/group.validator';
import { UUID } from '@CustomTypes/common.types';
import { courseModel } from '@models/course/course.model';
import { userModel } from '@models/user/user.model';
import { NotFoundError } from '@utils/errors';
import { parseStudentCsv } from '@utils/csv.parser';
import { UserStatus, UserRole } from '@CustomTypes/common.types';

export class GroupService {
  async createGroup(input: CreateGroupInput) {
    const courseExists = await courseModel.exists(input.courseId as UUID);
    if (!courseExists) throw new NotFoundError('El curso no existe');

    return await groupModel.create(input);
  }

  async getGroupById(id: string) {
    return await groupModel.getById(id as UUID);
  }

  async listByCourse(courseId: string) {
    return await groupModel.listByCourse(courseId as UUID);
  }

  async enrollMember(groupId: string, input: EnrollMemberInput) {
    await groupModel.getById(groupId as UUID);

    let userId = input.userId;

    if (!userId && input.email) {
      const user = await userModel.getByEmail(input.email);
      userId = user.id as string;
    }

    if (!userId) {
      throw new NotFoundError('Usuario no especificado o no encontrado');
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
    await groupModel.getById(groupId as UUID);

    const students = parseStudentCsv(csvContent);
    const results = {
      total: students.length,
      imported: 0,
      errors: [] as string[],
    };

    for (const studentData of students) {
      try {
        let userId: UUID;

        try {
          const existingUser = await userModel.getByEmail(studentData.email);
          userId = existingUser.id;
        } catch (e) {
          const tempPassword = `csv_import_${studentData.email}`;

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
            tempPassword
          );

          userId = newUser.id;
        }

        const isMember = await groupModel.isMember(groupId as UUID, userId);

        if (!isMember) {
          await groupModel.addMember(groupId as UUID, userId, 'student');
          results.imported++;
        }
      } catch (error: any) {
        results.errors.push(`Error con ${studentData.email}: ${error.message}`);
      }
    }

    return results;
  }
}

export const groupService = new GroupService();
