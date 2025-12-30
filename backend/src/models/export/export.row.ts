import { RowDataPacket } from 'mysql2';

export interface ExportRow extends RowDataPacket {
  id: string;
  submission_id: string;
  export_format: string;
  export_path: string;
  purpose: string;
  file_size_bytes: number | null;
  exported_by: string;
  created_at: Date;
}
