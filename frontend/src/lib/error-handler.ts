/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";

/**
 * Interfaz para errores estructurados del backend
 */
export interface BackendError {
  message: string;
  errors?: Record<string, string[]>; // Errores de validación por campo
  statusCode?: number;
}

/**
 * Parsea errores del backend y devuelve un mensaje legible
 * @param error Error capturado (puede ser de Axios u otro tipo)
 * @param fallbackMessage Mensaje por defecto si no se puede parsear
 * @returns Mensaje de error formateado
 */
export function parseBackendError(
  error: unknown,
  fallbackMessage: string = "Ha ocurrido un error inesperado"
): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;

    // Caso 1: Errores de validación con detalles específicos
    if (data?.details?.details && Array.isArray(data.details.details)) {
      const errorMessages = data.details.details
        .map((issue: any) => {
          const cleanField = issue.field?.replace(/^body\./, "") || "Campo";
          return `${cleanField}: ${issue.message}`;
        })
        .join(", ");
      return errorMessages || data.message || "Error de validación";
    }

    // Caso 2: Backend devuelve { error: { message: "..." } }
    if (data?.error && typeof data.error === "object" && data.error.message) {
      return data.error.message;
    }

    // Caso 3: Backend devuelve { message: "..." }
    if (data?.message && typeof data.message === "string") {
      return data.message;
    }

    // Caso 4: Backend devuelve { error: "..." } (string directo)
    if (data?.error && typeof data.error === "string") {
      return data.error;
    }

    // Caso 5: Error de red
    if (error.code === "ERR_NETWORK") {
      return "Error de conexión. Verifica tu conexión a internet.";
    }

    // Caso 6: Timeout
    if (error.code === "ECONNABORTED") {
      return "La solicitud ha tardado demasiado tiempo. Inténtalo de nuevo.";
    }

    // Caso 7: Error HTTP genérico
    if (error.response?.status) {
      const status = error.response.status;
      if (status === 401)
        return "Sesión expirada. Por favor, inicia sesión nuevamente.";
      if (status === 403)
        return "No tienes permisos para realizar esta acción.";
      if (status === 404) return "Recurso no encontrado.";
      if (status === 500)
        return "Error interno del servidor. Inténtalo más tarde.";
    }
  }

  // Caso 8: Error de JS estándar
  if (error instanceof Error) {
    return error.message;
  }

  return fallbackMessage;
}

/**
 * Extrae errores de validación por campo desde la respuesta del backend
 * @param error Error capturado de Axios
 * @returns Objeto con errores por campo o null si no hay
 */
export function extractValidationErrors(
  error: unknown
): Record<string, string> | null {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;

    // Caso 1: Formato del middleware validator { details: { details: [{ field, message }] } }
    if (data?.details?.details && Array.isArray(data.details.details)) {
      const fieldErrors: Record<string, string> = {};
      data.details.details.forEach((issue: any) => {
        if (issue.field && issue.message) {
          // Remover el prefijo "body." si existe
          const cleanField = issue.field.replace(/^body\./, "");
          fieldErrors[cleanField] = issue.message;
        }
      });
      return Object.keys(fieldErrors).length > 0 ? fieldErrors : null;
    }

    // Caso 2: Zod issues format
    if (data?.error?.issues && Array.isArray(data.error.issues)) {
      const fieldErrors: Record<string, string> = {};
      data.error.issues.forEach((issue: any) => {
        const field = Array.isArray(issue.path)
          ? issue.path.join(".")
          : issue.path;
        if (field) {
          fieldErrors[field] = issue.message;
        }
      });
      return Object.keys(fieldErrors).length > 0 ? fieldErrors : null;
    }

    // Caso 3: Formato { errors: { field: [messages] } }
    if (data?.errors && typeof data.errors === "object") {
      const fieldErrors: Record<string, string> = {};
      Object.entries(data.errors).forEach(([field, messages]) => {
        if (Array.isArray(messages) && messages.length > 0) {
          fieldErrors[field] = messages[0];
        }
      });
      return Object.keys(fieldErrors).length > 0 ? fieldErrors : null;
    }

    // Caso 4: Formato { validationErrors: { field: message } }
    if (data?.validationErrors && typeof data.validationErrors === "object") {
      return data.validationErrors;
    }
  }

  return null;
}

/**
 * Aplica errores de validación del backend a react-hook-form
 * @param errors Errores extraídos con extractValidationErrors
 * @param setError Función setError de react-hook-form
 */
export function applyValidationErrors(
  errors: Record<string, string> | null,
  setError: any // UseFormSetError from react-hook-form
): void {
  if (!errors) return;

  Object.entries(errors).forEach(([field, message]) => {
    // Intentar aplicar el error al campo
    try {
      setError(field as any, {
        type: "server",
        message,
      });
    } catch (e) {
      console.warn(`No se pudo aplicar error al campo: ${field}`, e);
    }
  });
}

/**
 * Hook personalizado para manejar errores de forma consistente
 */
export function useErrorHandler() {
  const handleError = (
    error: unknown,
    options?: {
      fallbackMessage?: string;
      onValidationError?: (errors: Record<string, string>) => void;
    }
  ) => {
    const message = parseBackendError(error, options?.fallbackMessage);
    const validationErrors = extractValidationErrors(error);

    if (validationErrors && options?.onValidationError) {
      options.onValidationError(validationErrors);
    }

    return { message, validationErrors };
  };

  return { handleError };
}
