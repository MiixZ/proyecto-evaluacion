import { BaseMapper } from '@utils/mapper';
import { CourseEntity, CourseDTO } from '@models/course/course.entity';
import { CourseRow } from '@models/course/course.row';
import { UUID, CourseStatus } from '@CustomTypes/common.types';

class CourseMapper extends BaseMapper<CourseEntity, CourseDTO, CourseRow> {
  toEntity(row: CourseRow): CourseEntity {
    return {
      id: row.id as UUID,
      subjectId: row.subject_id as UUID,
      academicYear: row.academic_year,
      semester: row.semester,
      status: row.status as CourseStatus,
      startDate: row.start_date ? new Date(row.start_date) : null,
      endDate: row.end_date ? new Date(row.end_date) : null,
      migratedFrom: row.migrated_from ? (row.migrated_from as UUID) : null,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  toDTO(entity: CourseEntity): CourseDTO {
    return {
      id: entity.id,
      subjectId: entity.subjectId,
      academicYear: entity.academicYear,
      semester: entity.semester,
      status: entity.status,
      startDate: entity.startDate,
      endDate: entity.endDate,
    };
  }
}

export const courseMapper = new CourseMapper();
