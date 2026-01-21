import api from "@/lib/api";
import {
  Exercise,
  SubmissionResponse,
  SubmissionHistoryItem,
  HintResponse,
} from "@/types/exercise.types";
import { PaginatedResponse } from "@/types/dashboard.types";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface CreateExercisePayload {
  syllabusId: string;
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  language: string;
  templateCode?: string;
  points: number;
  maxAttempts: number;
  deadline?: string;
  lateDeadline?: string;
  lateSubmissionPenaltyPercent: number;
  testCases: {
    input: string;
    expectedOutput: string;
    runnerCode?: string;
    isHidden: boolean;
    timeLimitSeconds: number;
    memoryLimitMb: number;
    hintText?: string;
    hintPenaltyPercent?: number;
    availableFrom?: string;
  }[];
}

export interface ExerciseListItem {
  id: string;
  title: string;
  subject: string;
  syllabus: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  isPublished: boolean;
  submissionCount: number;
  createdAt: string;
}

/**
 * Servicio para gestión de ejercicios de programación
 * Incluye CRUD, envíos, historial y pistas
 */
export const exerciseService = {
  /**
   * Obtiene un ejercicio por ID
   */
  getById: async (id: string): Promise<Exercise> => {
    const { data } = await api.get<ApiResponse<Exercise>>(`v1/exercises/${id}`);
    return data.data;
  },

  /**
   * Lista todos los ejercicios con paginación (solo admin)
   */
  getAll: async (
    page: number = 1,
    limit: number = 20,
    search?: string,
  ): Promise<PaginatedResponse<ExerciseListItem>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
    });

    const { data } = await api.get<
      ApiResponse<PaginatedResponse<ExerciseListItem>>
    >(`v1/exercises?${params}`);
    return data.data;
  },

  /**
   * Crea un nuevo ejercicio
   */
  create: async (payload: CreateExercisePayload): Promise<Exercise> => {
    const { data } = await api.post<ApiResponse<Exercise>>(
      "v1/exercises",
      payload,
    );
    return data.data;
  },

  /**
   * Envía una solución de código para evaluación
   */
  submitSolution: async (payload: {
    exerciseId: string;
    courseId: string;
    code: string;
    language: string;
  }): Promise<SubmissionResponse> => {
    const { data } = await api.post<ApiResponse<SubmissionResponse>>(
      "v1/submissions",
      payload,
    );
    return data.data;
  },

  /**
   * Obtiene el historial de envíos de un ejercicio
   */
  getHistory: async (exerciseId: string): Promise<SubmissionHistoryItem[]> => {
    const { data } = await api.get<ApiResponse<SubmissionHistoryItem[]>>(
      "v1/submissions",
      {
        params: { exerciseId },
      },
    );
    return data.data || [];
  },

  /**
   * Solicita una pista para un caso de prueba
   */
  requestHint: async (
    submissionId: string,
    testCaseId: string,
  ): Promise<HintResponse> => {
    const { data } = await api.post<ApiResponse<HintResponse>>(
      `v1/hints/${submissionId}/test-case/${testCaseId}`,
    );
    return data.data;
  },

  getMyExercises: async (): Promise<ExerciseListItem[]> => {
    const { data } = await api.get<ApiResponse<ExerciseListItem[]>>(
      "v1/exercises/professor/mine",
    );

    return data.data;
  },

  togglePublish: async (id: string, isPublished: boolean) => {
    const { data } = await api.patch(`v1/exercises/${id}/publish`, {
      isPublished,
    });

    return data;
  },

  update: async (
    id: string,
    payload: CreateExercisePayload,
  ): Promise<Exercise> => {
    const { data } = await api.put<ApiResponse<Exercise>>(
      `v1/exercises/${id}`,
      payload,
    );

    return data.data;
  },

  delete: async (id: string) => {
    const { data } = await api.delete(`v1/exercises/${id}`);

    return data;
  },

  clone: async (id: string) => {
    const { data } = await api.post(`v1/exercises/${id}/clone`);

    return data;
  },
};
