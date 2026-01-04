import api from "@/lib/api";
import {
  Exercise,
  SubmissionResponse,
  SubmissionHistoryItem,
  HintResponse,
} from "@/types/exercise.types";

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
  lateSubmissionPenaltyPercent: number;
  testCases: {
    input: string;
    expectedOutput: string;
    isHidden: boolean;
    timeLimitSeconds: number;
    memoryLimitMb: number;
    hintText?: string;
    hintPenaltyPercent?: number;
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

export const exerciseService = {
  getById: async (id: string): Promise<Exercise> => {
    const { data } = await api.get<ApiResponse<Exercise>>(`v1/exercises/${id}`);
    return data.data;
  },

  create: async (payload: CreateExercisePayload): Promise<Exercise> => {
    const { data } = await api.post<ApiResponse<Exercise>>(
      "v1/exercises",
      payload
    );
    return data.data;
  },

  submitSolution: async (payload: {
    exerciseId: string;
    courseId: string;
    code: string;
    language: string;
  }): Promise<SubmissionResponse> => {
    const { data } = await api.post<ApiResponse<SubmissionResponse>>(
      "v1/submissions",
      payload
    );
    return data.data;
  },

  getHistory: async (exerciseId: string): Promise<SubmissionHistoryItem[]> => {
    const { data } = await api.get<ApiResponse<SubmissionHistoryItem[]>>(
      "v1/submissions",
      {
        params: { exerciseId },
      }
    );
    return data.data || [];
  },

  requestHint: async (
    submissionId: string,
    testCaseId: string
  ): Promise<HintResponse> => {
    const { data } = await api.post<ApiResponse<HintResponse>>(
      `v1/hints/${submissionId}/test-case/${testCaseId}`
    );
    return data.data;
  },

  getMyExercises: async (): Promise<ExerciseListItem[]> => {
    const { data } = await api.get<ApiResponse<ExerciseListItem[]>>(
      "v1/exercises/professor/mine"
    );

    return data.data;
  },

  togglePublish: async (id: string, isPublished: boolean) => {
    const { data } = await api.patch(`v1/exercises/${id}/publish`, {
      isPublished,
    });

    return data;
  },

  clone: async (id: string) => {
    const { data } = await api.post(`v1/exercises/${id}/clone`);

    return data;
  },
};
