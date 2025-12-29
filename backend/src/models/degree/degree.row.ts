import { RowDataPacket } from 'mysql2';

export interface DegreeRow extends RowDataPacket {
  id: string;
  name: string;
  code: string;
  description: string | null;
  duration_years: number;
  total_credits: number;
  status: string;
  created_at: Date;
  updated_at: Date;
}
