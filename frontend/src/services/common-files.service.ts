import api from "@/lib/api";

export interface CommonFile {
  id: string;
  filename: string;
  content: string;
  fileType: "source" | "data" | "config" | "header";
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommonFileInput {
  filename: string;
  content: string;
  fileType?: "source" | "data" | "config" | "header";
  description?: string;
}

export const commonFilesService = {
  // ==================== EXERCISE COMMON FILES ====================

  getExerciseFiles: async (exerciseId: string): Promise<CommonFile[]> => {
    const response = await api.get(`/v1/common-files/exercise/${exerciseId}`);
    return response.data;
  },

  createExerciseFile: async (
    exerciseId: string,
    input: CreateCommonFileInput,
  ): Promise<CommonFile> => {
    const response = await api.post(
      `/v1/common-files/exercise/${exerciseId}`,
      input,
    );
    return response.data;
  },

  updateExerciseFile: async (
    fileId: string,
    input: Partial<CreateCommonFileInput>,
  ): Promise<CommonFile> => {
    const response = await api.put(
      `/v1/common-files/exercise/file/${fileId}`,
      input,
    );
    return response.data;
  },

  deleteExerciseFile: async (fileId: string): Promise<void> => {
    await api.delete(`/v1/common-files/exercise/file/${fileId}`);
  },

  // ==================== SYLLABUS COMMON FILES ====================

  getSyllabusFiles: async (syllabusId: string): Promise<CommonFile[]> => {
    const response = await api.get(`/v1/common-files/syllabus/${syllabusId}`);
    return response.data;
  },

  createSyllabusFile: async (
    syllabusId: string,
    input: CreateCommonFileInput,
  ): Promise<CommonFile> => {
    const response = await api.post(
      `/v1/common-files/syllabus/${syllabusId}`,
      input,
    );
    return response.data;
  },

  updateSyllabusFile: async (
    fileId: string,
    input: Partial<CreateCommonFileInput>,
  ): Promise<CommonFile> => {
    const response = await api.put(
      `/v1/common-files/syllabus/file/${fileId}`,
      input,
    );
    return response.data;
  },

  deleteSyllabusFile: async (fileId: string): Promise<void> => {
    await api.delete(`/v1/common-files/syllabus/file/${fileId}`);
  },
};
