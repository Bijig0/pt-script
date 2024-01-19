import { parse } from 'csv-parse';
import * as fs from "fs";
import * as path from "path";

type WorldCity = {
  name: string;
  country: string;
  subCountry: string;
  geoNameId: number;
};

const __dirname = new URL('.', import.meta.url).pathname;


(async () => {
  const csvFilePath = path.resolve(__dirname, 'output.csv');

  const headers = ['tanggal', 'companyName', 'masuk', 'keluar'];

  const fileContent = fs.readFileSync(csvFilePath, { encoding: 'utf-8' });

  const records: WorldCity[] = []

  const parser = parse(fileContent, {
    delimiter: ',',
    columns: headers,
    skipEmptyLines: true,
  });


  for await (const record of parser) {
    // Work with each record
    records.push(record);
  }

  console.log(records)
  return records;
})();

