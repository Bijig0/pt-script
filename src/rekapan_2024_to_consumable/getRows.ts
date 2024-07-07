import ExcelJS from 'exceljs';
import { Row } from './types.js';

const checkIfRowIsEmpty = (row: ExcelJS.Row) => {
  const rowValues = row.values as ExcelJS.CellValue[];
  return rowValues.length !== 1;
};

const checkIfRowShouldBePushed = (row: ExcelJS.Row) => {
  return checkIfRowIsEmpty(row);
};

export const getRows = (worksheet: ExcelJS.Worksheet): Row[] => {
  const rows: Row[] = [];

  worksheet.eachRow((row) => {
    console.log(row.values);
    console.log({ length: row.values.length });
    const rowHasValues = checkIfRowShouldBePushed(row);
    console.log({ rowHasValues });
    if (!rowHasValues) return;
    // @ts-ignore
    rows.push(row.values);
  });

  return rows;
};

