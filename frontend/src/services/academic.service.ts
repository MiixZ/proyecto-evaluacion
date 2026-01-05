// frontend/src/services/academic.service.ts
import api from "@/lib/api";
import {
  Degree,
  Subject,
  Course,
  Syllabus,
  CreateDegreeDTO,
  CreateSubjectDTO,
  CreateCourseDTO,
  CreateSyllabusDTO,
} from "@/types/academic.types";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  totalPages: number;
}

export const academicService = {
  // --- DEGREES ---
  getDegrees: async () => {
    const response = await api.get<ApiResponse<PaginatedResponse<Degree>>>(
      "/v1/degrees?limit=100"
    );

    return response.data.data.items;
  },
  createDegree: async (data: CreateDegreeDTO) => {
    const response = await api.post<ApiResponse<Degree>>("/v1/degrees", data);

    return response.data.data;
  },
  updateDegree: async (id: string, data: Partial<CreateDegreeDTO>) => {
    const response = await api.patch<ApiResponse<Degree>>(
      `/v1/degrees/${id}`,
      data
    );

    return response.data.data;
  },

  // --- SUBJECTS ---
  getSubjects: async (degreeId?: string) => {
    const params = degreeId ? { degreeId, limit: 100 } : { limit: 100 };
    const response = await api.get<ApiResponse<PaginatedResponse<Subject>>>(
      "/v1/subjects",
      { params }
    );

    return response.data.data.items;
  },
  createSubject: async (data: CreateSubjectDTO) => {
    const response = await api.post<ApiResponse<Subject>>("/v1/subjects", data);

    return response.data.data;
  },
  updateSubject: async (id: string, data: Partial<CreateSubjectDTO>) => {
    const response = await api.patch<ApiResponse<Subject>>(
      `/v1/subjects/${id}`,
      data
    );

    return response.data.data;
  },

  // --- COURSES ---
  getCourses: async () => {
    const response = await api.get<ApiResponse<PaginatedResponse<Course>>>(
      "/v1/courses?limit=100"
    );

    return response.data.data.items;
  },
  createCourse: async (data: CreateCourseDTO) => {
    const response = await api.post<ApiResponse<Course>>("/v1/courses", data);
    return response.data.data;
  },
  updateCourse: async (id: string, data: Partial<CreateCourseDTO>) => {
    const response = await api.patch<ApiResponse<Course>>(
      `/v1/courses/${id}`,
      data
    );

    return response.data.data;
  },

  // --- SYLLABI (Temarios) ---
  getSyllabi: async (courseId?: string) => {
    const params = courseId ? { courseId, limit: 100 } : { limit: 100 };
    const response = await api.get<ApiResponse<PaginatedResponse<Syllabus>>>(
      "/v1/syllabi",
      { params }
    );
    return response.data.data.items;
  },
  createSyllabus: async (data: CreateSyllabusDTO) => {
    const response = await api.post<ApiResponse<Syllabus>>("/v1/syllabi", data);
    return response.data.data;
  },
  updateSyllabus: async (id: string, data: Partial<CreateSyllabusDTO>) => {
    const response = await api.patch<ApiResponse<Syllabus>>(
      `/v1/syllabi/${id}`,
      data
    );
    return response.data.data;
  },

  // --- COURSE MIGRATION ---
  getMigrationPreview: async (sourceCourseId: string) => {
    const response = await api.get<
      ApiResponse<{
        course: Course;
        summary: {
          totalSyllabi: number;
          totalExercises: number;
        };
        syllabi: Array<{
          id: string;
          title: string;
          content_type: string;
          order_index: number;
          exercises_count: number;
        }>;
      }>
    >(`/v1/courses/${sourceCourseId}/migration-preview`);

    return response.data.data;
  },

  getCourseHistory: async (subjectId: string) => {
    const response = await api.get<
      ApiResponse<
        Array<{
          id: string;
          subject_id: string;
          academic_year: string;
          semester: number;
          status: string;
          start_date: string | null;
          end_date: string | null;
          migrated_from: string | null;
          subject_name: string;
          subject_code: string;
          syllabi_count: number;
          exercises_count: number;
          created_at: string;
          updated_at: string;
        }>
      >
    >(`/v1/courses/subject/${subjectId}/history`);

    return response.data.data;
  },

  migrateContent: async (
    sourceCourseId: string,
    data: {
      targetCourseId: string;
      includeSyllabi: boolean;
      includeExercises: boolean;
      selectedSyllabiIds?: string[];
    }
  ) => {
    const response = await api.post<
      ApiResponse<{
        success: boolean;
        migratedData: {
          syllabi: Array<{
            originalId: string;
            newId: string;
            title: string;
          }>;
          exercises: Array<{
            originalId: string;
            newId: string;
            title: string;
            testCasesCount: number;
          }>;
        };
        summary: {
          syllabi: number;
          exercises: number;
        };
      }>
    >(`/v1/courses/${sourceCourseId}/migrate`, data);

    return response.data.data;
  },
};
