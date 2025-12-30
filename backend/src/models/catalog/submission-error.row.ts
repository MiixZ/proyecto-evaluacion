import { RowDataPacket } from 'mysql2';

export interface SubmissionErrorRow extends RowDataPacket {
  id: string;
  error_type: string;
  error_message: string;
  error_details: any;
  is_active: number;
  created_at: Date;
}
