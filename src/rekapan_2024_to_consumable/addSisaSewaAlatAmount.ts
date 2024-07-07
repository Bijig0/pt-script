import ExcelJS from 'exceljs';
import { z } from 'zod';
import { getRows } from './getRows.js';
import { removeSecondColumn, truncateWorksheetRows } from './main.js';
import { standardizeDates } from './standardizeDates/standardizeDates.js';
import { Row } from './types.js';
import {
  assert,
  coerceToDate,
  createArray,
  formatDateToDDMMYYYY,
  getColumnSums,
  isRegularMatrix,
  partitionByMonth,
} from './utils.js';

const TGL_COLUMN_INDEX = 0;

function sliceAndFill<T>(arr: T[], endIndex: number, fillValue: T): T[] {
  // Slice the array until the specified index (exclusive)
  const slicedArray = arr.slice(0, endIndex);

  // If the length of the sliced array is less than the minimum length,
  // fill it with the specified value until it reaches the minimum length
  while (slicedArray.length < endIndex) {
    slicedArray.push(fillValue);
  }

  return slicedArray;
}

const getPartitionTotal = (partition: Row[]) => {
  const numberPartitionSchema = z.array(z.number());
  const valuesOnly = partition.map((row) =>
    numberPartitionSchema.parse(row.slice(1)),
  );
  const columnSums = getColumnSums(valuesOnly);
  const annotated = [...columnSums];
  return annotated;
};

/**
 * The calculation goes month 1's total is the sum of all previous months
 * So in here, we get the until, which is the index of the current month
 * and then get the totals for the months before that
 * to become the totals for the current month
 */
export const getTotal = ({
  partitions,
  until,
}: {
  partitions: Row[][];
  until: number;
}) => {
  const partitionsTotals = partitions.slice(0, until).map(getPartitionTotal);
  const totals = getColumnSums(partitionsTotals);
  return totals;
};

export const runSingleWorksheetLogic = (rows: Row[]): Row[] => {
  const headerLength = rows[0].length;

  console.log({ headerLength });

  console.log({ rows });

  const slicedRows = rows.map((row) => row.slice(1));

  console.log({ slicedRows });

  const nonHeaderRows = slicedRows.slice(1);

  const emptyItemsToUndefinedNonHeaderRows = nonHeaderRows.map((row) => {
    return [...row];
  });

  console.log({ nonHeaderRows });

  const recordRows = emptyItemsToUndefinedNonHeaderRows.filter((row) => {
    return (
      coerceToDate(row[0]).value !== undefined &&
      coerceToDate(row[0]).value !== null
    );
  });

  console.log({ recordRows });

  const normalizedRecordRows = recordRows.map((row) => {
    return sliceAndFill(row, headerLength - 1, undefined);
  });

  const allNumbersRecordRows = normalizedRecordRows.map((row) => {
    return row.map((value, index) => {
      if (typeof value === 'number') return value;
      if (typeof value !== 'number' && index === TGL_COLUMN_INDEX) return value;
      return 0;
    });
  });

  console.log({ normalizedRecordRows });

  const undefinedAs0 = allNumbersRecordRows.map((row) => {
    return [...row].map((value) => (typeof value === 'undefined' ? 0 : value));
  });

  console.log({ undefinedAs0 });

  const dateAsDateObject = undefinedAs0.map((row) => {
    const dateString = row[TGL_COLUMN_INDEX] as string | Date | number;
    const { value: date } = coerceToDate(dateString);
    return [date, ...row.slice(1)];
  });

  console.log({ dateAsDateObject });

  const dateAsFormattedDateString = dateAsDateObject.map((row) => {
    const date = row[TGL_COLUMN_INDEX] as Date;
    return [formatDateToDDMMYYYY(date), ...row.slice(1)];
  });

  const partititionedData = partitionByMonth(dateAsFormattedDateString);

  console.log({ partititionedData });

  const addTotals = (partitionedData: Row[][]) => {
    const withFullTotals = partitionedData.map(
      (currentMonthPartition, index) => {
        const until = index + 1;
        const total = getTotal({ partitions: partitionedData, until });
        const totalAnnoated = ['Sisa Alat', ...total];
        return [...currentMonthPartition, totalAnnoated];
      },
    );

    return withFullTotals;
  };

  const withTotals = addTotals(partititionedData);

  const addInitialSisaAlatRow = (partitionedData: Row[][]) => {
    // [0] is just an arbitrary row since all the lengths are uniform
    const rowLength = rows[0].length;
    const withInitialSisaAlatRow = partitionedData.map((partition, index) => {
      if (index !== 0) return partition;
      console.log({ rowLength });
      const createdArray = createArray(rowLength - 2, 0);
      console.log({ createdArray });
      const initialSisaAlatRow = ['Sisa Alat', ...createdArray];

      return [initialSisaAlatRow, ...partition];
    });
    return withInitialSisaAlatRow;
  };

  const addHeader = (partitioneddata: Row[][]) => {
    const header = rows[0].slice(1);
    const withHeader = partitioneddata.map((partition, index) => {
      if (index !== 0) return partition;
      return [header, ...partition];
    });
    return withHeader;
  };

  const withInitialSisaAlatRow = addInitialSisaAlatRow(withTotals);

  const withHeader = addHeader(withInitialSisaAlatRow);

  console.log({ withHeader });

  const flattened = withHeader.flat();

  console.log({ flattened });

  assert(isRegularMatrix(flattened), 'Not uniform regular matrix');

  // Clear the worksheet and add the new rows

  return flattened;
};

export const recreateWorksheetWithNewRows = (
  rows: Row[],
  worksheet: ExcelJS.Worksheet,
  workbook: ExcelJS.Workbook,
) => {
  workbook.removeWorksheet(worksheet.id);
  const newWorksheet = workbook.addWorksheet(worksheet.name);
  newWorksheet.addRows(rows);
};

export function addSisaSewaAlatAmount(
  workbook: ExcelJS.Workbook,
): ExcelJS.Workbook {
  workbook.eachSheet((worksheet) => {
    // if (worksheet.name !== 'BPK ROBI ONE TOWER') return;

    if (worksheet.name !== 'TARSIM') return;

    const worksheetRows = getRows(worksheet);

    const annotatedRows = runSingleWorksheetLogic(worksheetRows);

    recreateWorksheetWithNewRows(annotatedRows, worksheet, workbook);
  });

  return workbook;
}

async function main() {
  const __dirname = new URL('.', import.meta.url).pathname;

  const inFilePath = `${__dirname}rekapan_2024/REKAPAN PPA PER PROYEK 2024.xlsx`;
  const outFilePath = `${__dirname}out/rekapan_2024_truncated.xlsx`;

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(inFilePath);
  const truncatedWorkbook = await truncateWorksheetRows(workbook);
  const secondColumnRemovedWorkbook =
    await removeSecondColumn(truncatedWorkbook);

  console.log('Starting standardize dates');

  const standardizedWorkbook = standardizeDates(secondColumnRemovedWorkbook);

  const processedWorkbook = addSisaSewaAlatAmount(standardizedWorkbook);

  processedWorkbook.xlsx.writeFile(outFilePath);
}

// main();
