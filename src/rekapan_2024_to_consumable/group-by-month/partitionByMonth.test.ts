import { partitionByMonth } from './partitionByMonth.js';

describe('partitionByMonth', () => {
  it('partitions rows by month correctly', () => {
    const data = [
      ['Sisa Alat', 0, 0, 0],
      ['11/06/2021', 0, 400, 0],
      ['12/06/2021', 0, 375, 0],
      ['Sisa Alat', 1, 1, 1],
      ['01/07/2021', 0, 150, 0],
      ['05/07/2021', 0, 200, 0],
      ['Sisa Alat', 0, 0, 0],
    ];

    const expected = {
      '2021-05-31': [
        ['Sisa Alat', 0, 0, 0],
        ['11/06/2021', 0, 400, 0],
        ['12/06/2021', 0, 375, 0],
        ['Sisa Alat', 1, 1, 1],
      ],
      '2021-06-30': [
        ['Sisa Alat', 1, 1, 1],
        ['01/07/2021', 0, 150, 0],
        ['05/07/2021', 0, 200, 0],
        ['Sisa Alat', 0, 0, 0],
      ],
    };

    expect(partitionByMonth(data)).toEqual(expected);
  });
});
