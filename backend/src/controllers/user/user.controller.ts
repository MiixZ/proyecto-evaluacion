import { Request, Response } from 'express';
import { userMapper } from '@mappers/user.mapper';
import { userService } from '@services/user/user.service';
import { AuthRequest } from '@CustomTypes/request.types';
import { UserRole, UserStatus } from '@CustomTypes/common.types';
import { AppError } from '@utils/errors';
import { catchAsync } from '@utils/async.handler';
import { ApiResponse } from '@utils/response.handler';
import { UpdateUserInput } from '@validators/user.validator';

export class UserController {
  createUser = catchAsync(async (req: AuthRequest, res: Response) => {
    this.validateAdmin(req);

    const newUser = await userService.createUser(req.body, req.user?.id);

    return ApiResponse.created(res, newUser);
  });

  getProfile = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = this.validateAuthenticated(req);

    const user = await userService.getUserById(userId);

    return ApiResponse.success(res, user);
  });

  getUserById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = await userService.getUserById(id);

    return ApiResponse.success(res, user);
  });

  listUsers = catchAsync(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const role = req.query.role as string;
    const status = req.query.status as string;
    const groupId = req.query.groupId as string;

    const result = await userService.listUsers(page, limit, {
      role: role as UserRole,
      status: status as UserStatus,
      search,
      groupId,
    });

    const dtos = userMapper.toDTOList(result.items);

    return ApiResponse.success(res, {
      ...result,
      items: dtos,
    });
  });

  getMe = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const profile = await userService.getProfile(userId);

    return ApiResponse.success(
      res,
      profile,
      200,
      'Perfil recuperado correctamente'
    );
  });

  updateMe = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const input = req.body as UpdateUserInput;

    const updatedProfile = await userService.updateProfile(userId, input);

    return ApiResponse.success(
      res,
      updatedProfile,
      200,
      'Perfil actualizado correctamente'
    );
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
