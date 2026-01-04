import { createHash } from 'crypto';

export class WinnowingService {
  private readonly K_GRAM = 5;
  private readonly WINDOW_SIZE = 4;

  /**
   * Normaliza el código eliminando ruido: espacios, saltos de línea y comentarios.
   * Esto hace que el algoritmo sea resistente a cambios puramente estéticos.
   */
  private normalize(code: string): string {
    if (!code) return '';

    const noComments = code.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '');

    return noComments.replace(/\s+/g, '').toLowerCase();
  }

  /**
   * Genera los k-gramas (substrings de longitud k) del texto normalizado.
   */
  private getKGrams(text: string, k: number): string[] {
    const grams: string[] = [];
    if (text.length < k) return [text];

    for (let i = 0; i <= text.length - k; i++) {
      grams.push(text.substring(i, i + k));
    }

    return grams;
  }

  /**
   * Genera un hash numérico para un fragmento de texto (Rolling hash simulado con MD5).
   */
  private hash(text: string): number {
    const hash = createHash('md5').update(text).digest('hex');

    return parseInt(hash.substring(0, 8), 16);
  }

  /**
   * Algoritmo Winnowing principal:
   * Selecciona una huella digital (hash mínimo) dentro de cada ventana deslizante.
   */
  public getFingerprints(code: string): Set<number> {
    const normalized = this.normalize(code);
    if (!normalized) return new Set();

    const grams = this.getKGrams(normalized, this.K_GRAM);
    const hashes = grams.map((g) => this.hash(g));

    const fingerprints = new Set<number>();

    if (hashes.length < this.WINDOW_SIZE) {
      hashes.forEach((h) => fingerprints.add(h));
      return fingerprints;
    }

    for (let i = 0; i <= hashes.length - this.WINDOW_SIZE; i++) {
      const window = hashes.slice(i, i + this.WINDOW_SIZE);
      const minHash = Math.min(...window);
      fingerprints.add(minHash);
    }

    return fingerprints;
  }

  /**
   * Calcula la similitud usando el Coeficiente de Jaccard sobre los fingerprints.
   * Retorna: 0.0 a 1.0
   */
  public calculateSimilarity(code1: string, code2: string): number {
    const fp1 = this.getFingerprints(code1);
    const fp2 = this.getFingerprints(code2);

    if (fp1.size === 0 && fp2.size === 0) return 1;
    if (fp1.size === 0 || fp2.size === 0) return 0;

    const intersection = new Set([...fp1].filter((x) => fp2.has(x)));

    const union = new Set([...fp1, ...fp2]);

    return intersection.size / union.size;
  }
}

export const winnowingService = new WinnowingService();
