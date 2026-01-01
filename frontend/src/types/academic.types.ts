import { type UUID, CourseStatus } from "./common";
import type { User } from "./auth.types";

export interface Degree {
  id: UUID;
  name: string;
  code: string;
  description?: string | null;
  durationYears: number;
  totalCredits: number;
  status: "active" | "inactive";
}

export interface Subject {
  id: UUID;
  degreeId: UUID;
  name: string;
  code: string;
  credits: number;
  semester?: number | null;
  description?: string | null;
  docentGuideUrl?: string | null;
  status: "active" | "inactive";
}

export interface Course {
  id: UUID;
  subjectId: UUID;
  academicYear: string;
  semester: number;
  status: CourseStatus;
  startDate?: string | null;
  endDate?: string | null;
}

export interface Group {
  id: UUID;
  courseId: UUID;
  name: string;
  description?: string | null;
  capacity?: number | null;
  status: "active" | "inactive";
}

export interface GroupMember extends User {
  enrolledAt: string;
}
