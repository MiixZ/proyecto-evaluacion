import { RowDataPacket } from 'mysql2';

export interface AuditRow extends RowDataPacket {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  changes: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
}
