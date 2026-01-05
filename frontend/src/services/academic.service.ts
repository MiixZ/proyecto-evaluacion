import api from "@/lib/api";
import {
  Degree,
  Subject,
  Course,
  CreateDegreeDTO,
  CreateSubjectDTO,
  CreateCourseDTO,
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
};
