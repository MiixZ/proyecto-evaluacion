import api from "@/lib/api";
import {
  Degree,
  Subject,
  Course,
  CreateDegreeDTO,
  CreateSubjectDTO,
  CreateCourseDTO,
} from "@/types/academic.types";

export const academicService = {
  getDegrees: async () => {
    const response = await api.get<{ items: Degree[] }>(
      "/v1/degrees?limit=100"
    );
    return response.data.items;
  },
  createDegree: async (data: CreateDegreeDTO) => {
    const response = await api.post<Degree>("/v1/degrees", data);
    return response.data;
  },
  updateDegree: async (id: string, data: Partial<CreateDegreeDTO>) => {
    const response = await api.patch<Degree>(`/v1/degrees/${id}`, data);
    return response.data;
  },

  getSubjects: async (degreeId?: string) => {
    const params = degreeId ? { degreeId, limit: 100 } : { limit: 100 };
    const response = await api.get<{ items: Subject[] }>("/v1/subjects", {
      params,
    });
    return response.data.items;
  },
  createSubject: async (data: CreateSubjectDTO) => {
    const response = await api.post<Subject>("/v1/subjects", data);
    return response.data;
  },

  getCourses: async () => {
    const response = await api.get<{ items: Course[] }>(
      "/v1/courses?limit=100"
    );
    return response.data.items;
  },
  createCourse: async (data: CreateCourseDTO) => {
    const response = await api.post<Course>("/v1/courses", data);
    return response.data;
  },
};
