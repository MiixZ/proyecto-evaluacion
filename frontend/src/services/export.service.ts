import api from "@/lib/api";

export const exportService = {
  /**
   * Descarga una entrega específica.
   * El backend requiere userRole = TEACHER/ADMIN.
   * * @param submissionId ID de la entrega
   * @param format Formato deseado ('zip' para código fuente, 'json' para metadatos, 'csv' para resumen)
   */
  downloadSubmission: async (
    submissionId: string,
    format: "zip" | "json" | "csv" = "zip"
  ) => {
    try {
      const response = await api.post(
        "/v1/exports",
        {
          submissionId,
          format,
          purpose: "analysis",
        },
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      const contentDisposition = response.headers["content-disposition"];
      let fileName = `submission-${submissionId}.${
        format === "json" ? "json" : "txt"
      }`;

      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (fileNameMatch && fileNameMatch[1]) {
          fileName = fileNameMatch[1];
        }
      }

      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      console.error("Error downloading submission:", error);
      throw error;
    }
  },

  /**
   * Exporta estadísticas completas de un grupo
   * @param groupId - ID del grupo
   * @param format - Formato de exportación (json o csv)
   */
  exportGroupStatistics: async (
    groupId: string,
    format: "json" | "csv" = "json"
  ): Promise<Blob> => {
    const response = await api.get(
      `/v1/exports/group/${groupId}/statistics?format=${format}`,
      {
        responseType: "blob",
      }
    );

    return response.data;
  },

  /**
   * Descarga el archivo de estadísticas de un grupo
   * @param groupId - ID del grupo
   * @param groupName - Nombre del grupo para el archivo
   * @param format - Formato de exportación
   */
  downloadGroupStatistics: async (
    groupId: string,
    groupName: string,
    format: "json" | "csv" = "json"
  ): Promise<void> => {
    try {
      const blob = await exportService.exportGroupStatistics(groupId, format);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const date = new Date().toISOString().split("T")[0];
      const extension = format === "json" ? "json" : "csv";
      link.download = `group_statistics_${groupName}_${date}.${extension}`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading group statistics:", error);
      throw error;
    }
  },
};
