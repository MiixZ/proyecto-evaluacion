import api from "@/lib/api";
import { Language } from "@/types/language.types";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export const languageService = {
  getActiveLanguages: async (): Promise<Language[]> => {
    const { data } = await api.get<ApiResponse<Language[]>>("v1/languages");

    return data.data;
  },
};
