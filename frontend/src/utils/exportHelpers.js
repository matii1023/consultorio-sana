import * as XLSX from 'xlsx';

/**
 * Exporta un array de objetos a Excel (.xlsx)
 * @param {Array} data - Los datos a exportar
 * @param {Array} columns - Definición de columnas: [{ key, label, format? }]
 * @param {string} filename - Nombre del archivo sin extensión
 * @param {string} sheetName - Nombre de la hoja
 */
export const exportToExcel = (data, columns, filename, sheetName = 'Datos') => {
  // Convertir los datos al formato que espera xlsx
  const rows = data.map((item) => {
    const row = {};
    columns.forEach((col) => {
      let value = item[col.key];

      // Aplicar formateador si existe
      if (col.format && typeof col.format === 'function') {
        value = col.format(value, item);
      }

      // Asegurar que sea string o número
      if (value === null || value === undefined) {
        value = '';
      }

      row[col.label] = value;
    });
    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Ancho automático de columnas
  const colWidths = columns.map((col) => ({
    wch: Math.max(col.label.length, 15),
  }));
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Descargar
  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `${filename}_${dateStr}.xlsx`);
};

/**
 * Exporta a CSV (alternativa simple)
 */
export const exportToCSV = (data, columns, filename) => {
  const headers = columns.map((c) => c.label).join(',');
  const rows = data.map((item) =>
    columns
      .map((col) => {
        let value = item[col.key];
        if (col.format && typeof col.format === 'function') {
          value = col.format(value, item);
        }
        value = value === null || value === undefined ? '' : String(value);
        // Escapar comillas y comas
        return `"${value.replace(/"/g, '""')}"`;
      })
      .join(',')
  );

  const csvContent = [headers, ...rows].join('\n');
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });

  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  const dateStr = new Date().toISOString().slice(0, 10);
  link.setAttribute('download', `${filename}_${dateStr}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Formatea una fecha para exportación
 */
export const formatDateForExport = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/**
 * Formatea una fecha y hora para exportación
 */
export const formatDateTimeForExport = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};