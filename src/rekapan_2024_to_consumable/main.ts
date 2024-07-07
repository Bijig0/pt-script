import ExcelJS from 'exceljs';
import { addSisaSewaAlatAmount } from './addSisaSewaAlatAmount.js';
import { standardizeDates } from './standardizeDates/standardizeDates.js';

export async function truncateWorksheetRows(
  workbook: ExcelJS.Workbook,
): Promise<ExcelJS.Workbook> {
  try {
    98;
    // Load the workbook

    // Iterate through all worksheets
    workbook.eachSheet((worksheet) => {
      let rowToKeep = 1;

      // Find the first row containing 'tgl' in the first column
      for (let row = 1; row <= worksheet.rowCount; row++) {
        const cell = worksheet.getCell(row, 1);
        if (cell.text.toLowerCase() === 'tgl') {
          rowToKeep = row;
          break;
        }
      }

      // If 'tgl' is found, remove all rows above it
      if (rowToKeep > 1) {
        worksheet.spliceRows(1, rowToKeep - 1);
        console.log(
          `Removed ${rowToKeep - 1} rows from worksheet "${worksheet.name}".`,
        );
      } else {
        console.log(
          `No 'tgl' found in the first column of worksheet "${worksheet.name}". No rows removed.`,
        );
      }
    });

    // Save the modified workbook
    console.log('Workbook processing completed successfully.');
    return workbook;
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

export function removeSecondColumn(
  workbook: ExcelJS.Workbook,
): ExcelJS.Workbook {
  // Iterate through all worksheets
  workbook.eachSheet((worksheet) => {
    // Check if the worksheet has at least 2 columns
    if (worksheet.columnCount >= 2) {
      // Remove the second column (index 2 in ExcelJS)
      worksheet.spliceColumns(2, 1);
      console.log(`Removed second column from worksheet "${worksheet.name}".`);
    } else {
      console.log(
        `Worksheet "${worksheet.name}" has fewer than 2 columns. Skipping.`,
      );
    }
  });

  // Return the modified workbook
  return workbook;
}

// Example usage remains the same as in the previous example
// Example usage remains the same as in the previous example

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

  // const groupedWorkbook = groupByMonth(processedWorkbook);

  // console.log({ groupedWorkbook });

  // processedWorkbook.xlsx.writeFile(outFilePath);
}

main();

['empty item', '24/4/2024', -30, -24, -24, -16, -7, -30, -18, -40, -10];
