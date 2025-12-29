export interface CsvUserRow {
  dni: string;
  firstName: string;
  lastName: string;
  email: string;
}

export function parseStudentCsv(csvContent: string): CsvUserRow[] {
  const lines = csvContent.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headerLine = lines[0];
  const separator = headerLine.includes(';') ? ';' : ',';

  const headers = headerLine
    .split(separator)
    .map((h) => h.trim().toLowerCase());

  const idxDni = headers.findIndex((h) => h.includes('dni'));
  const idxName = headers.findIndex((h) => h.includes('nombre'));
  const idxLast = headers.findIndex((h) => h.includes('apellido'));
  const idxEmail = headers.findIndex(
    (h) => h.includes('correo') || h.includes('email')
  );

  if (idxEmail === -1) {
    throw new Error('Formato CSV inválido: Falta columna de correo');
  }

  const results: CsvUserRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line
      .split(separator)
      .map((c) => c.trim().replace(/^"|"$/g, ''));

    if (cols.length < headers.length) continue;

    results.push({
      dni: idxDni !== -1 ? cols[idxDni] : '',
      firstName: idxName !== -1 ? cols[idxName] : 'Usuario',
      lastName: idxLast !== -1 ? cols[idxLast] : 'Importado',
      email: cols[idxEmail],
    });
  }

  return results;
}
