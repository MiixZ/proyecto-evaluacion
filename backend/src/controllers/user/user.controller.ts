import { Request, Response } from 'express';
import { userMapper } from '@mappers/user.mapper';
import { userService } from '@services/user/user.service'; // ¡Solo Service!
import { AuthRequest } from '@CustomTypes/request.types';
import { UserRole } from '@CustomTypes/common.types';
import { AppError } from '@utils/errors';
import { catchAsync } from '@utils/async.handler';
import { ApiResponse } from '@utils/response.handler';

export class UserController {
  createUser = catchAsync(async (req: AuthRequest, res: Response) => {
    this.validateAdmin(req);

    const newUser = await userService.createUser(req.body);

    return ApiResponse.created(res, userMapper.toDTO(newUser));
  });

  getProfile = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = this.validateAuthenticated(req);

    const user = await userService.getUserById(userId);

    return ApiResponse.success(res, userMapper.toDTO(user));
  });

  getUserById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = await userService.getUserById(id);

    return ApiResponse.success(res, userMapper.toDTO(user));
  });

  listUsers = catchAsync(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await userService.listUsers(page, limit, {
      role: req.query.role as any,
      status: req.query.status as any,
      search: req.query.search as string,
    });

    const dtos = userMapper.toDTOList(result.items);

    return ApiResponse.success(res, {
      ...result,
      items: dtos,
    });
  });

  updateUser = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    this.validateUserOrAdmin(req, id);

    const user = await userService.updateUser(id, req.body);

    return ApiResponse.success(res, userMapper.toDTO(user));
  });

  changeRole = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { role } = req.body;

    this.validateAdmin(req);

    const user = await userService.changeRole(id, role);

    return ApiResponse.success(res, userMapper.toDTO(user));
  });

  changeStatus = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    this.validateAdmin(req);

    const user = await userService.changeStatus(id, status);

    return ApiResponse.success(res, userMapper.toDTO(user));
  });

  deleteUser = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    this.validateUserOrAdmin(req, id);

    await userService.deleteUser(id);

    return ApiResponse.noContent(res);
  });

  getTeachers = catchAsync(async (_req: Request, res: Response) => {
    const teachers = await userService.getTeachers();

    return ApiResponse.success(res, userMapper.toDTOList(teachers));
  });

  getStudents = catchAsync(async (_req: Request, res: Response) => {
    const students = await userService.getStudents();

    return ApiResponse.success(res, userMapper.toDTOList(students));
  });

  // --- VALIDATION HELPERS ---
  private validateAdmin(req: AuthRequest): void {
    if (req.user?.role !== UserRole.ADMIN) {
      throw new AppError(
        'FORBIDDEN',
        403,
        'Sólo administradores pueden realizar esta acción'
      );
    }
  }

  private validateUserOrAdmin(req: AuthRequest, userId: string): void {
    if (req.user?.id !== userId && req.user?.role !== UserRole.ADMIN) {
      throw new AppError(
        'FORBIDDEN',
        403,
        'No tienes permisos para realizar esta acción'
      );
    }
  }

  private validateAuthenticated(req: AuthRequest): string {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('UNAUTHORIZED', 401, 'Usuario no autenticado');
    }
    return userId;
  }
}

export const userController = new UserController();
