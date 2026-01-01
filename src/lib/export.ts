/**
 * Utility functions for exporting data to CSV and PDF formats
 */

interface ExportColumn {
  key: string;
  header: string;
  format?: (value: unknown) => string;
}

/**
 * Exports data to CSV format and triggers download
 */
export function exportToCSV<T extends object>(
  data: T[],
  columns: ExportColumn[],
  filename: string
): void {
  if (data.length === 0) {
    return;
  }

  // Build CSV header
  const header = columns.map((col) => `"${col.header}"`).join(',');

  // Build CSV rows
  const rows = data.map((row) => {
    return columns
      .map((col) => {
        const value = (row as Record<string, unknown>)[col.key];
        const formatted = col.format ? col.format(value) : String(value ?? '');
        // Escape quotes and wrap in quotes
        return `"${formatted.replace(/"/g, '""')}"`;
      })
      .join(',');
  });

  // Combine header and rows
  const csv = [header, ...rows].join('\n');

  // Create blob and download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports data to a printable HTML table that opens in a new window for printing/PDF
 */
export function exportToPDF<T extends object>(
  data: T[],
  columns: ExportColumn[],
  title: string
): void {
  if (data.length === 0) {
    return;
  }

  // Build HTML table
  const headerRow = columns
    .map((col) => `<th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f4f4f4;">${col.header}</th>`)
    .join('');

  const bodyRows = data
    .map((row) => {
      const cells = columns
        .map((col) => {
          const value = (row as Record<string, unknown>)[col.key];
          const formatted = col.format ? col.format(value) : String(value ?? '—');
          return `<td style="border: 1px solid #ddd; padding: 8px;">${formatted}</td>`;
        })
        .join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            padding: 20px;
            max-width: 1200px;
            margin: 0 auto;
          }
          h1 {
            font-size: 24px;
            margin-bottom: 10px;
          }
          .meta {
            color: #666;
            font-size: 14px;
            margin-bottom: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
          }
          @media print {
            body { padding: 0; }
            h1 { font-size: 18px; }
            table { font-size: 12px; }
            th, td { padding: 4px !important; }
          }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <div class="meta">
          Generated on ${new Date().toLocaleString()} | ${data.length} records
        </div>
        <table>
          <thead>
            <tr>${headerRow}</tr>
          </thead>
          <tbody>
            ${bodyRows}
          </tbody>
        </table>
        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
    </html>
  `;

  // Open in new window for printing
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
}

/**
 * Format helpers for common data types
 */
export const formatters = {
  date: (value: unknown): string => {
    if (!value) return '';
    return new Date(value as string).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  },

  datetime: (value: unknown): string => {
    if (!value) return '';
    return new Date(value as string).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  },

  currency: (value: unknown): string => {
    if (typeof value !== 'number') return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value / 100);
  },

  number: (value: unknown): string => {
    if (typeof value !== 'number') return '';
    return value.toLocaleString();
  },

  boolean: (value: unknown): string => {
    return value ? 'Yes' : 'No';
  },
};
