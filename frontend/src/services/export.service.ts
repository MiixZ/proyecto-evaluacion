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
};
