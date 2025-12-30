import { getPool } from '@config/database';
import { LanguageEntity } from './language.entity';
import { LanguageRow } from './language.row';
import { languageMapper } from '@mappers/language.mapper';

export class LanguageModel {
  async findAll(onlyActive: boolean = true): Promise<LanguageEntity[]> {
    let query = 'SELECT * FROM languages';
    const params: any[] = [];

    if (onlyActive) {
      query += ' WHERE is_active = ?';
      params.push(1);
    }

    query += ' ORDER BY name ASC';

    const [rows] = await getPool().execute<LanguageRow[]>(query, params);

    return rows.map((row) => languageMapper.toEntity(row));
  }

  async findByCode(code: string): Promise<LanguageEntity | null> {
    const query = 'SELECT * FROM languages WHERE code = ? LIMIT 1';
    const [rows] = await getPool().execute<LanguageRow[]>(query, [code]);

    if (rows.length === 0) return null;

    return languageMapper.toEntity(rows[0]);
  }

  async exists(code: string): Promise<boolean> {
    const query =
      'SELECT 1 FROM languages WHERE code = ? AND is_active = 1 LIMIT 1';
    const [rows] = await getPool().execute<any[]>(query, [code]);

    return rows.length > 0;
  }
}

export const languageModel = new LanguageModel();
