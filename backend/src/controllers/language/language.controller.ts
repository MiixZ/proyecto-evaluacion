import { Request, Response } from 'express';
import { catchAsync } from '@utils/async.handler';
import { ApiResponse } from '@utils/response.handler';
import { languageService } from '@services/language/language.service';
import { languageMapper } from '@mappers/language.mapper';

export class LanguageController {
  list = catchAsync(async (_req: Request, res: Response) => {
    const languages = await languageService.getActiveLanguages();

    return ApiResponse.success(res, languageMapper.toDTOList(languages));
  });
}

export const languageController = new LanguageController();
