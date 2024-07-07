import { standardizeDatesRows } from './standardizeDates.js';

describe('standardizeDates', () => {
  it('should leave the TGL cells alone if they are all dates and sorted', () => {
    const rows = [
      ['TGL', 'CB 220'],
      [new Date('2024-01-01'), 0],
      [new Date('2024-01-02'), 0],
      [new Date('2024-01-03'), 0],
    ];

    const result = standardizeDatesRows(rows);

    expect(result).toEqual(rows);
  });

  it('should leave the TGL cells alone if they are all dateStrings and sorted', () => {
    const rows = [
      ['TGL', 'CB 220'],
      ['05/09/2024', 0],
      ['06/09/2024', 0],
    ];

    const result = standardizeDatesRows(rows);

    expect(result).toEqual(rows);
  });

  it('should swap the day and month for a date is the date before it in the worksheet is after it in terms of date', () => {
    const rows = [
      ['TGL', 'CB 220'],
      ['05/09/2024', 0],
      ['10/06/2024', 0],
    ];

    const result = standardizeDatesRows(rows);

    const expected = [
      ['TGL', 'CB 220'],
      [new Date('2024-09-05'), 0],
      [new Date('2024-10-06'), 0],
    ];

    expect(result).toEqual(expected);
  });
});
