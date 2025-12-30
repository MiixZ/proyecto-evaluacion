import { Response } from 'express';

export class ApiResponse {
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

  static created<T>(res: Response, data: T, message?: string) {
    return this.success(res, data, 201, message);
  }

  static noContent(res: Response) {
    return res.status(204).send();
  }
}
