import { coerceToDate } from './utils.js';

describe('coerceToDate', () => {
  test('returns null for object input', () => {
    const result = coerceToDate({ key: 'value' });
    expect(result).toEqual({ value: null, error: null });
  });

  test('returns null for null input', () => {
    const result = coerceToDate(null);
    expect(result).toEqual({ value: null, error: null });
  });

  test('returns the date for Date input', () => {
    const date = new Date();
    const result = coerceToDate(date);
    expect(result).toEqual({ value: date, error: null });
  });

  test('parses valid date string in DD/MM/YYYY format', () => {
    const dateString = '01/12/2020';
    const expectedDate = new Date(2020, 11, 1);
    const result = coerceToDate(dateString);
    expect(result).toEqual({ value: expectedDate, error: null });
  });

  test('returns null and error for invalid date string', () => {
    const invalidDateString = 'invalid-date';
    const result = coerceToDate(invalidDateString);
    expect(result.value).toBeNull();
    expect(result.error).toBeInstanceOf(Error);
  });

  test('returns null for undefined input', () => {
    const result = coerceToDate(undefined);
    expect(result).toEqual({ value: undefined, error: null });
  });
});
