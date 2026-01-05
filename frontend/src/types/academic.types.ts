// frontend/src/types/academic.types.ts

export interface Degree extends Record<string, unknown> {
  id: string;
  name: string;
  code: string;
  description?: string;
  durationYears: number;
  totalCredits: number;
  status: "active" | "archived";
}

export interface Subject extends Record<string, unknown> {
  id: string;
  degreeId: string;
  name: string;
  code: string;
  description?: string;
  semester?: number;
  credits?: number;
  status: "active" | "archived";
  degree?: Degree;
}

export interface Course extends Record<string, unknown> {
  id: string;
  subjectId: string;
  academicYear: string;
  semester: number;
  status: "planning" | "active" | "closed" | "archived";
  startDate?: string;
  endDate?: string;
  subject?: Subject;
}

export interface Syllabus extends Record<string, unknown> {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  contentType: "module" | "topic" | "lesson";
  orderIndex: number;
  isPublic: boolean;
  course?: Course;
}

export type CreateDegreeDTO = Omit<Degree, "id" | "status">;
export type CreateSubjectDTO = Omit<Subject, "id" | "status" | "degree">;
export type CreateCourseDTO = Omit<Course, "id" | "status" | "subject">;
export type CreateSyllabusDTO = Omit<Syllabus, "id" | "course">;
