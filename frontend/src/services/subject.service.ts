import api from "@/lib/api";

export interface CreateSubjectPayload {
  name: string;
  degreeId: string;
  semester?: number;
  credits?: number;
  type?: "core" | "compulsory" | "elective";
}

export interface SubjectFilters {
  degreeId?: string;
  search?: string;
}

export const subjectService = {
  create: async (payload: CreateSubjectPayload) => {
    const { data } = await api.post("/v1/subjects", payload);

    return data.data;
  },

  list: async (
    page: number = 1,
    limit: number = 20,
    filters?: SubjectFilters
  ) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (filters?.degreeId) {
      params.append("degreeId", filters.degreeId);
    }

    if (filters?.search) {
      params.append("search", filters.search);
    }

    const { data } = await api.get(`/v1/subjects?${params.toString()}`);

    return data.data;
  },
};
