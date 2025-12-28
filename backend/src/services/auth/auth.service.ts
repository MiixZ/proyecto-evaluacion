import bcrypt from 'bcrypt';
import { logger } from '@utils/logger';
import { AuthenticationError } from '@utils/errors';
import { generateToken } from '@utils/jwt.utils';
import { userModel } from '@models/user/user.model';
import { UserEntity } from '@models/user/user.entity';
import { UserStatus } from '@CustomTypes/common.types';

interface LoginResponse {
  user: UserEntity;
  token: string;
}

export class AuthService {
  /**
   * Autentica un usuario y genera un JWT
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    let user: UserEntity;
    try {
      user = await userModel.getByEmail(email);
    } catch (error) {
      throw new AuthenticationError('Credenciales inválidas');
    }

    const isPasswordValid = await bcrypt.compare(password, user.authId);
    if (!isPasswordValid) {
      throw new AuthenticationError('Credenciales inválidas');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new AuthenticationError(
        'Usuario desactivado o pendiente de activación'
      );
    }

    const token = generateToken(user.id, user.email, user.role);

    logger.info('Usuario autenticado exitosamente', { userId: user.id });

    return { user, token };
  }
}

export const authService = new AuthService();
