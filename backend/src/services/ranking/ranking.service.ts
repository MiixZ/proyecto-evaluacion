import { UUID, UserRole } from '@CustomTypes/common.types';
import { rankingModel } from '@models/ranking/ranking.model';
import { rankingMapper } from '@mappers/ranking.mapper';
import {
  RankingResponseDTO,
  RankingFilterDTO,
} from '@models/ranking/ranking.entity';

export class RankingService {
  async getRanking(
    userId: UUID,
    userRole: UserRole,
    subjectId?: UUID,
    groupId?: UUID
  ): Promise<RankingResponseDTO> {
    let effectiveGroupId = groupId;

    if (userRole === 'student') {
      const filterInfo = await rankingModel.getFilterOptions(userId);

      if (subjectId) {
        // If subject is selected, ensure we use a group FROM THIS SUBJECT
        const groupsInSubject = filterInfo.filter(
          (f) => f.subject_id === subjectId
        );
        const groupIdsInSubject = groupsInSubject.map((f) => f.group_id);

        if (groupId && groupIdsInSubject.includes(groupId)) {
          effectiveGroupId = groupId;
        } else if (groupIdsInSubject.length > 0) {
          // Default to first group of THIS subject
          effectiveGroupId = groupIdsInSubject[0] as UUID;
        }
      } else {
        // No subject selected, fallback to any group
        const userGroupIds = filterInfo.map((f) => f.group_id);

        if (!groupId || !userGroupIds.includes(groupId)) {
          effectiveGroupId = userGroupIds[0] as UUID;
        }
      }
    } else if (userRole === 'teacher') {
      const teacherGroups = await rankingModel.getFilterOptions(userId);
      const teacherGroupIds = teacherGroups.map((f) => f.group_id);

      if (groupId && !teacherGroupIds.includes(groupId)) {
        effectiveGroupId = teacherGroupIds[0] as UUID;
      }
    }

    const students = await rankingModel.getRanking(subjectId, effectiveGroupId);

    const rankedStudents = students.map((student, index) =>
      rankingMapper.toStudentDTO(student, index + 1)
    );

    let teacher = null;
    if (subjectId) {
      const teacherRow = await rankingModel.getSubjectTeacher(subjectId);
      if (teacherRow) {
        teacher = rankingMapper.toTeacherDTO(teacherRow);
      }
    }

    const filters = await this.getFilterOptions(userId, userRole);

    return {
      students: rankedStudents,
      teacher,
      filters,
    };
  }

  private async getFilterOptions(
    userId: UUID,
    userRole: UserRole
  ): Promise<RankingFilterDTO> {
    if (userRole === 'admin') {
      const subjects = await rankingModel.getAllSubjects();
      return {
        subjects: subjects.map((s) => ({
          id: s.subject_id as UUID,
          name: s.subject_name,
        })),
        groups: [],
      };
    } else {
      const filterInfo = await rankingModel.getFilterOptions(userId);

      const subjectsMap = new Map<string, string>();
      const groupsMap = new Map<
        string,
        { id: string; name: string; courseId: string; academicYear: string }
      >();

      filterInfo.forEach((info) => {
        subjectsMap.set(info.subject_id, info.subject_name);
        groupsMap.set(info.group_id, {
          id: info.group_id,
          name: info.group_name,
          courseId: info.course_id,
          academicYear: info.academic_year,
        });
      });

      return {
        subjects: Array.from(subjectsMap.entries()).map(([id, name]) => ({
          id: id as UUID,
          name,
        })),
        groups: Array.from(groupsMap.values()).map((g) => ({
          ...g,
          id: g.id as UUID,
          courseId: g.courseId as UUID,
        })),
      };
    }
  }

  async getSubjectGroups(subjectId: UUID): Promise<any[]> {
    const groups = await rankingModel.getSubjectGroups(subjectId);
    return groups.map((g) => ({
      id: g.group_id,
      name: g.group_name,
      academicYear: g.academic_year,
    }));
  }
}

export const rankingService = new RankingService();
