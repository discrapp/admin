import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn utility', () => {
  it('merges class names', () => {
    const result = cn('text-sm', 'font-bold');
    expect(result).toBe('text-sm font-bold');
  });

  it('handles conditional classes', () => {
    const isActive = true;
    const result = cn('base-class', isActive && 'active-class');
    expect(result).toBe('base-class active-class');
  });

  it('removes falsy values', () => {
    const result = cn('base-class', false && 'hidden', null, undefined, '');
    expect(result).toBe('base-class');
  });

  it('merges tailwind classes correctly (tailwind-merge)', () => {
    // tailwind-merge should resolve conflicting classes
    const result = cn('p-4', 'p-8');
    expect(result).toBe('p-8');
  });

  it('handles object syntax from clsx', () => {
    const result = cn({
      'text-red-500': true,
      'text-blue-500': false,
    });
    expect(result).toBe('text-red-500');
  });

  it('handles array syntax from clsx', () => {
    const result = cn(['text-sm', 'font-bold']);
    expect(result).toBe('text-sm font-bold');
  });

  it('handles empty inputs', () => {
    const result = cn();
    expect(result).toBe('');
  });

  it('handles mix of different input types', () => {
    const result = cn(
      'base',
      ['arr1', 'arr2'],
      { conditional: true, ignored: false },
      true && 'included'
    );
    expect(result).toContain('base');
    expect(result).toContain('arr1');
    expect(result).toContain('arr2');
    expect(result).toContain('conditional');
    expect(result).toContain('included');
    expect(result).not.toContain('ignored');
  });
});
