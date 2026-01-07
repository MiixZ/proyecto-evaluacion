import bcrypt from 'bcrypt';
import { logger } from '@utils/logger';
import { AuthenticationError, NotFoundError } from '@utils/errors';
import { generateToken } from '@utils/jwt.utils';
import { userModel } from '@models/user/user.model';
import { UserEntity } from '@models/user/user.entity';
import { UserStatus } from '@CustomTypes/common.types';
import { auditService } from '@services/audit/audit.service';

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
      if (error instanceof NotFoundError) {
        throw new NotFoundError('Email: ' + email);
      }

      throw new AuthenticationError('Email inválido.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.authId);

    if (!isPasswordValid) {
      throw new AuthenticationError('Contraseña inválida');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new AuthenticationError(
        'Usuario desactivado o pendiente de activación'
      );
    }

    // Validar que el usuario tenga asignaturas activas (excepto administradores)
    if (user.role !== 'admin') {
      const enrollments = await userModel.getEnrollments(user.id);
      if (enrollments.length === 0) {
        throw new AuthenticationError(
          'No tienes asignaturas activas asignadas. Contacta con el administrador.'
        );
      }
    }

    const token = generateToken(user.id, user.email, user.role);

    await auditService.log(
      'LOGIN',
      'user',
      user.id,
      { email: user.email },
      user.id,
      'IP_PENDIENTE',
      'USER_AGENT_PENDIENTE'
    );

    logger.info('Usuario autenticado exitosamente', { userId: user.id });

    return { user, token };
  }
}

export const authService = new AuthService();
