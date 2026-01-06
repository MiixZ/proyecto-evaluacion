import { RankingStudentRow, SubjectTeacherRow } from './ranking.row';
import { RankingStudentDTO, SubjectTeacherDTO } from './ranking.entity';

export const rankingMapper = {
  toStudentDTO(row: RankingStudentRow, rank: number): RankingStudentDTO {
    return {
      studentId: row.student_id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      profileImageUrl: row.profile_image_url,
      stats: {
        exercisesCompleted: row.exercises_completed,
        totalExercises: row.total_exercises,
        avgScore: Math.round(row.avg_score * 10) / 10,
        totalSubmissions: row.total_submissions,
        acceptedSubmissions: row.accepted_submissions,
        perfectScores: row.perfect_scores,
        lastSubmission: row.last_submission
          ? row.last_submission.toISOString()
          : null,
      },
      rank,
    };
  },

  toTeacherDTO(row: SubjectTeacherRow): SubjectTeacherDTO {
    return {
      teacherId: row.teacher_id,
      teacherName: row.teacher_name,
      teacherEmail: row.teacher_email,
      teacherImage: row.teacher_image,
      subjectName: row.subject_name,
      courseCount: row.course_count,
    };
  },
};
