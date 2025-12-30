import { Request } from 'express';
import { AuthUser } from './common.types.js';

export interface AuthRequest extends Request {
  user?: AuthUser;
  token?: string;
}
