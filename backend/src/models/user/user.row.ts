import { RowDataPacket } from 'mysql2';

export interface UserRow extends RowDataPacket {
  id: string;
  auth_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  status: string;
  phone: string | null;
  bio: string | null;
  profile_image_url: string | null;
  preferred_language: string;
  created_at: Date;
  updated_at: Date;
}
