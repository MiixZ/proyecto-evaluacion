export interface StudentProgress {
  studentId: string;
  studentName: string;
  courseId: string;
  academicYear: string;
  subjectName: string;
  exerciseId: string;
  exerciseTitle: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  deadline?: string;
  attempts: number;
  isCompleted: boolean;
  bestScore: number;
  lastAttempt?: string;
}
