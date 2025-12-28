import bcrypt from 'bcrypt';
import { logger } from '@utils/logger';
import { AuthenticationError } from '@utils/errors';
import { generateToken } from '@utils/jwt.utils';
import { userModel } from '@models/user/user.model';
import { UserEntity } from '@models/user/user.entity';
import {
  PaginatedResponse,
  UUID,
  UserRole,
  UserStatus,
} from '@CustomTypes/common.types';
import { CreateUserInput, UpdateUserInput } from '@validators/user.validator';

interface AuthResponse {
  user: UserEntity;
  token: string;
}

export class UserService {
  // --- AUTH METHODS ---

  async login(email: string, password: string): Promise<AuthResponse> {
    const user = await userModel.getByEmail(email);

    const isPasswordValid = await bcrypt.compare(password, user.authId);
    if (!isPasswordValid)
      throw new AuthenticationError('Credenciales inválidas');

    if (user.status !== UserStatus.ACTIVE)
      throw new AuthenticationError('Usuario no activo');

    const token = generateToken(user.id, user.email, user.role);

    logger.info('Usuario autenticado', { userId: user.id });

    return { user, token };
  }

  // --- CRUD METHODS ---

  async createUser(input: CreateUserInput): Promise<UserEntity> {
    return await userModel.create(input, input.password);
  }

  async getUserById(id: string): Promise<UserEntity> {
    return await userModel.getById(id as UUID);
  }

  async getUserByEmail(email: string): Promise<UserEntity> {
    return await userModel.getByEmail(email);
  }

  async listUsers(
    page: number,
    limit: number,
    filters: any
  ): Promise<PaginatedResponse<UserEntity>> {
    return await userModel.list(page, limit, filters);
  }

  async updateUser(id: string, input: UpdateUserInput): Promise<UserEntity> {
    return await userModel.update(id as UUID, input);
  }

  async changeRole(id: string, role: UserRole): Promise<UserEntity> {
    return await userModel.updateRole(id as UUID, role);
  }

  async changeStatus(id: string, status: UserStatus): Promise<UserEntity> {
    return await userModel.updateStatus(id as UUID, status);
  }

  async deleteUser(id: string): Promise<void> {
    return await userModel.softDelete(id as UUID);
  }

  // --- SPECIFIC LISTS ---

  async getTeachers(): Promise<UserEntity[]> {
    return await userModel.getTeachers();
  }

  async getStudents(): Promise<UserEntity[]> {
    return await userModel.getStudents();
  }
}

export const userService = new UserService();
