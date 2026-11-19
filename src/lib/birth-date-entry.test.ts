import { describe, expect, it } from 'vitest';
import { formatBirthDateEntry, parseBirthDateEntry } from './birth-date-entry';

describe('birth date entry', () => {
  const today = new Date('2026-11-19T00:00:00Z');

  it.each(['17041993', '17.04.1993', '1993-04-17'])('formats %s and submits a date-only value', (input) => {
    const entry = formatBirthDateEntry(input);
    expect(entry).toBe('17.04.1993');
    expect(parseBirthDateEntry(entry, today)).toEqual({ success: true, data: '1993-04-17' });
  });

  it.each(['', '17.04', '29.02.2025', '20.11.2026'])('rejects invalid or incomplete input %s', (entry) => {
    expect(parseBirthDateEntry(entry, today).success).toBe(false);
  });
});
