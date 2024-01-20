import { parser } from "csv";
import { parse } from 'csv-parse';
import * as fs from "fs";
import { readdir } from 'node:fs/promises';
import * as path from "path";
import { DataSchema, dataSchema } from "./schemas.js";
import { SUPABASE_AUTH_EMAIL, SUPABASE_AUTH_PASSWORD, supabase } from "./supabase.js";
const __dirname = new URL('.', import.meta.url).pathname;

// Create a single supabase client for interacting with your database



const getRecords = async (parser: parser.Parser): Promise<unknown> => {
  const records: DataSchema = []
      for await (const record of parser) {
      records.push(record);
      }
  return records
}

const insertCompanyNames = async (records: DataSchema) => {
  for await (const record of records) {
    console.log({ name: record.companyName })
    const { data: myData, error: myError } = await supabase.from("company").select("name");

    console.log({ myData, myError })

    const { data, error } = await supabase.from("company").insert({ name: record.companyName })
    console.log({data, error})
  }
}

const insertAlatName = async (alatName: string) => {
  return await supabase.from("alat").insert({name: alatName})
}

const insertRecords = async (records: DataSchema, alatName: string) => {
  for await (const record of records) {
    const { data: data, error: error } = await supabase.from("record").insert({ company_name: record.companyName, tanggal: record.tanggal, masuk: record.masuk, keluar: record.keluar, alat_name: alatName })
    console.log([data, error])
  }
}


(async () => {

    supabase.auth.signInWithPassword({
  email: SUPABASE_AUTH_EMAIL,
  password: SUPABASE_AUTH_PASSWORD
    })

  const { data: { user } } = await supabase.auth.getUser()

  console.log({user})


  const alatFilesPath = __dirname + "/alat_files"

  const alatFiles = await readdir(alatFilesPath)

  for await (const alatFile of alatFiles) {

    const [alatName, _] = alatFile.split('.csv')

    console.log({alatName})

    const alatFilePath = path.resolve(__dirname, "alat_files", alatFile)

    const headers = ['tanggal', 'companyName', 'masuk', 'keluar'];

    const fileContent = fs.readFileSync(alatFilePath, { encoding: 'utf-8' });

    const parser = parse(fileContent, {
      delimiter: ',',
      columns: headers,
      skipEmptyLines: true,
    });

    const records = await getRecords(parser)

    const parsedData = dataSchema.parse(records)

    console.log({parsedData})

    await insertCompanyNames(parsedData)

    await insertAlatName(alatName)

    await insertRecords(parsedData, alatName)

    return parsedData

  }

})();

