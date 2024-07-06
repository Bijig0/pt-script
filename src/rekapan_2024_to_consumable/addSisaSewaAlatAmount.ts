import { format, getMonth } from 'date-fns';
import ExcelJS from 'exceljs';
import { z } from 'zod';
import {
  removeSecondColumn,
  standardizeDates,
  truncateWorksheetRows,
} from './main.js';
import { coerceToDate, getCellValue } from './utils.js';

const badStuff = [];
const TGL_COLUMN_INDEX = 1;
const VALUE_COLUMN_INDEX = 2;

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

export const runSingleWorksheetLogic = (
  worksheet: ExcelJS.Worksheet,
): (string | number)[][] => {
  let newRows: (string | number)[][] = [];

  let companyNameByColumnIndex = {} as Record<string, number>;
  let columnIndexByCompanyName = {} as Record<number, string>;

  const companyNames = {} as Record<string, Data>;

  worksheet.eachRow((row, rowNumber) => {
    console.log({ row, rowNumber });
    if (rowNumber === 1) {
      const {
        newRows: _newRows,
        companyNameByColumnIndex: _companyNameByColumnIndex,
        columnIndexByCompanyName: _columnIndexByCompanyName,
      } = populateHeader(row);
      newRows = _newRows;
      companyNameByColumnIndex = _companyNameByColumnIndex;
      columnIndexByCompanyName = _columnIndexByCompanyName;
      return;
    }

    const dateSchema = z.date().or(z.string().or(z.object({})).nullable());
    const unParsedRowTgl = getCellValue(row, TGL_COLUMN_INDEX);
    console.log({ unParsedRowTgl, name: worksheet.name });
    const uncoercedDateResult = dateSchema.safeParse(unParsedRowTgl);
    const uncoercedDate = uncoercedDateResult.success
      ? uncoercedDateResult.data
      : null;
    const { value: date, error } = coerceToDate(uncoercedDate);
    if (error) return;
    if (date === null) return;

    const columnValueIndexes = Object.values(
      companyNameByColumnIndex,
    ) as number[];

    const rowValues = row.values as ExcelJS.CellValue[];
    const rowValuesWithoutHeader = rowValues.slice(1);
    const withIndexes = rowValuesWithoutHeader.map((value, index) => ({
      value,
      index,
    }));
    const rowValuesAtColumnIndexes = withIndexes.filter((value) =>
      columnValueIndexes.includes(value.index),
    );

    const month = getMonth(date);

    let currentMonth: string | null = null;

    const runningTotalLogic = () => {
      console.log(row.values);
      console.log({ rowValuesWithoutHeader });
      console.log({ rowValuesAtColumnIndexes });
      for (const cell of rowValuesAtColumnIndexes) {
        const { value, index } = cell;
        console.log({ value, name: worksheet.name });
        const parsedValue = typeof value !== 'number' ? 0 : value;
        const companyName = z.string().parse(columnIndexByCompanyName[index]);
        const monthString = z.string().parse(indexToMonth[month]);

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
          currentMonth = monthString;
        }

        const runningTotal = getRunningTotal(companyNames, companyName);

        const valueToAdd = parsedValue + runningTotal;

        if (monthString in companyNames[companyName].dateDatas) {
          companyNames[companyName].dateDatas[monthString].monthTotal +=
            valueToAdd;

          currentMonth = monthString;
        }

        const monthChanged = monthString !== currentMonth;

        if (monthChanged) {
          const prevMonth = currentMonth;
          newRows.push([`${indexToMonth[prevMonth]} ${runningTotal}`]);
          currentMonth = monthString;
        }

        newRows.push([format(date, 'dd/MM/yyyy'), valueToAdd]);

        console.dir({ companyNames }, { depth: null });
      }
    };

    runningTotalLogic();
  });

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
