import { Request, Response } from 'express';
import { userMapper } from '@mappers/user.mapper';
import { userService } from '@services/user/userService';
import { userModel } from '@models/user/user.model';
import { AuthRequest } from '@CustomTypes/request.types';
import { UUID, UserRole } from '@CustomTypes/common.types';
import { AppError } from '@utils/errors';
import { catchAsync } from '@utils/async.handler'; // Tu nuevo handler
import { ApiResponse } from '@utils/response.handler'; // Tu nuevo handler

export class UserController {
  /**
   * Crear usuario (Admin only)
   */
  createUser = catchAsync(async (req: AuthRequest, res: Response) => {
    // ! Doble verificación de rol de admin (middleware + controller) Esta sí es crítica
    if (req.user?.role !== UserRole.ADMIN) {
      throw new AppError(
        'FORBIDDEN',
        403,
        'Sólo administradores pueden crear usuarios'
      );
    }

    const newUser = await userModel.create(req.body, req.body.password);

    return ApiResponse.created(res, userMapper.toDTO(newUser));
  });

  /**
   * Obtener perfil propio
   */
  getProfile = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId)
      throw new AppError('UNAUTHORIZED', 401, 'Usuario no autenticado');

    const user = await userService.getUserById(userId);

    return ApiResponse.success(res, user);
  });

  /**
   * Obtener usuario por ID (Admin o Teacher)
   */
  getUserById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = await userService.getUserById(id);

    return ApiResponse.success(res, user);
  });

  /**
   * Listar usuarios (Paginado)
   */
  listUsers = catchAsync(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await userModel.list(page, limit, {
      role: req.query.role as any,
      status: req.query.status as any,
      search: req.query.search as string,
    });

    return ApiResponse.success(res, result);
  });

  /**
   * Actualizar usuario
   */
  updateUser = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    if (req.user?.id !== id && req.user?.role !== UserRole.ADMIN) {
      throw new AppError(
        'FORBIDDEN',
        403,
        'No tienes permisos para editar este usuario'
      );
    }

    const user = await userModel.update(id as UUID, req.body);

    return ApiResponse.success(res, userMapper.toDTO(user));
  });

  changeRole = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { role } = req.body;

    if (req.user?.role !== UserRole.ADMIN) {
      throw new AppError(
        'FORBIDDEN',
        403,
        'Solo administradores pueden cambiar roles'
      );
    }

    const user = await userModel.updateRole(id as UUID, role);

    return ApiResponse.success(res, userMapper.toDTO(user));
  });

  /**
   * Cambiar Estado
   */
  changeStatus = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    const user = await userModel.updateStatus(id as UUID, status);

    return ApiResponse.success(res, userMapper.toDTO(user));
  });

  /**
   * Soft Delete
   */
  deleteUser = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    // ! Doble verificación de permisos. Crítica
    if (req.user?.id !== id && req.user?.role !== UserRole.ADMIN) {
      throw new AppError(
        'FORBIDDEN',
        403,
        'No tienes permisos para eliminar este usuario'
      );
    }

    await userModel.softDelete(id as UUID);

    return ApiResponse.noContent(res);
  });

  /**
   * Listar Profesores
   */
  getTeachers = catchAsync(async (_req: Request, res: Response) => {
    const teachers = await userModel.getTeachers();

    return ApiResponse.success(res, teachers);
  });

  /**
   * Listar Estudiantes
   */
  getStudents = catchAsync(async (_req: Request, res: Response) => {
    const students = await userModel.getStudents();

    return ApiResponse.success(res, students);
  });
}

export const userController = new UserController();
