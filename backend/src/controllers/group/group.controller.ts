import { Response, Request } from 'express';
import { AuthRequest } from '@CustomTypes/request.types';
import { catchAsync } from '@utils/async.handler';
import { ApiResponse } from '@utils/response.handler';
import { groupService } from '@services/group/group.service';
import { groupMapper } from '@mappers/group.mapper';
import { AppError } from '@utils/errors';
import { UserRole } from '@CustomTypes/common.types';

export class GroupController {
  create = catchAsync(async (req: AuthRequest, res: Response) => {
    if (req.user?.role === UserRole.STUDENT) {
      throw new AppError('FORBIDDEN', 403, 'No autorizado');
    }

    const result = await groupService.createGroup(req.body);

    return ApiResponse.created(res, groupMapper.toDTO(result), 'Grupo creado');
  });

  getById = catchAsync(async (req: Request, res: Response) => {
    const result = await groupService.getGroupById(req.params.id);

    return ApiResponse.success(res, groupMapper.toDTO(result));
  });

  listByCourse = catchAsync(async (req: Request, res: Response) => {
    const { courseId } = req.params;
    const result = await groupService.listByCourse(courseId);

    return ApiResponse.success(res, groupMapper.toDTOList(result));
  });

  enrollMember = catchAsync(async (req: AuthRequest, res: Response) => {
    if (req.user?.role === UserRole.STUDENT) {
      throw new AppError('FORBIDDEN', 403, 'No autorizado para matricular');
    }

    const { id } = req.params;
    await groupService.enrollMember(id, req.body);

    return ApiResponse.success(
      res,
      null,
      200,
      'Usuario matriculado correctamente'
    );
  });

  importMembers = catchAsync(async (req: AuthRequest, res: Response) => {
    if (req.user?.role === UserRole.STUDENT) {
      throw new AppError('FORBIDDEN', 403, 'No autorizado para importar');
    }

    const { id } = req.params;
    const { csvContent } = req.body;

    const result = await groupService.importStudentsFromCsv(id, csvContent);

    return ApiResponse.success(
      res,
      result,
      200,
      'Proceso de importación finalizado'
    );
  });

  getMembers = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { role } = req.query;

    const members = await groupService.getGroupMembers(id, role as string);

    return ApiResponse.success(res, groupMapper.toMemberDTOList(members));
  });

  removeMember = catchAsync(async (req: AuthRequest, res: Response) => {
    if (req.user?.role === UserRole.STUDENT) {
      throw new AppError('FORBIDDEN', 403, 'No autorizado');
    }

    const { id, userId } = req.params;
    await groupService.removeMember(id, userId);

    return ApiResponse.success(res, null, 200, 'Miembro eliminado del grupo');
  });
}

export const groupController = new GroupController();
