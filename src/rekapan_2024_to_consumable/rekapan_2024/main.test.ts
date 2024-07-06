import { describe, expect, it, jest, mock } from 'bun:test';
import ExcelJS from 'exceljs';
import {
  populateHeader,
  runSingleWorksheetLogic,
} from '../addSisaSewaAlatAmount.js';

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
  it('should add the rows as expected', () => {
    const mockWorksheet = createMockSheet([
      createMockRow([createMockCell('Placeholder First Row Empty')]),
      createMockHeaderRow(['CB 220', 'JB 60', 'UH 40']),
      createMockValueRow([0, 0, 0]),
    ]);
    const newRows = runSingleWorksheetLogic(mockWorksheet);

    expect(newRows).toEqual([
      ['TGL', 'CB 220', 'JB 60', 'UH 40'],
      ['Sisa Alat', 0, 0, 0],
      ['01/01/2024', 0, 0, 0],
      ['Sisa Alat', 0, 0, 0],
    ]);
  });

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
