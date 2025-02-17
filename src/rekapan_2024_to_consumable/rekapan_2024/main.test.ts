import { describe, expect, it, jest, mock } from 'bun:test';
import ExcelJS from 'exceljs';
import { getTotal } from '../addSisaSewaAlatAmount.js';
import { getColumnSums, partitionByMonth } from '../utils.js';

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

describe('addSisaSewaAlatAmount', () => {});

describe('partitionByMonth', () => {
  it('partitions data from different months', () => {
    const input: any[] = [
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

    const expected: any[][] = [
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
    const input: any[] = [
      ['2021-09-17T14:00:00.000Z', 60, 60, 48],
      ['2021-09-18T13:00:00.000Z', 0, 0, 0],
      ['2021-10-17T13:00:00.000Z', -30, -30, -24],
    ];

    const expected: any[][] = [
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
    const input: any[] = [];
    const expected: any[][] = [];

    const result = partitionByMonth(input);

    expect(result).toEqual(expected);
  });

  it('handles data from different years', () => {
    const input: any[] = [
      ['2021-12-31T23:59:59.999Z', 1, 2, 3],
      ['2022-01-01T00:00:00.000Z', 4, 5, 6],
    ];

    const expected: any[][] = [
      [['2021-12-31T23:59:59.999Z', 1, 2, 3]],
      [['2022-01-01T00:00:00.000Z', 4, 5, 6]],
    ];

    const result = partitionByMonth(input);

    expect(result).toEqual(expected);
  });

  it('preserves all data in each row', () => {
    const input: any[] = [
      ['2021-09-17T14:00:00.000Z', 60, 60, 48, 48, 48, 30, 30, 216, 0, 0],
    ];

    const expected: any[][] = [
      [['2021-09-17T14:00:00.000Z', 60, 60, 48, 48, 48, 30, 30, 216, 0, 0]],
    ];

    const result = partitionByMonth(input);

    expect(result).toEqual(expected);
  });
});

describe('getColumnSums', () => {
  it('should return correct column sums for a normal matrix', () => {
    const matrix = [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ];
    expect(getColumnSums(matrix)).toEqual([12, 15, 18]);
  });

  it('should return an empty array for an empty matrix', () => {
    const matrix: number[][] = [];
    expect(getColumnSums(matrix)).toEqual([]);
  });

  it('should handle a matrix with a single row correctly', () => {
    const matrix = [[1, 2, 3]];
    expect(getColumnSums(matrix)).toEqual([1, 2, 3]);
  });

  it('should handle a matrix with a single column correctly', () => {
    const matrix = [[1], [2], [3]];
    expect(getColumnSums(matrix)).toEqual([6]);
  });

  it('should handle negative numbers correctly', () => {
    const matrix = [
      [1, -2, 3],
      [-4, 5, -6],
      [7, -8, 9],
    ];
    expect(getColumnSums(matrix)).toEqual([4, -5, 6]);
  });

  it('should handle a jagged matrix by summing up available columns and ignoring missing values', () => {
    const matrix = [[1, 2, 3], [4, 5], [7]];
    expect(getColumnSums(matrix)).toEqual([12, 7, 3]);
  });
});

describe('getTotal', () => {
  it('should return the same totals for the first month', () => {
    const partitions: any[][] = [
      [['', 60, 60, 48, 48, 48, 30, 30, 216, 0, 0]],
      [['', 1, 1, 1, 1, 1, 1, 1, 1, 20, 1]],
    ];

    const until = 1;

    const expected = [60, 60, 48, 48, 48, 30, 30, 216, 0, 0];

    const result = getTotal({ partitions, until });

    expect(result).toEqual(expected);
  });

  it('should return the sum the full totals for the first month partition', () => {
    const partitions: any[][] = [
      [
        ['', 60, 60, 48, 48, 48, 30, 30, 216, 0, 0],
        ['', 1, 1, 1, 1, 1, 1, 1, 1, 20, 1],
        ['', 1, 1, 1, 1, 1, 1, 1, 1, 20, 1],
      ],
    ];

    const until = 1;

    const expected = [62, 62, 50, 50, 50, 32, 32, 218, 40, 2];

    const result = getTotal({ partitions, until });

    expect(result).toEqual(expected);
  });

  it('should return the sum the full totals for the first month partition', () => {
    const partitions: any[][] = [
      [
        ['', 60, 60, 48, 48, 48, 30, 30, 216, 0, 0],
        ['', 1, 1, 1, 1, 1, 1, 1, 1, 20, 1],
        ['', 1, 1, 1, 1, 1, 1, 1, 1, 20, 1],
      ],
    ];

    const until = 1;

    const expected = [62, 62, 50, 50, 50, 32, 32, 218, 40, 2];

    const result = getTotal({ partitions, until });

    expect(result).toEqual(expected);
  });

  it('should return the cumulative sum of the full totals from before the selected partition', () => {
    const partitions: any[][] = [
      [
        ['', 60, 60, 48, 48, 48, 30, 30, 216, 0, 0],
        ['', 1, 1, 1, 1, 1, 1, 1, 1, 20, 1],
        ['', 1, 1, 1, 1, 1, 1, 1, 1, 20, 1],
      ],
      [
        ['', 60, 60, 48, 48, 48, 30, 30, 216, 0, 0],
        ['', 1, 1, 1, 1, 1, 1, 1, 1, 20, 1],
        ['', 1, 1, 1, 1, 1, 1, 1, 1, 20, 1],
      ],
      [
        ['', 60, 60, 48, 48, 48, 30, 30, 216, 0, 0],
        ['', 1, 1, 1, 1, 1, 1, 1, 1, 20, 1],
        ['', 1, 1, 1, 1, 1, 1, 1, 1, 20, 1],
      ],
    ];

    const until = 3;

    const expected = [186, 186, 150, 150, 150, 96, 96, 654, 120, 6];

    const result = getTotal({ partitions, until });

    expect(result).toEqual(expected);
  });
});
