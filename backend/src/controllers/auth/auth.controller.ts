import { Request, Response } from 'express';
import { authService } from '@services/auth/auth.service';
import { userService } from '@services/user/user.service';
import { catchAsync } from '@utils/async.handler';
import { ApiResponse } from '@utils/response.handler';
import { userMapper } from '@mappers/user.mapper';
import { AuthRequest } from '@CustomTypes/request.types';

export class AuthController {
  login = catchAsync(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const { user, token } = await authService.login(email, password);

    return ApiResponse.success(res, {
      user: userMapper.toDTO(user),
      token,
    });
  });

  getMe = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;

    const user = await userService.getUserById(userId);

    return ApiResponse.success(res, user);
  });
}

export const authController = new AuthController();
