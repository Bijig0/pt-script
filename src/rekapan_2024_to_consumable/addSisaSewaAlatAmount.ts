import ExcelJS from 'exceljs';
import { z } from 'zod';
import {
  removeSecondColumn,
  standardizeDates,
  truncateWorksheetRows,
} from './main.js';
import {
  coerceToDate,
  createArray,
  getColumnSums,
  partitionByMonth,
} from './utils.js';

const badStuff = [];
const TGL_COLUMN_INDEX = 0;

type Data = {
  dateDatas: {
    [date: string]: {
      monthTotal: number;
    };
  };
};

type NewRows = (string | number)[][];

type HeaderReturn = {
  newRows: NewRows;
  companyNameByColumnIndex: Record<string, number>;
  columnIndexByCompanyName: Record<number, string>;
};

export const populateHeader = (row: ExcelJS.Row): HeaderReturn => {
  const stringArraySchema = z.array(z.string().optional());
  const headerRow = stringArraySchema.parse(row.values);
  const headerRowStrings = headerRow.filter((value) => Boolean(value));
  // TGL is in the first column
  const headerRowAlatNames = headerRowStrings;
  const newRows: NewRows = [];
  console.log(headerRowAlatNames);

  const companyNameByColumnIndex = {} as Record<string, number>;
  const columnIndexByCompanyName = {} as Record<number, string>;

  const initialize = () => {
    headerRowAlatNames.forEach((alatName, index) => {
      columnIndexByCompanyName[index + 1] = alatName;
      companyNameByColumnIndex[alatName] = index + 1;
    });
  };

  const addHeaderRows = () => {
    newRows.push(['TGL', ...headerRowAlatNames]);
    const length = headerRowAlatNames.length + 1;
    const arr = Array.from({ length }, (_, i) => i + 1);
    newRows.push(arr.map((_, index) => (index === 0 ? 'Sisa Alat' : 0)));
  };

  initialize();
  addHeaderRows();

  return { newRows, companyNameByColumnIndex, columnIndexByCompanyName };

  // console.log({ headerRow });
};

export const getDateFromCellValue = (unparsedDate: ExcelJS.CellValue) => {
  const dateSchema = z.date().or(z.string().or(z.object({})).nullable());
  const uncoercedDateResult = dateSchema.safeParse(unparsedDate);
  const uncoercedDate = uncoercedDateResult.success
    ? uncoercedDateResult.data
    : null;
  const { value: date, error } = coerceToDate(uncoercedDate);

  return { date, error };
};

const checkIfRowIsEmpty = (row: ExcelJS.Row) => {
  const rowValues = row.values as ExcelJS.CellValue[];
  return rowValues.length !== 1;
};

const checkIfRowShouldBePushed = (row: ExcelJS.Row) => {
  return checkIfRowIsEmpty(row);
};

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

type Row = (string | number)[];

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

  const slicedRows = rows.map((row) => row.slice(1));

  console.log({ slicedRows });

  const recordRows = slicedRows.slice(1);

  console.log({ recordRows });

  const normalizedRecordRows = recordRows.map((row) => {
    return sliceAndFill(row, headerLength, undefined);
  });

  console.log({ normalizedRecordRows });

  const undefinedAs0 = normalizedRecordRows.map((row) => {
    return [...row].map((value) => (typeof value === 'undefined' ? 0 : value));
  });

  console.log({ undefinedAs0 });

  const dateAsDateObject = undefinedAs0.map((row) => {
    const dateString = row[TGL_COLUMN_INDEX] as string | Date;
    const { value: date, error } = coerceToDate(dateString);
    return [date, ...row.slice(1)];
  });

  console.log({ dateAsDateObject });

  const partititionedData = partitionByMonth(dateAsDateObject);

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
      const createdArray = createArray(rowLength - 1, 0);
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

  // Clear the worksheet and add the new rows

  return flattened;
};

const getRows = (worksheet: ExcelJS.Worksheet): Row[] => {
  const rows: Row[] = [];

  worksheet.eachRow((row, rowNumber) => {
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

export const writeRowsToWorksheet = (
  rows: Row[],
  worksheet: ExcelJS.Worksheet,
) => {
  worksheet.spliceRows(1, worksheet.rowCount);
  worksheet.addRows(rows);
};

export function addSisaSewaAlatAmount(
  workbook: ExcelJS.Workbook,
): ExcelJS.Workbook {
  workbook.eachSheet((worksheet) => {
    const worksheetRows = getRows(worksheet);

    const annotatedRows = runSingleWorksheetLogic(worksheetRows);

    writeRowsToWorksheet(annotatedRows, worksheet);
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

  //   standardizedWorkbook.xlsx.writeFile(outFilePath);
}

main();
