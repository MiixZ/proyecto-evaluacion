export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
  bio?: string;
  preferredLanguage?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
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
