import { parse } from 'csv-parse/sync';

/**
 * Estructura de una fila de estudiante importada desde CSV
 */
export interface StudentImportRow {
  email: string;
  firstName: string;
  lastName: string;
}

/**
 * Parsea un archivo CSV con datos de estudiantes
 * Soporta diferentes formatos de columnas y delimitadores (coma y punto y coma)
 * @param fileBuffer - Buffer del archivo CSV
 * @returns Array de estudiantes parseados, filtrando los que no tienen email
 */
export const parseStudentCsv = (fileBuffer: Buffer): StudentImportRow[] => {
  const content = fileBuffer.toString('utf-8');

  const delimiter = content.includes(';') ? ';' : ',';

  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    delimiter: delimiter,
    trim: true,
    bom: true,
  });

  return records
    .map((record: any) => ({
      email: record.email || record.Email || record.correo || '',
      firstName: record.firstName || record.nombre || record.Nombre || '',
      lastName: record.lastName || record.apellidos || record.Apellidos || '',
    }))
    .filter((r: StudentImportRow) => r.email);
};

/**
 * Escapa un campo para formato CSV según el estándar RFC 4180
 * @param field - Valor del campo a escapar
 * @returns Campo escapado y entrecomillado si es necesario
 */
export function escapeCsvField(field: string | number): string {
  const str = String(field);

  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}
