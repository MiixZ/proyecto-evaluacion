import { RowDataPacket } from 'mysql2';

export interface GroupRow extends RowDataPacket {
  id: string;
  course_id: string;
  name: string;
  description: string | null;
  capacity: number | null;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserGroupRow extends RowDataPacket {
  user_id: string;
  group_id: string;
  role: string;
  enrolled_at: Date;
  first_name?: string;
  last_name?: string;
  email?: string;
}
