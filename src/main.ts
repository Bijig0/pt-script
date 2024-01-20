import { parser } from "csv";
import { parse } from 'csv-parse';
import * as fs from "fs";
import { readdir } from 'node:fs/promises';
import * as path from "path";
import { addToCache, readCache } from "./cache.js";
import { DataSchema, RowSchema, dataSchema } from "./schemas.js";
import { SUPABASE_AUTH_EMAIL, SUPABASE_AUTH_PASSWORD, supabase } from "./supabase.js";
const __dirname = new URL('.', import.meta.url).pathname;

// Create a single supabase client for interacting with your database

const done = [
  "ASIBA 1.6M", "ASIBA 2M", "BASE PLATE", "BAUT 19MM", "BEAM CLAMP ( HIDUP DAN MATI)", "CATWALK", "CB 185", "CB 193", "CB 205", "CB 220", "CNP 125X3.5", "COLUMN WALLER", "CORNER COUPLING", "FIXED CLAMP", "HOLLOW 4X6X1.5", "HOLLOW 4X6X1.25", "HOLLOW 4X6X2.5", "HOLLOW 4X6X2", "HOLLOW 4X6X3.5"
]

const getRecords = async (parser: parser.Parser): Promise<unknown> => {
  const records: DataSchema = []
      for await (const record of parser) {
      records.push(record);
      }
  return records
}

const insertCompany = async (record: RowSchema) => {
  console.log(`Inserting company data for ${record.companyName}`)
  const { data, error } = await supabase.from("company").upsert({ name: record.companyName }).select("name")
  console.log(`Inserted company data for ${record.companyName}`)

  if (data.length > 1) throw new Error("Found multiple companies")
  return data
}

const insertAlat = async (alatName: string, companyData: {name: any} ) => {
  const placeHolderHarga = -1
  console.log(`Inserting alat data for ${alatName}`)
  const { data, error } = await supabase.from("alat").upsert({ name: alatName, harga: placeHolderHarga, company: companyData.name })
  console.log(`Inserted alat data for ${alatName}`)
  console.log({ data, error })
  return
}

const insertRecords = async (records: DataSchema, alatName: string) => {
  for await (const record of records) {
    const unclenaedCompanyData = await insertCompany(record)
    const companyData = await unclenaedCompanyData[0]
    await insertAlat(alatName, companyData)
    console.log(`Inserting record for ${record.companyName} of alat ${alatName}`)
    console.log(`Record is ${JSON.stringify(record)}`)
    const { data: data, error: error } = await supabase.from("record").insert({ company_name: record.companyName, tanggal: record.tanggal, masuk: record.masuk, keluar: record.keluar, alat_name: alatName })
    console.log(`Inserted record for ${record.companyName} of alat ${alatName}`)
    console.log([data, error])
  }
}


(async () => {

    await supabase.auth.signInWithPassword({
  email: SUPABASE_AUTH_EMAIL,
  password: SUPABASE_AUTH_PASSWORD
    })


  const alatFilesPath = __dirname + "/alat_files"

  const alatFiles = await readdir(alatFilesPath)

  let prevAlatFile: string = null


  for await (const alatFile of alatFiles) {

    const cache = readCache()

    if (cache.includes(alatFile)) continue

    if (prevAlatFile !== null) {
      addToCache(prevAlatFile)
    }

    prevAlatFile = alatFile

    const [alatName, _] = alatFile.split('.csv')

    if (done.includes(alatName)) continue

    const alatFilePath = path.resolve(__dirname, "alat_files", alatFile)

    const headers = ['tanggal', 'companyName', 'masuk', 'keluar'];

    const fileContent = fs.readFileSync(alatFilePath, { encoding: 'utf-8' });

    const parser = parse(fileContent, {
      delimiter: ',',
      columns: headers,
      skipEmptyLines: true,
    });

    const records = await getRecords(parser)

    console.log(`Starting reading for ${alatName}`)

    const parsedData = dataSchema.parse(records)

    await insertRecords(parsedData, alatName)

    // return
  }

  return

})();

