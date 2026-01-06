export type UserRole = "admin" | "teacher" | "student";
export type UserStatus = "active" | "inactive" | "suspended";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  profileImageUrl?: string;
  mustChangePassword: boolean;
  enrollments?: Enrollment[];
}

export interface Enrollment {
  subjectName: string;
  groupName: string;
  academicYear: string;
  role: string;
}

export interface CreateUserPayload {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  password?: string;
}

export interface CreateUserResponse extends User {
  temporaryPassword?: string;
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
  mustChangePassword: boolean;
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

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface FirstPasswordChangePayload {
  newPassword: string;
  confirmPassword: string;
}
