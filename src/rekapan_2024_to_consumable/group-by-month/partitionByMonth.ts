import { Row } from '../types.js';
import { Partitioned } from './groupByMonth.js';

export function partitionByMonth(data: Row[]): Partitioned {
  const result = {};
  let currentMonth = null;
  let currentMonthData = [];
  let lastSisaAlat = null;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];

    if (row[0] === 'Sisa Alat') {
      lastSisaAlat = row;
      if (currentMonth) {
        currentMonthData.push(row);
      }
      continue;
    }

    const tglCell = row[0] as string;

    const [day, month, year] = tglCell.split('/').map(Number);
    const date = new Date(year, month - 1, day);
    const monthKey = `${year}-${String(month - 1).padStart(2, '0')}-${new Date(
      year,
      month - 1,
      0,
    ).getDate()}`;

    if (monthKey !== currentMonth) {
      if (currentMonth) {
        result[currentMonth] = currentMonthData;
      }
      currentMonth = monthKey;
      currentMonthData = lastSisaAlat ? [lastSisaAlat] : [];
    }

    currentMonthData.push(row);
  }

  if (currentMonth) {
    result[currentMonth] = currentMonthData;
  }

  return result;
}
