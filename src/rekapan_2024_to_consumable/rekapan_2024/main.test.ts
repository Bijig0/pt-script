import { describe, expect, it, jest, mock } from 'bun:test';
import ExcelJS from 'exceljs';
import { populateHeader } from '../addSisaSewaAlatAmount.js';
import { calculateColumnSums, partitionByMonth } from '../utils.js';

function prepend(value, array) {
  var newArray = array.slice();
  newArray.unshift(value);
  return newArray;
}

const mockWorkbook = {
  eachSheet: jest.fn((callback: (sheet: ExcelJS.Worksheet) => void) => {
    const mockSheet1 = createMockSheet([
      createMockRow([
        createMockCell('Sisa Alat'),
        createMockCell('Other value'),
      ]),
      createMockRow([createMockCell('Another value')]),
    ]);

    const mockSheet2 = createMockSheet([
      createMockRow([createMockCell('Different text')]),
    ]);

    callback(mockSheet1);
    callback(mockSheet2);
  }),
};

const createMockCell = (value) => ({ value });

const createMockRow = (cells) => ({
  eachCell: jest.fn((callback) => cells.forEach(callback)),
  values: prepend(
    undefined,
    cells.map((cell) => cell.value),
  ),
});

const createMockSheet = (rows) => ({
  eachRow: jest.fn(
    (callback: (row: ExcelJS.Row, rowNumber: number) => void) => {
      rows.forEach(callback);
    },
  ),
  name: 'MockSheet',
  spliceRows: jest.fn(),
  addRows: jest.fn(),
  getRow: jest.fn((rowNumber) => rows[rowNumber]),
});

mock.module('../utils.js', () => ({
  getCellValue: jest.fn((row: ExcelJS.Row, columnIndex: number) => {
    if (columnIndex === 1) return new Date('2024-01-01');
    if (columnIndex === 2) return 20;
  }),
}));

const createMockHeaderRow = (columnNames: string[]) => {
  const mockCells = columnNames.map((columnName) => createMockCell(columnName));
  return createMockRow(mockCells);
};

const createMockValueRow = (columnValues: number[]) => {
  const mockCells = columnValues.map((columnValue) =>
    createMockCell(columnValue),
  );
  return createMockRow(mockCells);
};

describe('addSisaSewaAlatAmount', () => {
  // it('should add the rows as expected when given all 0 values', () => {
  //   const mockWorksheet = createMockSheet([
  //     createMockRow([createMockCell('Placeholder First Row Empty')]),
  //     createMockHeaderRow(['CB 220', 'JB 60', 'UH 40']),
  //     createMockValueRow([0, 0, 0]),
  //   ]);
  //   const newRows = runSingleWorksheetLogic(mockWorksheet);

  //   expect(newRows).toEqual([
  //     ['TGL', 'CB 220', 'JB 60', 'UH 40'],
  //     ['Sisa Alat', 0, 0, 0],
  //     ['01/01/2024', 0, 0, 0],
  //     ['Sisa Alat', 0, 0, 0],
  //   ]);
  // });

  it('should populate newRows with the headers', () => {
    const mockWorksheet = createMockSheet([
      createMockRow([createMockCell('Placeholder First Row Empty')]),
      createMockHeaderRow(['CB 220', 'JB 60', 'UH 40']),
      createMockValueRow([0, 0, 0]),
    ]);

    const { newRows } = populateHeader(mockWorksheet.getRow(1));

    console.log({ newRows });

    expect(newRows).toEqual([
      ['TGL', 'CB 220', 'JB 60', 'UH 40'],
      ['Sisa Alat', 0, 0, 0],
    ]);
  });
});

import { DataRow } from './partitionByMonth';

describe('partitionByMonth', () => {
  it('partitions data from different months', () => {
    const input: DataRow[] = [
      ['2021-09-17T14:00:00.000Z', 60, 60, 48, 48, 48, 30, 30, 216, 0, 0],
      ['2021-10-14T13:00:00.000Z', 0, 0, 0, 0, 0, 0, 0, 0, 20, 0],
      ['2021-12-17T13:00:00.000Z', -30, -30, -24, -23, -24, 0, 0, -90, -10, 0],
      [
        '2024-04-23T14:00:00.000Z',
        -30,
        -24,
        -24,
        -16,
        -7,
        -30,
        -18,
        -40,
        -10,
        0,
      ],
    ];

    const expected: DataRow[][] = [
      [['2021-09-17T14:00:00.000Z', 60, 60, 48, 48, 48, 30, 30, 216, 0, 0]],
      [['2021-10-14T13:00:00.000Z', 0, 0, 0, 0, 0, 0, 0, 0, 20, 0]],
      [
        [
          '2021-12-17T13:00:00.000Z',
          -30,
          -30,
          -24,
          -23,
          -24,
          0,
          0,
          -90,
          -10,
          0,
        ],
      ],
      [
        [
          '2024-04-23T14:00:00.000Z',
          -30,
          -24,
          -24,
          -16,
          -7,
          -30,
          -18,
          -40,
          -10,
          0,
        ],
      ],
    ];

    const result = partitionByMonth(input);

    expect(result).toEqual(expected);
  });

  it('groups data from the same month together', () => {
    const input: DataRow[] = [
      ['2021-09-17T14:00:00.000Z', 60, 60, 48],
      ['2021-09-18T13:00:00.000Z', 0, 0, 0],
      ['2021-10-17T13:00:00.000Z', -30, -30, -24],
    ];

    const expected: DataRow[][] = [
      [
        ['2021-09-17T14:00:00.000Z', 60, 60, 48],
        ['2021-09-18T13:00:00.000Z', 0, 0, 0],
      ],
      [['2021-10-17T13:00:00.000Z', -30, -30, -24]],
    ];

    const result = partitionByMonth(input);

    expect(result).toEqual(expected);
  });

  it('handles empty input array', () => {
    const input: DataRow[] = [];
    const expected: DataRow[][] = [];

    const result = partitionByMonth(input);

    expect(result).toEqual(expected);
  });

  it('handles data from different years', () => {
    const input: DataRow[] = [
      ['2021-12-31T23:59:59.999Z', 1, 2, 3],
      ['2022-01-01T00:00:00.000Z', 4, 5, 6],
    ];

    const expected: DataRow[][] = [
      [['2021-12-31T23:59:59.999Z', 1, 2, 3]],
      [['2022-01-01T00:00:00.000Z', 4, 5, 6]],
    ];

    const result = partitionByMonth(input);

    expect(result).toEqual(expected);
  });

  it('preserves all data in each row', () => {
    const input: DataRow[] = [
      ['2021-09-17T14:00:00.000Z', 60, 60, 48, 48, 48, 30, 30, 216, 0, 0],
    ];

    const expected: DataRow[][] = [
      [['2021-09-17T14:00:00.000Z', 60, 60, 48, 48, 48, 30, 30, 216, 0, 0]],
    ];

    const result = partitionByMonth(input);

    expect(result).toEqual(expected);
  });
});

describe('calculateColumnSums', () => {
  it('should return correct column sums for a normal matrix', () => {
    const matrix = [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ];
    expect(calculateColumnSums(matrix)).toEqual([12, 15, 18]);
  });

  it('should return an empty array for an empty matrix', () => {
    const matrix: number[][] = [];
    expect(calculateColumnSums(matrix)).toEqual([]);
  });

  it('should handle a matrix with a single row correctly', () => {
    const matrix = [[1, 2, 3]];
    expect(calculateColumnSums(matrix)).toEqual([1, 2, 3]);
  });

  it('should handle a matrix with a single column correctly', () => {
    const matrix = [[1], [2], [3]];
    expect(calculateColumnSums(matrix)).toEqual([6]);
  });

  it('should handle negative numbers correctly', () => {
    const matrix = [
      [1, -2, 3],
      [-4, 5, -6],
      [7, -8, 9],
    ];
    expect(calculateColumnSums(matrix)).toEqual([4, -5, 6]);
  });

  it('should handle a jagged matrix by summing up available columns and ignoring missing values', () => {
    const matrix = [[1, 2, 3], [4, 5], [7]];
    expect(calculateColumnSums(matrix)).toEqual([12, 7, 3]);
  });
});
