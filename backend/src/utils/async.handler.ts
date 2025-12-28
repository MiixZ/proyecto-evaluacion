import { Request, Response, NextFunction } from 'express';

/**
 * Envuelve los controladores para manejar errores asíncronos automáticamente.
 * Elimina la necesidad de bloques try/catch en cada controlador.
 */
export const catchAsync = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
