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

export function createArray<T>(length: number, fillValue: T): T[] {
  return new Array(length).fill(fillValue);
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

export const coerceToDate = (value: string | Date | number) => {
  if (value instanceof Date) return { value, error: null };
  try {
    if (typeof value === 'number') {
      return { value: null, error: new Error('Invalid date') };
    } else if (typeof value === 'string')
      return { value: parseDateDDMMYYYY(value), error: null };
  } catch (error) {
    if (error instanceof Error) {
      return { value: null, error };
    }
  }
  return { value, error: null };
};

type Row = (string | number)[];

export function partitionByMonth(data: Row[]): Row[][] {
  const partitions: { [key: string]: Row[] } = {};

  for (const row of data) {
    const date = new Date(row[0]);
    const monthKey = `${date.getFullYear()}-${String(
      date.getMonth() + 1,
    ).padStart(2, '0')}`;

    if (!(monthKey in partitions)) {
      partitions[monthKey] = [];
    }
    partitions[monthKey].push(row);
  }

  return Object.values(partitions);
}

export function getColumnSums(matrix: number[][]): number[] {
  if (matrix.length === 0) return [];

  // Initialize an array with zeros to store the column sums
  const sums = new Array(matrix[0].length).fill(0);

  // Iterate over each row in the matrix
  for (const row of matrix) {
    // Iterate over each column in the row
    for (let i = 0; i < row.length; i++) {
      sums[i] += row[i];
    }
  }

  return sums;
}

export function zip<S1, S2>(
  firstCollection: Array<S1>,
  lastCollection: Array<S2>,
): Array<[S1, S2]> {
  const length = Math.min(firstCollection.length, lastCollection.length);
  const zipped: Array<[S1, S2]> = [];

  for (let index = 0; index < length; index++) {
    zipped.push([firstCollection[index], lastCollection[index]]);
  }

  return zipped;
}

export const indexToMonth = {
  0: 'January',
  1: 'February',
  2: 'March',
  3: 'April',
  4: 'May',
  5: 'June',
  6: 'July',
  7: 'August',
  8: 'September',
  9: 'October',
  10: 'November',
  11: 'December',
} satisfies Record<number, (typeof monthNames)[number]>;
export const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const isRegularMatrix = (matrix) =>
  matrix.every((x) => x.length === matrix[0].length);

export const assert = (condition: boolean, message = 'Assertion failed') => {
  if (!condition) {
    throw new Error(message);
  }
};
