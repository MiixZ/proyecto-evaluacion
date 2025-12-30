import { languageModel } from '@models/language/language.model';
import { ValidationError } from '@utils/errors';

export class LanguageService {
  async getActiveLanguages() {
    return await languageModel.findAll(true);
  }

  async validateLanguageSupport(code: string) {
    const exists = await languageModel.exists(code);

    if (!exists) {
      throw new ValidationError(
        `El lenguaje '${code}' no está soportado o no está activo.`
      );
    }
  }
}

export const languageService = new LanguageService();
