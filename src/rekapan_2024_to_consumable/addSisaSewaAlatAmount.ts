import { format } from 'date-fns';
import ExcelJS from 'exceljs';
import { z } from 'zod';
import {
  removeSecondColumn,
  standardizeDates,
  truncateWorksheetRows,
} from './main.js';
import { coerceToDate, getColumnSums, partitionByMonth, zip } from './utils.js';

const badStuff = [];
const TGL_COLUMN_INDEX = 0;
const VALUE_COLUMN_INDEX = 1;

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

export const getRunningTotal = (
  companyNames: Record<string, Data>,
  companyName: string,
) => {
  let runningTotal: number = 0;
  const selectedCompanyName = companyNames[companyName];

  const data = selectedCompanyName.dateDatas;
  console.log({ data });
  Object.values(data).forEach(({ monthTotal }) => {
    console.log({ monthTotal });
    runningTotal += monthTotal;
  });

  console.log({ runningTotal });
  return runningTotal;
};

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

type RunningTotalLogicArgs = {
  row: {
    value: ExcelJS.CellValue;
    index: number;
  }[];
  month: number;
  companyNames: Record<string, Data>;
  columnIndexByCompanyName: Record<number, string>;
  currentMonth: string | null;
  date: Date;
};

type RunningTotalLogicReturn = {
  newRows: NewRows;
};

/**
 *
 * @param args
 * @returns
 */
const runningTotalLogic = (
  args: RunningTotalLogicArgs,
): RunningTotalLogicReturn => {
  const {
    row,
    month,
    companyNames,
    columnIndexByCompanyName,
    currentMonth,
    date,
  } = args;
  for (const cell of row) {
    const { value, index } = cell;
    // console.log({ value, name: worksheet.name });
    const parsedValue = typeof value !== 'number' ? 0 : value;
    const companyName = z.string().parse(columnIndexByCompanyName[index]);
    const monthString = z.string().parse(indexToMonth[month]);

    const newRows: NewRows = [];

    // initialize
    if (!(companyName in companyNames)) {
      companyNames[companyName] = {
        dateDatas: {
          [monthString]: {
            monthTotal: 0,
          },
        },
      };
    }

    if (currentMonth === null) {
      // currentMonth = monthString;
    }

    const runningTotal = getRunningTotal(companyNames, companyName);

    const valueToAdd = parsedValue + runningTotal;

    if (monthString in companyNames[companyName].dateDatas) {
      companyNames[companyName].dateDatas[monthString].monthTotal += valueToAdd;

      // currentMonth = monthString;
    }

    const monthChanged = monthString !== currentMonth;

    if (monthChanged) {
      const prevMonth = currentMonth;
      newRows.push([`${indexToMonth[prevMonth]} ${runningTotal}`]);
      // currentMonth = monthString;
    }

    newRows.push([format(date, 'dd/MM/yyyy'), valueToAdd]);

    return { newRows };

    console.dir({ companyNames }, { depth: null });
  }
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

const transformRowValues = (
  row: ExcelJS.Row,
  companyNameByColumnIndex: Record<string, number>,
) => {
  const rowValues = row.values as ExcelJS.CellValue[];
  const rowValuesWithoutHeader = rowValues.slice(1);
  const withIndexes = rowValuesWithoutHeader.map((value, index) => ({
    value,
    index,
  }));
  const columnValueIndexes = Object.values(
    companyNameByColumnIndex,
  ) as number[];

  const rowValuesAtColumnIndexes = withIndexes.filter((value) =>
    columnValueIndexes.includes(value.index),
  );
  return rowValuesAtColumnIndexes;
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

export const getTotal = ({
  currentMonthPartition,
  prevMonthPartition,
}: {
  currentMonthPartition: Row[];
  prevMonthPartition: Row[];
}) => {
  const partitionTotal = getPartitionTotal(currentMonthPartition);
  console.log({ partitionTotal });
  const prevMonthTotal = getPartitionTotal(prevMonthPartition);
  console.log({ prevMonthTotal });
  const summed = getColumnSums([partitionTotal, prevMonthTotal]);
  console.log({ summed });
  return summed;
};

export const runSingleWorksheetLogic = (
  worksheet: ExcelJS.Worksheet,
): (string | number)[][] => {
  let newRows: (string | number)[][] = [];

  const rows: NewRows = [];

  worksheet.eachRow((row, rowNumber) => {
    console.log(row.values);
    console.log({ length: row.values.length });
    const rowHasValues = checkIfRowShouldBePushed(row);
    console.log({ rowHasValues });
    if (!rowHasValues) return;
    // @ts-ignore
    rows.push(row.values);
  });

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
    const oneBackedupPartitionedData = [undefined, ...partitionedData];

    const withFullTotals = zip(oneBackedupPartitionedData, partitionedData).map(
      ([prevMonthPartition, currentMonthPartition]) => {
        // Only for the first month where there is no previous monthj to get additional running total data from
        if (prevMonthPartition === undefined) {
          const total = getPartitionTotal(currentMonthPartition);
          const totalAnnoated = ['Sisa Alat', ...total];
          return [...currentMonthPartition, totalAnnoated];
        } else {
          const total = getTotal({ currentMonthPartition, prevMonthPartition });
          const totalAnnoated = ['Sisa Alat', ...total];
          return [...currentMonthPartition, totalAnnoated];
        }
      },
    );

    return withFullTotals;
  };

  const withTotals = addTotals(partititionedData);

  console.log({ withTotals });

  // worksheet.eachRow((row, rowNumber) => {
  //   console.log({ row, rowNumber });
  //   if (rowNumber === 1) {
  //     const {
  //       newRows: _newRows,
  //       companyNameByColumnIndex: _companyNameByColumnIndex,
  //       columnIndexByCompanyName: _columnIndexByCompanyName,
  //     } = populateHeader(row);
  //     newRows = _newRows;
  //     companyNameByColumnIndex = _companyNameByColumnIndex;
  //     columnIndexByCompanyName = _columnIndexByCompanyName;
  //     return;
  //   }

  //   const unParsedRowTgl = getCellValue(row, TGL_COLUMN_INDEX);
  //   const { date, error } = getDateFromCellValue(unParsedRowTgl);

  //   if (error) return;
  //   if (date === null) return;

  //   const transformedRowValues = transformRowValues(
  //     row,
  //     companyNameByColumnIndex,
  //   );

  //   const month = getMonth(date);

  //   let currentMonth: string | null = null;

  //   runningTotalLogic({
  //     row: transformedRowValues,
  //     month,
  //     companyNames,
  //     columnIndexByCompanyName,
  //     currentMonth,
  //     date,
  //   });
  // });

  // Add the last month's total

  // if (currentMonth !== null) {
  //   runningTotal += monthTotal;
  //   newRows.push([`${monthNames[currentMonth]} ${runningTotal}`]);
  // }

  // Clear the worksheet and add the new rows
  worksheet.spliceRows(1, worksheet.rowCount);
  worksheet.addRows(newRows);

  console.log(JSON.stringify(newRows, null, 2));

  return newRows;
};

export function addSisaSewaAlatAmount(
  workbook: ExcelJS.Workbook,
): ExcelJS.Workbook {
  const selectedWorksheet = workbook.worksheets[3];

  runSingleWorksheetLogic(selectedWorksheet);

  //   workbook.eachSheet((worksheet) => {
  //     runSingleWorksheetLogic(worksheet);
  //   });

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
