import { BaseMapper } from '@utils/mapper';
import { DegreeEntity, DegreeDTO } from '@models/degree/degree.entity';
import { DegreeRow } from '@models/degree/degree.row';
import { UUID } from '@CustomTypes/common.types';

class DegreeMapper extends BaseMapper<DegreeEntity, DegreeDTO, DegreeRow> {
  toEntity(row: DegreeRow): DegreeEntity {
    return {
      id: row.id as UUID,
      name: row.name,
      code: row.code,
      description: row.description,
      durationYears: row.duration_years,
      totalCredits: row.total_credits,
      status: row.status as 'active' | 'archived',
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  toDTO(entity: DegreeEntity): DegreeDTO {
    return {
      id: entity.id,
      name: entity.name,
      code: entity.code,
      description: entity.description,
      durationYears: entity.durationYears,
      totalCredits: entity.totalCredits,
      status: entity.status,
    };
  }
}

export const degreeMapper = new DegreeMapper();
