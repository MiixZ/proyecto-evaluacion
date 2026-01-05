import api from "@/lib/api";

export interface CreateSubjectPayload {
  name: string;
  degreeId: string;
  semester?: number;
  credits?: number;
  type?: "core" | "compulsory" | "elective";
}

export const subjectService = {
  create: async (payload: CreateSubjectPayload) => {
    const { data } = await api.post("/v1/subjects", payload);

    return data.data;
  },
};
