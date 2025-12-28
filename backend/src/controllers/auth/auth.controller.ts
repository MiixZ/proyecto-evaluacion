import { Request, Response } from 'express';
import { authService } from '@services/auth/auth.service'; // Importamos AuthService
import { catchAsync } from '@utils/async.handler';
import { ApiResponse } from '@utils/response.handler';
import { userMapper } from '@mappers/user.mapper';

export class AuthController {
  login = catchAsync(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const { user, token } = await authService.login(email, password);

    return ApiResponse.success(res, {
      user: userMapper.toDTO(user),
      token,
    });
  });
}

export const authController = new AuthController();
