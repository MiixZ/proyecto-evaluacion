import { parse } from 'csv-parse/sync';

export interface StudentImportRow {
  email: string;
  firstName: string;
  lastName: string;
  dni?: string;
}

export const parseStudentCsv = (csvContent: string): StudentImportRow[] => {
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  });

  return records.map((record: any) => ({
    email: record.email || record.Email || record.correo || '',
    firstName: record.firstName || record.Nombre || record.nombre || '',
    lastName: record.lastName || record.Apellidos || record.apellidos || '',
    dni: record.dni || record.DNI || undefined,
  }));
};

export const escapeCsvField = (field: any): string => {
  if (field === null || field === undefined) {
    return '';
  }

  const stringValue = String(field);

  if (
    stringValue.includes(',') ||
    stringValue.includes('"') ||
    stringValue.includes('\n') ||
    stringValue.includes('\r')
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};
