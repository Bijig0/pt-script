import { parse } from 'csv-parse';
import * as fs from "fs";
import * as path from "path";
import { z } from 'zod';

const __dirname = new URL('.', import.meta.url).pathname;


(async () => {
  const csvFilePath = path.resolve(__dirname, 'output.csv');

  const headers = ['tanggal', 'companyName', 'masuk', 'keluar'];

  const fileContent = fs.readFileSync(csvFilePath, { encoding: 'utf-8' });

  const records: DataSchema = []

  const parser = parse(fileContent, {
    delimiter: ',',
    columns: headers,
    skipEmptyLines: true,
  });

  const rowSchema = z.object({
    tanggal: z.coerce.date(),
    companyName: z.string(),
    masuk: z.coerce.number(),
    keluar: z.coerce.number(),
  })

  type RowSchema = z.infer<typeof rowSchema>

  const dataSchema = z.array(rowSchema)

  type DataSchema = z.infer<typeof dataSchema>

  const parsedData = dataSchema.parse(records)


  for await (const record of parsedData) {
    // Work with each record
    

    records.push(record);
  }

  console.log(records)
  return records;
})();

