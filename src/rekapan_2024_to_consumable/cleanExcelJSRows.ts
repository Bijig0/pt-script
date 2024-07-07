import { Row } from './types.js';

export const cleanExcelJSRows = (rows: Row[]): Row[] => {
  return rows.map((row) => row.slice(1));
};
