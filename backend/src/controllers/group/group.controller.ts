import { Response, Request } from 'express';
import { AuthRequest } from '@CustomTypes/request.types';
import { catchAsync } from '@utils/async.handler';
import { ApiResponse } from '@utils/response.handler';
import { groupService } from '@services/group/group.service';
import { groupMapper } from '@mappers/group.mapper';
import { AppError } from '@utils/errors';
import { UserRole, UUID } from '@CustomTypes/common.types';
import { groupModel } from '@models/group/group.model';
import { dashboardModel } from '@models/dashboard/dashboard.model';
import { dashboardMapper } from '@mappers/dashboard.mapper';
import { userService } from '@services/user/user.service';
import { parseStudentCsv } from '@utils/csv.parser';
import { userModel } from '@models/user/user.model';

export class GroupController {
  create = catchAsync(async (req: AuthRequest, res: Response) => {
    if (req.user?.role === UserRole.STUDENT) {
      throw new AppError('FORBIDDEN', 403, 'No autorizado');
    }

    const result = await groupService.createGroup(req.body);

    return ApiResponse.created(res, groupMapper.toDTO(result), 'Grupo creado');
  });

  getGroupStudents = catchAsync(async (req: AuthRequest, res: Response) => {
    const { groupId } = req.params;

    if (req.user?.role === UserRole.TEACHER) {
      const isOwner = await groupModel.isTeacherOfGroup(
        req.user.id,
        groupId as UUID
      );

      if (!isOwner)
        throw new AppError(
          'FORBIDDEN',
          403,
          'No tienes permiso sobre este grupo'
        );
    }

    const students = await dashboardModel.getStudentsByGroup(groupId as UUID);

    return ApiResponse.success(
      res,
      students.map(dashboardMapper.toGroupStudentDTO)
    );
  });

  addStudent = catchAsync(async (req: AuthRequest, res: Response) => {
    const { groupId } = req.params;
    const { email, firstName, lastName } = req.body;

    if (req.user?.role === UserRole.TEACHER) {
      const isOwner = await groupModel.isTeacherOfGroup(
        req.user.id,
        groupId as UUID
      );

      if (!isOwner) throw new AppError('FORBIDDEN', 403, 'No tienes permiso');
    }

    const user = await userService.findOrCreateStudent(
      email,
      firstName,
      lastName
    );

    await groupModel.addMember(user.id as UUID, groupId as UUID);

    // Devolver también la contraseña temporal si se ha generado, para que
    // el profesor pueda comunicársela al alumno o descargarla.
    return ApiResponse.created(res, {
      message: 'Estudiante añadido correctamente',
      created: {
        id: user.id,
        email: user.email,
        temporaryPassword: (user as any).temporaryPassword || null,
      },
    });
  });

  listBySubjectAndYear = catchAsync(async (req: Request, res: Response) => {
    const { subjectId, academicYear } = req.query;

    if (!subjectId || !academicYear) {
      throw new AppError(
        'VALIDATION_ERROR',
        400,
        'Faltan parámetros subjectId o academicYear'
      );
    }

    const result = await groupService.listBySubjectAndYear(
      subjectId as string,
      academicYear as string
    );

    return ApiResponse.success(res, groupMapper.toDTOList(result));
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

  update = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const updated = await groupService.updateGroup(id, req.body);

    return ApiResponse.success(
      res,
      groupMapper.toDTO(updated),
      200,
      'Grupo actualizado'
    );
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

  importStudentsCsv = catchAsync(async (req: AuthRequest, res: Response) => {
    const { groupId } = req.params;

    if (!req.file) {
      throw new AppError(
        'VALIDATION_ERROR',
        400,
        'No se ha subido ningún archivo CSV'
      );
    }

    if (req.user?.role === UserRole.TEACHER) {
      const isOwner = await groupModel.isTeacherOfGroup(
        req.user.id,
        groupId as UUID
      );

      if (!isOwner) throw new AppError('FORBIDDEN', 403, 'No tienes permiso');
    }

    const students = parseStudentCsv(req.file.buffer);
    const results = { added: 0, errors: 0 };
    const created: Array<{
      id: string;
      email: string;
      temporaryPassword?: string | null;
    }> = [];

    for (const student of students) {
      try {
        if (!student.email) continue;
        const user = await userService.findOrCreateStudent(
          student.email,
          student.firstName || 'Estudiante',
          student.lastName || ''
        );

        await groupModel.addMember(user.id as UUID, groupId as UUID);
        results.added++;

        created.push({
          id: user.id as string,
          email: user.email,
          temporaryPassword: (user as any).temporaryPassword || null,
        });
      } catch (error) {
        results.errors++;
        console.error(`Error importando estudiante ${student.email}:`, error);
      }
    }

    return ApiResponse.success(res, {
      message: `Proceso completado. Añadidos: ${results.added}. Errores: ${results.errors}`,
      stats: results,
      created,
    });
  });

  removeStudent = catchAsync(async (req: AuthRequest, res: Response) => {
    const { groupId, studentId } = req.params;

    if (req.user?.role === UserRole.TEACHER) {
      const isOwner = await groupModel.isTeacherOfGroup(
        req.user.id,
        groupId as UUID
      );

      if (!isOwner) throw new AppError('FORBIDDEN', 403, 'No tienes permiso');
    }

    await groupModel.removeMember(studentId as UUID, groupId as UUID);

    return ApiResponse.success(res, {
      message: 'Estudiante eliminado del grupo',
    });
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

  exportData = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const csvData = await groupService.generateGroupExport(
      id,
      req.user!.id,
      req.user!.role
    );

    const filename = `grupo_${id}_reporte.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    res.status(200).send(csvData);
  });

  updateStudent = catchAsync(async (req: AuthRequest, res: Response) => {
    const { groupId, studentId } = req.params;
    const { firstName, lastName, email } = req.body;

    if (req.user?.role === UserRole.TEACHER) {
      const isOwner = await groupModel.isTeacherOfGroup(
        req.user.id,
        groupId as UUID
      );

      if (!isOwner) throw new AppError('FORBIDDEN', 403, 'No tienes permiso');
    }

    try {
      await userModel.update(studentId as UUID, { firstName, lastName, email });
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new AppError(
          'VALIDATION_ERROR',
          400,
          'El email ya está en uso por otro usuario'
        );
      }
      throw error;
    }

    return ApiResponse.success(res, {
      message: 'Datos del estudiante actualizados',
    });
  });

  toggleStudentStatus = catchAsync(async (req: AuthRequest, res: Response) => {
    const { groupId, studentId } = req.params;

    if (req.user?.role === UserRole.TEACHER) {
      const isOwner = await groupModel.isTeacherOfGroup(
        req.user.id,
        groupId as UUID
      );
      if (!isOwner) throw new AppError('FORBIDDEN', 403, 'No tienes permiso');
    }

    await groupModel.toggleMemberStatus(studentId as UUID, groupId as UUID);

    return ApiResponse.success(res, {
      message: 'Estado del estudiante actualizado en el grupo',
    });
  });
}

export const groupController = new GroupController();
