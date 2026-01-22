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

export interface PlagiarismPatternRow extends RowDataPacket {
  other_student_id: string;
  first_name: string;
  last_name: string;
  match_count: number;
  avg_similarity: number;
}
