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

    // Caso 1: Backend devuelve { error: { message: "..." } }
    if (data?.error && typeof data.error === "object" && data.error.message) {
      return data.error.message;
    }

    // Caso 2: Backend devuelve { message: "..." }
    if (data?.message && typeof data.message === "string") {
      return data.message;
    }

    // Caso 3: Backend devuelve { error: "..." } (string directo)
    if (data?.error && typeof data.error === "string") {
      return data.error;
    }

    // Caso 4: Error de red
    if (error.code === "ERR_NETWORK") {
      return "Error de conexión. Verifica tu conexión a internet.";
    }

    // Caso 5: Timeout
    if (error.code === "ECONNABORTED") {
      return "La solicitud ha tardado demasiado tiempo. Inténtalo de nuevo.";
    }

    // Caso 6: Error HTTP genérico
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

  // Caso 7: Error de JS estándar
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

    if (data?.errors && typeof data.errors === "object") {
      const fieldErrors: Record<string, string> = {};
      Object.entries(data.errors).forEach(([field, messages]) => {
        if (Array.isArray(messages) && messages.length > 0) {
          fieldErrors[field] = messages[0];
        }
      });
      return Object.keys(fieldErrors).length > 0 ? fieldErrors : null;
    }

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
  setError: (name: string, error: { type: string; message: string }) => void
): void {
  if (!errors) return;

  Object.entries(errors).forEach(([field, message]) => {
    setError(field, {
      type: "server",
      message,
    });
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
