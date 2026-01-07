import api from "@/lib/api";
import { RankingResponse, SubjectGroup } from "@/types/ranking.types";
import { UUID } from "@/types/common.types";

class RankingService {
  /**
   * Obtiene el ranking de estudiantes con filtros opcionales
   */
  async getRanking(subjectId?: UUID, groupId?: UUID): Promise<RankingResponse> {
    const params = new URLSearchParams();
    if (subjectId) params.append("subjectId", subjectId);
    if (groupId) params.append("groupId", groupId);

    const response = await api.get(`/v1/ranking?${params.toString()}`);
    return response.data.data;
  }

  /**
   * Obtiene los grupos de una asignatura específica
   */
  async getSubjectGroups(subjectId: UUID): Promise<SubjectGroup[]> {
    const response = await api.get(`/v1/ranking/groups/${subjectId}`);
    return response.data.data;
  }
}

export const rankingService = new RankingService();
