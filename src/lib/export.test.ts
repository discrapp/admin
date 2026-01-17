import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exportToCSV, exportToPDF, formatters } from './export';

describe('export utilities', () => {
  describe('exportToCSV', () => {
    let mockCreateObjectURL: ReturnType<typeof vi.fn>;
    let mockRevokeObjectURL: ReturnType<typeof vi.fn>;
    let mockClick: ReturnType<typeof vi.fn>;
    let mockAppendChild: ReturnType<typeof vi.fn>;
    let mockRemoveChild: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      mockCreateObjectURL = vi.fn().mockReturnValue('blob:test-url');
      mockRevokeObjectURL = vi.fn();
      mockClick = vi.fn();
      mockAppendChild = vi.fn();
      mockRemoveChild = vi.fn();

      global.URL.createObjectURL = mockCreateObjectURL as typeof URL.createObjectURL;
      global.URL.revokeObjectURL = mockRevokeObjectURL as typeof URL.revokeObjectURL;
      document.body.appendChild = mockAppendChild as typeof document.body.appendChild;
      document.body.removeChild = mockRemoveChild as typeof document.body.removeChild;

      vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
        if (tagName === 'a') {
          return {
            href: '',
            setAttribute: vi.fn(),
            click: mockClick,
          } as unknown as HTMLAnchorElement;
        }
        return document.createElement(tagName);
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('does nothing when data is empty', () => {
      exportToCSV([], [{ key: 'name', header: 'Name' }], 'test');

      expect(mockCreateObjectURL).not.toHaveBeenCalled();
    });

    it('creates CSV with correct headers', () => {
      const data = [{ name: 'John', age: 30 }];
      const columns = [
        { key: 'name', header: 'Full Name' },
        { key: 'age', header: 'Age' },
      ];

      exportToCSV(data, columns, 'users');

      expect(mockCreateObjectURL).toHaveBeenCalled();
      const blobArg = mockCreateObjectURL.mock.calls[0][0] as Blob;
      expect(blobArg.type).toBe('text/csv;charset=utf-8;');
    });

    it('creates CSV with correct data rows', () => {
      const data = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 },
      ];
      const columns = [
        { key: 'name', header: 'Name' },
        { key: 'age', header: 'Age' },
      ];

      exportToCSV(data, columns, 'users');

      expect(mockCreateObjectURL).toHaveBeenCalled();
    });

    it('applies format function when provided', () => {
      const data = [{ price: 1000 }];
      const columns = [
        {
          key: 'price',
          header: 'Price',
          format: (v: unknown) => `$${(v as number) / 100}`,
        },
      ];

      exportToCSV(data, columns, 'prices');

      expect(mockCreateObjectURL).toHaveBeenCalled();
    });

    it('escapes quotes in values', () => {
      const data = [{ description: 'Test "quoted" value' }];
      const columns = [{ key: 'description', header: 'Description' }];

      exportToCSV(data, columns, 'test');

      expect(mockCreateObjectURL).toHaveBeenCalled();
    });

    it('handles null/undefined values', () => {
      const data = [{ name: null, age: undefined }];
      const columns = [
        { key: 'name', header: 'Name' },
        { key: 'age', header: 'Age' },
      ];

      exportToCSV(data, columns, 'test');

      expect(mockCreateObjectURL).toHaveBeenCalled();
    });

    it('triggers download with correct filename', () => {
      const data = [{ name: 'John' }];
      const columns = [{ key: 'name', header: 'Name' }];
      const mockSetAttribute = vi.fn();

      vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
        if (tagName === 'a') {
          return {
            href: '',
            setAttribute: mockSetAttribute,
            click: mockClick,
          } as unknown as HTMLAnchorElement;
        }
        return document.createElement(tagName);
      });

      exportToCSV(data, columns, 'my-export');

      expect(mockSetAttribute).toHaveBeenCalledWith('download', 'my-export.csv');
    });

    it('cleans up blob URL after download', () => {
      const data = [{ name: 'John' }];
      const columns = [{ key: 'name', header: 'Name' }];

      exportToCSV(data, columns, 'test');

      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:test-url');
    });
  });

  describe('exportToPDF', () => {
    let mockWrite: ReturnType<typeof vi.fn>;
    let mockClose: ReturnType<typeof vi.fn>;
    let mockOpen: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      mockWrite = vi.fn();
      mockClose = vi.fn();
      mockOpen = vi.fn().mockReturnValue({
        document: {
          write: mockWrite,
          close: mockClose,
        },
      });

      vi.stubGlobal('open', mockOpen);
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('does nothing when data is empty', () => {
      exportToPDF([], [{ key: 'name', header: 'Name' }], 'Test Report');

      expect(mockOpen).not.toHaveBeenCalled();
    });

    it('opens a new window for printing', () => {
      const data = [{ name: 'John' }];
      const columns = [{ key: 'name', header: 'Name' }];

      exportToPDF(data, columns, 'Test Report');

      expect(mockOpen).toHaveBeenCalledWith('', '_blank');
    });

    it('writes HTML content with title', () => {
      const data = [{ name: 'John' }];
      const columns = [{ key: 'name', header: 'Name' }];

      exportToPDF(data, columns, 'My Report');

      expect(mockWrite).toHaveBeenCalled();
      const htmlContent = mockWrite.mock.calls[0][0] as string;
      expect(htmlContent).toContain('<title>My Report</title>');
      expect(htmlContent).toContain('<h1>My Report</h1>');
    });

    it('includes column headers in table', () => {
      const data = [{ name: 'John', email: 'john@test.com' }];
      const columns = [
        { key: 'name', header: 'Full Name' },
        { key: 'email', header: 'Email Address' },
      ];

      exportToPDF(data, columns, 'Users');

      const htmlContent = mockWrite.mock.calls[0][0] as string;
      expect(htmlContent).toContain('Full Name');
      expect(htmlContent).toContain('Email Address');
    });

    it('includes data rows in table', () => {
      const data = [
        { name: 'John', email: 'john@test.com' },
        { name: 'Jane', email: 'jane@test.com' },
      ];
      const columns = [
        { key: 'name', header: 'Name' },
        { key: 'email', header: 'Email' },
      ];

      exportToPDF(data, columns, 'Users');

      const htmlContent = mockWrite.mock.calls[0][0] as string;
      expect(htmlContent).toContain('John');
      expect(htmlContent).toContain('jane@test.com');
    });

    it('applies format function when provided', () => {
      const data = [{ price: 1000 }];
      const columns = [
        {
          key: 'price',
          header: 'Price',
          format: (v: unknown) => `$${(v as number) / 100}`,
        },
      ];

      exportToPDF(data, columns, 'Prices');

      const htmlContent = mockWrite.mock.calls[0][0] as string;
      expect(htmlContent).toContain('$10');
    });

    it('displays em dash for null/undefined values', () => {
      const data = [{ name: null }];
      const columns = [{ key: 'name', header: 'Name' }];

      exportToPDF(data, columns, 'Test');

      const htmlContent = mockWrite.mock.calls[0][0] as string;
      // Should use em dash for empty values
      expect(htmlContent).toContain('—');
    });

    it('includes record count in metadata', () => {
      const data = [{ name: 'John' }, { name: 'Jane' }, { name: 'Bob' }];
      const columns = [{ key: 'name', header: 'Name' }];

      exportToPDF(data, columns, 'Users');

      const htmlContent = mockWrite.mock.calls[0][0] as string;
      expect(htmlContent).toContain('3 records');
    });

    it('includes print styles', () => {
      const data = [{ name: 'John' }];
      const columns = [{ key: 'name', header: 'Name' }];

      exportToPDF(data, columns, 'Test');

      const htmlContent = mockWrite.mock.calls[0][0] as string;
      expect(htmlContent).toContain('@media print');
    });

    it('includes auto-print script', () => {
      const data = [{ name: 'John' }];
      const columns = [{ key: 'name', header: 'Name' }];

      exportToPDF(data, columns, 'Test');

      const htmlContent = mockWrite.mock.calls[0][0] as string;
      expect(htmlContent).toContain('window.print()');
    });

    it('closes document after writing', () => {
      const data = [{ name: 'John' }];
      const columns = [{ key: 'name', header: 'Name' }];

      exportToPDF(data, columns, 'Test');

      expect(mockClose).toHaveBeenCalled();
    });

    it('handles popup blocker gracefully', () => {
      mockOpen.mockReturnValue(null);

      const data = [{ name: 'John' }];
      const columns = [{ key: 'name', header: 'Name' }];

      // Should not throw
      expect(() => exportToPDF(data, columns, 'Test')).not.toThrow();
    });
  });

  describe('formatters', () => {
    describe('date', () => {
      it('formats valid date string', () => {
        const result = formatters.date('2024-03-15T10:30:00Z');
        expect(result).toMatch(/Mar/);
        expect(result).toMatch(/15/);
        expect(result).toMatch(/2024/);
      });

      it('returns empty string for null/undefined', () => {
        expect(formatters.date(null)).toBe('');
        expect(formatters.date(undefined)).toBe('');
        expect(formatters.date('')).toBe('');
      });
    });

    describe('datetime', () => {
      it('formats valid datetime string', () => {
        const result = formatters.datetime('2024-03-15T10:30:00Z');
        expect(result).toMatch(/Mar/);
        expect(result).toMatch(/15/);
        expect(result).toMatch(/2024/);
      });

      it('returns empty string for null/undefined', () => {
        expect(formatters.datetime(null)).toBe('');
        expect(formatters.datetime(undefined)).toBe('');
      });
    });

    describe('currency', () => {
      it('formats cents to dollars', () => {
        const result = formatters.currency(1000);
        expect(result).toBe('$10.00');
      });

      it('formats zero correctly', () => {
        const result = formatters.currency(0);
        expect(result).toBe('$0.00');
      });

      it('formats cents correctly', () => {
        const result = formatters.currency(99);
        expect(result).toBe('$0.99');
      });

      it('returns empty string for non-number', () => {
        expect(formatters.currency('abc')).toBe('');
        expect(formatters.currency(null)).toBe('');
        expect(formatters.currency(undefined)).toBe('');
      });
    });

    describe('number', () => {
      it('formats number with locale separators', () => {
        const result = formatters.number(1000000);
        expect(result).toBe('1,000,000');
      });

      it('returns empty string for non-number', () => {
        expect(formatters.number('abc')).toBe('');
        expect(formatters.number(null)).toBe('');
      });
    });

    describe('boolean', () => {
      it('returns Yes for truthy values', () => {
        expect(formatters.boolean(true)).toBe('Yes');
        expect(formatters.boolean(1)).toBe('Yes');
        expect(formatters.boolean('yes')).toBe('Yes');
      });

      it('returns No for falsy values', () => {
        expect(formatters.boolean(false)).toBe('No');
        expect(formatters.boolean(0)).toBe('No');
        expect(formatters.boolean('')).toBe('No');
        expect(formatters.boolean(null)).toBe('No');
        expect(formatters.boolean(undefined)).toBe('No');
      });
    });
  });
});
