export type UserRole = "admin" | "teacher" | "student";
export type UserStatus = "active" | "inactive" | "suspended";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  lastLogin?: string;
  createdAt: string;
  profileImageUrl?: string;
}

export interface CreateUserPayload {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  password?: string;
}

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
  bio?: string;
  preferredLanguage?: string;
}

export interface UserProfile extends User {
  phone?: string;
  bio?: string;
  profileImageUrl?: string;
  preferredLanguage: string;
  createdAt: string;
  enrollments?: UserEnrollment[];
}

export interface UserEnrollment {
  subjectName: string;
  groupName: string;
  academicYear: string;
  role: string;
}
