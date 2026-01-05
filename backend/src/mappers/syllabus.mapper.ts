import { BaseMapper } from '@utils/mapper';
import { SyllabusEntity, SyllabusDTO } from '@models/syllabus/syllabus.entity';
import { SyllabusRow } from '@models/syllabus/syllabus.row';
import { UUID } from '@CustomTypes/common.types';

class SyllabusMapper extends BaseMapper<
  SyllabusEntity,
  SyllabusDTO,
  SyllabusRow
> {
  toEntity(row: SyllabusRow): SyllabusEntity {
    return {
      id: row.id as UUID,
      courseId: row.course_id as UUID,
      title: row.title,
      description: row.description,
      contentType: row.content_type as 'module' | 'topic' | 'lesson',
      orderIndex: row.order_index,
      isPublic: Boolean(row.is_public),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      exercisesCount: row.exercises_count,
    };
  }

  toDTO(entity: SyllabusEntity): SyllabusDTO {
    return {
      id: entity.id,
      courseId: entity.courseId,
      title: entity.title,
      description: entity.description,
      contentType: entity.contentType,
      orderIndex: entity.orderIndex,
      isPublic: entity.isPublic,
      exercisesCount: entity.exercisesCount,
    };
  }
}

export const syllabusMapper = new SyllabusMapper();
