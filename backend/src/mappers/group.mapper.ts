import { BaseMapper } from '@utils/mapper';
import {
  GroupEntity,
  GroupDTO,
  GroupMemberEntity,
  GroupMemberDTO,
} from '@models/group/group.entity';
import { GroupRow, UserGroupRow } from '@models/group/group.row';
import { UUID } from '@CustomTypes/common.types';

class GroupMapper extends BaseMapper<GroupEntity, GroupDTO, GroupRow> {
  toEntity(row: GroupRow): GroupEntity {
    return {
      id: row.id as UUID,
      courseId: row.course_id as UUID,
      name: row.name,
      description: row.description,
      capacity: row.capacity,
      status: row.status as 'active' | 'archived',
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  toDTO(entity: GroupEntity): GroupDTO {
    return {
      id: entity.id,
      courseId: entity.courseId,
      name: entity.name,
      description: entity.description,
      capacity: entity.capacity,
      status: entity.status,
    };
  }

  toMemberEntity(row: UserGroupRow): GroupMemberEntity {
    return {
      userId: row.user_id as UUID,
      groupId: row.group_id as UUID,
      role: row.role as any,
      enrolledAt: new Date(row.enrolled_at),
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
    };
  }

  toMemberDTO(entity: GroupMemberEntity): GroupMemberDTO {
    return {
      userId: entity.userId,
      role: entity.role,
      enrolledAt: entity.enrolledAt,
      fullName:
        entity.firstName && entity.lastName
          ? `${entity.firstName} ${entity.lastName}`
          : undefined,
      email: entity.email,
    };
  }

  toMemberDTOList(entities: GroupMemberEntity[]): GroupMemberDTO[] {
    return entities.map((e) => this.toMemberDTO(e));
  }
}

export const groupMapper = new GroupMapper();
