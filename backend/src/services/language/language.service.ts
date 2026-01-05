import { languageModel } from '@models/language/language.model';
import { ValidationError } from '@utils/errors';

/**
 * Servicio para gestión de lenguajes de programación soportados
 */
export class LanguageService {
  /**
   * Obtiene todos los lenguajes activos disponibles
   * @returns Lista de lenguajes soportados
   */
  async getActiveLanguages() {
    return await languageModel.findAll(true);
  }

  /**
   * Valida que un lenguaje esté soportado y activo
   * @param code - Código del lenguaje (ej: 'python', 'java')
   * @throws ValidationError si el lenguaje no está soportado
   */
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
