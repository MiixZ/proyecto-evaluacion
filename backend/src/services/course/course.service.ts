import { courseModel } from '@models/course/course.model';
import {
  CreateCourseInput,
  UpdateCourseInput,
} from '@validators/course.validator';
import { UUID, CourseStatus } from '@CustomTypes/common.types';
import { subjectModel } from '@models/subject/subject.model';
import { NotFoundError, BadRequestError } from '@utils/errors';
import { getPool } from '@config/database';
import { v4 as uuidv4 } from 'uuid';

export class CourseService {
  async createCourse(input: CreateCourseInput) {
    const subjectExists = await subjectModel.exists(input.subjectId as UUID);

    if (!subjectExists) {
      throw new NotFoundError(
        'Asignatura especificada con id: ' + input.subjectId
      );
    }

    return await courseModel.create(input);
  }

  async getCourseById(id: string) {
    return await courseModel.getById(id as UUID);
  }

  async updateCourse(id: string, input: UpdateCourseInput) {
    await courseModel.getById(id as UUID);

    return await courseModel.update(id as UUID, input);
  }

  async listCourses(
    page: number,
    limit: number,
    filters: { status?: CourseStatus; academicYear?: string }
  ) {
    return await courseModel.list(page, limit, filters);
  }

  async getMigrationPreview(sourceCourseId: string) {
    return await courseModel.getMigrationPreview(sourceCourseId as UUID);
  }

  async getCourseHistory(subjectId: string) {
    return await courseModel.getCourseHistory(subjectId as UUID);
  }

  async migrateContent(
    sourceCourseId: string,
    targetCourseId: string,
    options: {
      includeSyllabi: boolean;
      includeExercises: boolean;
      selectedSyllabiIds?: string[];
    }
  ) {
    const sourceCourse = await courseModel.getById(sourceCourseId as UUID);
    const targetCourse = await courseModel.getById(targetCourseId as UUID);

    if (sourceCourse.subjectId !== targetCourse.subjectId) {
      throw new BadRequestError(
        'Los cursos deben pertenecer a la misma asignatura'
      );
    }

    if (sourceCourseId === targetCourseId) {
      throw new BadRequestError('No se puede migrar un curso a sí mismo');
    }

    const connection = await getPool().getConnection();
    const migratedData = {
      syllabi: [] as any[],
      exercises: [] as any[],
    };

    try {
      await connection.beginTransaction();

      if (options.includeSyllabi) {
        let syllabiQuery = 'SELECT * FROM syllabi WHERE course_id = ?';
        const syllabiParams: any[] = [sourceCourseId];

        if (
          options.selectedSyllabiIds &&
          options.selectedSyllabiIds.length > 0
        ) {
          const placeholders = options.selectedSyllabiIds
            .map(() => '?')
            .join(',');
          syllabiQuery += ` AND id IN (${placeholders})`;
          syllabiParams.push(...options.selectedSyllabiIds);
        }

        const [syllabi] = await connection.execute<any[]>(
          syllabiQuery,
          syllabiParams
        );

        const syllabusIdMap: { [oldId: string]: string } = {};

        for (const syllabus of syllabi) {
          const newSyllabusId = uuidv4();
          syllabusIdMap[syllabus.id] = newSyllabusId;

          await connection.execute(
            `INSERT INTO syllabi (id, course_id, title, description, content_type, order_index, is_public, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [
              newSyllabusId,
              targetCourseId,
              syllabus.title,
              syllabus.description || null,
              syllabus.content_type || null,
              syllabus.order_index || null,
              syllabus.is_public !== undefined ? syllabus.is_public : true,
            ]
          );

          migratedData.syllabi.push({
            originalId: syllabus.id,
            newId: newSyllabusId,
            title: syllabus.title,
          });
        }

        // Migrar syllabus_common_files por cada syllabus
        for (const syllabus of syllabi) {
          const newSyllabusId = syllabusIdMap[syllabus.id];
          const [syllabusFiles] = await connection.execute<any[]>(
            'SELECT * FROM syllabus_common_files WHERE syllabus_id = ?',
            [syllabus.id]
          );

          for (const file of syllabusFiles) {
            const newFileId = uuidv4();
            await connection.execute(
              `INSERT INTO syllabus_common_files (id, syllabus_id, filename, content, file_type, description, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
              [
                newFileId,
                newSyllabusId,
                file.filename,
                file.content,
                file.file_type || 'source',
                file.description || null,
              ]
            );
          }
        }

        if (options.includeExercises && Object.keys(syllabusIdMap).length > 0) {
          const syllabusIds = Object.keys(syllabusIdMap);
          const placeholders = syllabusIds.map(() => '?').join(',');

          const [exercises] = await connection.execute<any[]>(
            `SELECT * FROM exercises WHERE syllabus_id IN (${placeholders})`,
            syllabusIds
          );

          for (const exercise of exercises) {
            const newExerciseId = uuidv4();
            const newSyllabusId = syllabusIdMap[exercise.syllabus_id];

            await connection.execute(
              `INSERT INTO exercises (id, syllabus_id, title, description, difficulty, language, 
               template_code, is_published, created_by, order_index, points, efficiency_order, 
               deadline, late_deadline, late_submission_penalty_percent, max_attempts, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
              [
                newExerciseId,
                newSyllabusId,
                exercise.title,
                exercise.description || null,
                exercise.difficulty,
                exercise.language,
                exercise.template_code || null,
                false,
                exercise.created_by,
                exercise.order_index || null,
                exercise.points || null,
                exercise.efficiency_order || null,
                null,
                exercise.late_submission_penalty_percent || null,
                exercise.max_attempts || null,
              ]
            );

            const [limits] = await connection.execute<any[]>(
              'SELECT * FROM execution_limits WHERE exercise_id = ?',
              [exercise.id]
            );

            for (const limit of limits) {
              const newLimitId = uuidv4();
              await connection.execute(
                `INSERT INTO execution_limits (id, exercise_id, language, time_limit_seconds, memory_limit_mb, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
                [
                  newLimitId,
                  newExerciseId,
                  limit.language,
                  limit.time_limit_seconds || 10,
                  limit.memory_limit_mb || 256,
                ]
              );
            }

            const [testCases] = await connection.execute<any[]>(
              'SELECT * FROM test_cases WHERE exercise_id = ?',
              [exercise.id]
            );

            for (const testCase of testCases) {
              const newTestCaseId = uuidv4();
              await connection.execute(
                `INSERT INTO test_cases (id, exercise_id, input, expected_output, 
                 runner_code, is_hidden, available_from, order_index, time_limit_seconds, memory_limit_mb, 
                 efficiency_order, hint_text, hint_penalty_percent, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
                [
                  newTestCaseId,
                  newExerciseId,
                  testCase.input ?? '',
                  testCase.expected_output ?? '',
                  testCase.runner_code || null,
                  testCase.is_hidden !== undefined ? testCase.is_hidden : false,
                  testCase.available_from || null,
                  testCase.order_index || null,
                  testCase.time_limit_seconds || 5,
                  testCase.memory_limit_mb || 256,
                  testCase.efficiency_order || 'any',
                  testCase.hint_text || null,
                  testCase.hint_penalty_percent || 10,
                ]
              );
            }

            const [exerciseFiles] = await connection.execute<any[]>(
              'SELECT * FROM exercise_common_files WHERE exercise_id = ?',
              [exercise.id]
            );

            for (const file of exerciseFiles) {
              const newFileId = uuidv4();
              await connection.execute(
                `INSERT INTO exercise_common_files (id, exercise_id, filename, content, file_type, description, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
                [
                  newFileId,
                  newExerciseId,
                  file.filename,
                  file.content,
                  file.file_type || 'source',
                  file.description || null,
                ]
              );
            }

            migratedData.exercises.push({
              originalId: exercise.id,
              newId: newExerciseId,
              title: exercise.title,
              testCasesCount: testCases.length,
            });
          }
        }
      }

      await connection.execute(
        'UPDATE courses SET migrated_from = ?, updated_at = NOW() WHERE id = ?',
        [sourceCourseId, targetCourseId]
      );

      await connection.commit();

      return {
        success: true,
        migratedData,
        summary: {
          syllabi: migratedData.syllabi.length,
          exercises: migratedData.exercises.length,
        },
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

export const courseService = new CourseService();
