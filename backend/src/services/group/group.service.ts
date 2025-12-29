import { groupModel } from '@models/group/group.model';
import {
  CreateGroupInput,
  EnrollMemberInput,
} from '@validators/group.validator';
import { UUID } from '@CustomTypes/common.types';
import { courseModel } from '@models/course/course.model';
import { userModel } from '@models/user/user.model';
import { NotFoundError } from '@utils/errors';

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
}

export const groupService = new GroupService();
