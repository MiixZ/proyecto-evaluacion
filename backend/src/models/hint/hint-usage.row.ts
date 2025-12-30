import { RowDataPacket } from 'mysql2';

export interface HintUsageRow extends RowDataPacket {
  id: string;
  submission_id: string;
  test_case_id: string;
  hint_text: string;
  penalty_applied: number;
  used_at: Date;
}
