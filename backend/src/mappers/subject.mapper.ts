import { BaseMapper } from '@utils/mapper';
import { SubjectEntity, SubjectDTO } from '@models/subject/subject.entity';
import { SubjectRow } from '@models/subject/subject.row';
import { UUID } from '@CustomTypes/common.types';

class SubjectMapper extends BaseMapper<SubjectEntity, SubjectDTO, SubjectRow> {
  toEntity(row: SubjectRow): SubjectEntity {
    return {
      id: row.id as UUID,
      degreeId: row.degree_id as UUID,
      name: row.name,
      code: row.code,
      description: row.description,
      docentGuideUrl: row.docent_guide_url,
      semester: row.semester,
      credits: row.credits,
      status: row.status as 'active' | 'archived',
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  toDTO(entity: SubjectEntity): SubjectDTO {
    return {
      id: entity.id,
      degreeId: entity.degreeId,
      name: entity.name,
      code: entity.code,
      description: entity.description,
      semester: entity.semester,
      credits: entity.credits,
      status: entity.status,
    };
  }
}

export const subjectMapper = new SubjectMapper();
