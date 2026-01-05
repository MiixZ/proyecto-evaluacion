import api from "@/lib/api";

export interface CreateDegreePayload {
  name: string;
  alias?: string;
  status?: "active" | "inactive";
}

export const degreeService = {
  create: async (payload: CreateDegreePayload) => {
    const { data } = await api.post("/v1/degrees", payload);

    return data.data;
  },

  list: async () => {
    const { data } = await api.get("/v1/degrees");

    return data.data;
  },
};
