import { createClient } from "@supabase/supabase-js";
import { parse } from 'csv-parse';
import * as fs from "fs";
import { readdir } from 'node:fs/promises';
import * as path from "path";
import { z } from 'zod';
const __dirname = new URL('.', import.meta.url).pathname;


// Create a single supabase client for interacting with your database

function parseAndSetYear(dateString: string): Date {
  const [day, month] = dateString.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthNumber = months.indexOf(month) + 1; // Months in JavaScript are 0-indexed

  return new Date(2023, monthNumber - 1, Number(day));
}

const SUPABASE_URL = "https://lkxwausyseuiizopsrwi.supabase.co";

const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxreHdhdXN5c2V1aWl6b3BzcndpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDQ2Nzg0MDQsImV4cCI6MjAyMDI1NDQwNH0.qRzHq2F1qqky8Q-CoFdkr6VBFm48ra3aRo6oZu4vvnQ"

export const supabase = createClient(SUPABASE_URL, ANON_KEY);

(async () => {

  const alatFilesPath = __dirname + "/alat_files"

  const alatFiles = await readdir(alatFilesPath)

  for await (const alatFile of alatFiles) {
    const alatFilePath = path.resolve(__dirname, "alat_files", alatFile)

  }


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
    tanggal: z.string().transform((date) => parseAndSetYear(date)),
    companyName: z.string(),
    masuk: z.coerce.number(),
    keluar: z.coerce.number(),
  })

  type RowSchema = z.infer<typeof rowSchema>

  const dataSchema = z.array(rowSchema)

  type DataSchema = z.infer<typeof dataSchema>

  console.log({parser})


  const alatName = "MF 190"




  for await (const record of parser) {
    // Work with each record

    records.push(record);
  }

  const parsedData = dataSchema.parse(records)


  for await (const record of parsedData) {
        console.log({record})
    const { data, error } = await supabase.from("company").insert({ name: record.companyName })

    console.log({data, error})

    const { data: secondData, error: secondError } = await supabase.from("record").insert({ company_name: record.companyName, tanggal: record.tanggal, masuk: record.masuk, keluar: record.keluar, alat_name: alatName })

    console.log({secondData, secondError})
  }

  console.log(records)
  return records;
})();

