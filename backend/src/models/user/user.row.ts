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
  must_change_password: boolean;
  preferred_language: string;
  created_at: Date;
  updated_at: Date;
}

export interface EnrollmentRow extends RowDataPacket {
  subject_name: string;
  group_name: string;
  academic_year: string;
  role: string;
}
