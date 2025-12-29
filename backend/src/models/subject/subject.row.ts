import { RowDataPacket } from 'mysql2';

export interface SubjectRow extends RowDataPacket {
  id: string;
  degree_id: string;
  name: string;
  code: string;
  description: string | null;
  docent_guide_url: string | null;
  semester: number | null;
  credits: number | null;
  status: string;
  created_at: Date;
  updated_at: Date;
}
