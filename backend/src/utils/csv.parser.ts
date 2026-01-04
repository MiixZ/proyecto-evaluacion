import { parse } from 'csv-parse/sync';

export interface StudentImportRow {
  email: string;
  firstName: string;
  lastName: string;
}

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

export function escapeCsvField(field: string | number): string {
  const str = String(field);

  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}
