import { RowDataPacket } from 'mysql2';

export interface PlagiarismRow extends RowDataPacket {
  id: string;
  submission_id: string;
  compared_with_submission_id: string;
  similarity_percent: string;
  plagiarism_type: string;
  tool_used: string | null;
  tool_report_url: string | null;
  is_flagged: number;
  reviewed_at: Date | null;
  reviewed_by: string | null;
  notes: string | null;
  created_at: Date;
}
