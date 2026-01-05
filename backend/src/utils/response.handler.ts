import { Response } from 'express';

/**
 * Clase para formatear respuestas HTTP de la API de forma consistente
 */
export class ApiResponse {
  /**
   * Envía una respuesta exitosa con datos
   * @param res - Objeto Response de Express
   * @param data - Datos a enviar en la respuesta
   * @param statusCode - Código de estado HTTP (por defecto 200)
   * @param message - Mensaje opcional descriptivo
   * @returns Response con formato estándar de la API
   */
  static success<T>(
    res: Response,
    data: T,
    statusCode: number = 200,
    message?: string
  ) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Envía una respuesta de recurso creado (201)
   * @param res - Objeto Response de Express
   * @param data - Datos del recurso creado
   * @param message - Mensaje opcional descriptivo
   * @returns Response con código 201
   */
  static created<T>(res: Response, data: T, message?: string) {
    return this.success(res, data, 201, message);
  }

  /**
   * Envía una respuesta sin contenido (204)
   * @param res - Objeto Response de Express
   * @returns Response vacía con código 204
   */
  static noContent(res: Response) {
    return res.status(204).send();
  }
}
