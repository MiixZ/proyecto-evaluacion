import api from "@/lib/api";
import { PlagiarismDTO } from "@/types/plagiarism.types";

export const plagiarismService = {
  getById: async (id: string): Promise<PlagiarismDTO> => {
    const { data } = await api.get(`/v1/plagiarism/${id}`);

    return data.data;
  },

  review: async (id: string, notes: string, isFlagged: boolean) => {
    const { data } = await api.patch(`/v1/plagiarism/${id}/review`, {
      notes,
      isFlagged,
    });

    return data.data;
  },
};
