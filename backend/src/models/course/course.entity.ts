import { UUID, Timestamps, CourseStatus } from '@CustomTypes/common.types';

export interface CourseEntity extends Timestamps {
  id: UUID;
  subjectId: UUID;
  academicYear: string;
  semester: number;
  status: CourseStatus;
  startDate?: Date | null;
  endDate?: Date | null;
  migratedFrom?: UUID | null;
}

export interface CourseDTO {
  id: UUID;
  subjectId: UUID;
  academicYear: string;
  semester: number;
  status: CourseStatus;
  startDate?: Date | null;
  endDate?: Date | null;
}
