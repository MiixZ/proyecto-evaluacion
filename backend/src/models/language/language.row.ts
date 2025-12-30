import { RowDataPacket } from 'mysql2';

export interface LanguageRow extends RowDataPacket {
  code: string;
  name: string;
  version: string | null;
  is_active: number;
  created_at: Date;
}
