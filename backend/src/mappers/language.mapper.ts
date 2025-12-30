import { BaseMapper } from '@utils/mapper';
import { LanguageEntity, LanguageDTO } from '@models/language/language.entity';
import { LanguageRow } from '@models/language/language.row';

class LanguageMapper extends BaseMapper<
  LanguageEntity,
  LanguageDTO,
  LanguageRow
> {
  toEntity(row: LanguageRow): LanguageEntity {
    return {
      code: row.code,
      name: row.name,
      version: row.version,
      isActive: Boolean(row.is_active),
      createdAt: new Date(row.created_at),
    };
  }

  toDTO(entity: LanguageEntity): LanguageDTO {
    return {
      code: entity.code,
      name: entity.name,
      version: entity.version,
    };
  }
}

export const languageMapper = new LanguageMapper();
