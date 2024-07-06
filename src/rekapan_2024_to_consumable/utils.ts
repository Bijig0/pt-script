import {
  differenceInYears,
  getDate,
  getMonth,
  setDate,
  setMonth,
} from 'date-fns';
import ExcelJS from 'exceljs';

export function formatDateToDDMMYYYY(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // getMonth() is 0-indexed
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

export function swapDayAndMonth(date: Date): Date {
  const originalDay = getDate(date);
  const originalMonth = getMonth(date); // 0-indexed

  // First set the new month (using the original day)
  let newDate = setMonth(date, originalDay - 1); // -1 because setMonth is 0-indexed

  // Then set the new day (using the original month)
  newDate = setDate(newDate, originalMonth + 1); // +1 because getMonth is 0-indexed but we want 1-indexed for the day

  return newDate;
}

export function isSameOrBefore(date1, date2) {
  return differenceInYears(date1, date2) <= 0;
}

export function parseDateDDMMYYYY(dateString: string): Date {
  const parts = dateString.split('/');

  if (parts.length !== 3) {
    throw new Error('Invalid date format. Expected dd/mm/yyyy');
  }

  const [day, month, year] = parts.map((part) => parseInt(part, 10));

  // Check if the parts are valid numbers
  if (isNaN(day) || isNaN(month) || isNaN(year)) {
    throw new Error('Invalid date components');
  }

  // JavaScript months are 0-indexed, so we subtract 1 from the month
  const date = new Date(year, month - 1, day);

  // Check if the date is valid
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date');
  }

  return date;
}

export function parseDateMMDDYYYY(dateString: string): Date {
  const parts = dateString.split('/');

  if (parts.length !== 3) {
    throw new Error('Invalid date format. Expected mm/dd/yyyy');
  }

  const [month, day, year] = parts.map((part) => parseInt(part, 10));

  // Check if the parts are valid numbers
  if (isNaN(month) || isNaN(day) || isNaN(year)) {
    throw new Error('Invalid date components');
  }

  // JavaScript months are 0-indexed, so we subtract 1 from the month
  const date = new Date(year, month - 1, day);

  // Check if the date is valid
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date');
  }

  return date;
}

export function isObject(obj) {
  return obj != null && obj.constructor.name === 'Object';
}

export const getCellValue = (row: ExcelJS.Row, columnIndex: number) => {
  const cell = row.getCell(columnIndex);
  return cell.value;
};

export const coerceToDate = (
  value: string | null | Date | Record<string, any>,
) => {
  if (isObject(value)) return { value: null, error: null };
  if (value === null) return { value, error: null };
  if (value instanceof Date) return { value, error: null };
  try {
    if (typeof value === 'string')
      return { value: parseDateDDMMYYYY(value), error: null };
  } catch (error) {
    if (error instanceof Error) {
      return { value: null, error };
    }
  }
  return { value, error: null };
};
