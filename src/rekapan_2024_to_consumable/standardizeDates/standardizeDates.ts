import ExcelJS from 'exceljs';
import { recreateWorksheetWithNewRows } from '../addSisaSewaAlatAmount.js';
import { cleanExcelJSRows } from '../cleanExcelJSRows.js';
import { getRows } from '../getRows.js';
import { Row } from '../types.js';
import { coerceToDate, swapDayAndMonth } from '../utils.js';

const TGL_COLUMN_INDEX = 0;

export const standardizeDatesRows = (rows: Row[]): Row[] => {
  const rowsWithoutTGLHeader = rows.slice(1);

  const r = rowsWithoutTGLHeader.map((row) => {
    const tglCell = row[TGL_COLUMN_INDEX];
    if (!(tglCell instanceof Date)) return row;
    // Doing this because exceljs automatically consumes dates as dd/mm/yyyy format
    const dayAndMonthSwapped = swapDayAndMonth(tglCell);
    return [dayAndMonthSwapped, ...row.slice(1)];
  });

  const dateStringsAsDates = r.map((row) => {
    const tglCell = row[TGL_COLUMN_INDEX];
    if (tglCell instanceof Date) return row;
    const dateString = tglCell as string;
    const { value: date } = coerceToDate(dateString);
    return [date, ...row.slice(1)];
  });

  const withTGLHeader = [rows[0], ...dateStringsAsDates];

  return withTGLHeader;
};

export function standardizeDates(workbook: ExcelJS.Workbook): ExcelJS.Workbook {
  workbook.eachSheet((worksheet, index) => {
    // Find the TGL column

    if (worksheet.name !== 'TARSIM') return;

    const worksheetRows = getRows(worksheet);

    const cleanedExcelJSRows = cleanExcelJSRows(worksheetRows);

    // console.log({ cleanedExcelJSRows });

    const standardizedRows = standardizeDatesRows(cleanedExcelJSRows);

    console.log({ standardizedRows });

    recreateWorksheetWithNewRows(standardizedRows, worksheet, workbook);
  });

  return workbook;
}
