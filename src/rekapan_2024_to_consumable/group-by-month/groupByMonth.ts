import ExcelJS from 'exceljs';
import * as R from 'fp-ts/Record';
import { pipe } from 'fp-ts/lib/function.js';
import { getRows } from '../getRows.js';
import { Row } from '../types.js';
import { partitionByMonth } from './partitionByMonth.js';

type DateRange = string & {};

type CompanyName = string & {};

type Workbooks = Record<DateRange, Record<CompanyName, Row[]>>;

export type Partitioned = Record<DateRange, Row[]>;

const annotateWithWorksheetName = (
  partitioned: Partitioned,
  worksheetName: string,
) => {
  return pipe(
    partitioned,
    R.map((rows) => ({
      rows,
      worksheetName,
    })),
  );
};

export const groupByMonth = (workbook: ExcelJS.Workbook): ExcelJS.Workbook => {
  const workbooks: Workbooks = {};
  workbook.eachSheet((worksheet) => {
    const worksheetRows = getRows(worksheet);
    const worksheetRowsWithoutHeader = worksheetRows.slice(1);
    const partitionedRows = partitionByMonth(worksheetRowsWithoutHeader);
    const annotatedWithWorksheetName = annotateWithWorksheetName(
      partitionedRows,
      worksheet.name,
    );
    for (const [month, data] of Object.entries(annotatedWithWorksheetName)) {
      if (!(month in workbooks)) {
        workbooks[month] = {};
      }

      workbooks[month][worksheet.name] = data.rows;
    }
  });

  return workbook;
};
