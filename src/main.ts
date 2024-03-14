import { parser } from 'csv';
import { parse } from 'csv-parse';
// import * as A from 'fp-ts/Array';
// import * as S from 'fp-ts/String';
import * as fs from 'fs';
import { readdir } from 'node:fs/promises';
import * as path from 'path';
import { addToCache, readCache } from './cache.js';
import { DataSchema, dataSchema } from './schemas.js';
import {
  SUPABASE_AUTH_EMAIL,
  SUPABASE_AUTH_PASSWORD,
  supabase,
} from './supabase.js';
const __dirname = new URL('.', import.meta.url).pathname;

// Create a single supabase client for interacting with your database

const getRecords = async (parser: parser.Parser): Promise<unknown> => {
  const records: DataSchema = [];
  for await (const record of parser) {
    records.push(record);
  }
  return records;
};

const insertCompanies = async (companyNames: string[]) => {
  const toInsert = [...new Set(companyNames)].map((name) => {
    return { name };
  });

  console.log(`Inserting companies for ${companyNames.length} companies`);
  const { error } = await supabase.from('company').upsert(toInsert);
  console.log(`Inserted companies for ${companyNames.length} companies`);

  if (error) console.error(error);
};

const insertAlats = async (alatName: string, companyNames: string[]) => {
  const placeHolderHarga = -1;

  const toInsert = companyNames.map((companyName) => {
    return {
      name: alatName,
      company: companyName,
      harga: placeHolderHarga,
    };
  });

  console.log(`Inserting alat for ${alatName}`);
  const { error } = await supabase.from('alat').upsert(toInsert);
  console.log(`Inserted alat for ${alatName}`);

  if (error) console.error(error);
};

const insertRecords = async (records: DataSchema, alatName: string) => {
  const newRecords = records.map((record) => {
    return {
      company_name: record.companyName,
      tanggal: record.tanggal,
      masuk: record.masuk,
      keluar: record.keluar,
      alat_name: alatName,
    };
  });

  console.log(`Inserting records for ${alatName}`);

  const { error } = await supabase.from('record').insert(newRecords);

  console.log(`Inserted records for ${alatName}`);

  if (error) console.error(error);
};

(async () => {
  await supabase.auth.signInWithPassword({
    email: SUPABASE_AUTH_EMAIL,
    password: SUPABASE_AUTH_PASSWORD,
  });

  const alatFilesPath = __dirname + '/alat_files';

  const alatFiles = await readdir(alatFilesPath);

  let prevAlatFile: string = null;

  for await (const alatFile of alatFiles) {
    const [alatName, _] = alatFile.split('.csv');

    if (alatName !== 'WINGNUT') continue;

    const cache = readCache();

    if (cache.includes(alatName)) continue;

    if (prevAlatFile !== null) {
      addToCache(prevAlatFile);
    }

    prevAlatFile = alatName;

    const alatFilePath = path.resolve(__dirname, 'alat_files', alatFile);

    const headers = ['tanggal', 'companyName', 'masuk', 'keluar'];

    const fileContent = fs.readFileSync(alatFilePath, { encoding: 'utf-8' });

    const parser = parse(fileContent, {
      delimiter: ',',
      columns: headers,
      skipEmptyLines: true,
    });

    const records = await getRecords(parser);

    console.log(`Starting reading for ${alatName}`);

    const parsedData = dataSchema.parse(records);

    const companyNames = parsedData.map((record) => record.companyName);

    const uniqueCompanyNames = [...new Set(companyNames)];

    await insertCompanies(uniqueCompanyNames);

    await insertAlats(alatName, uniqueCompanyNames);

    await insertRecords(parsedData, alatName);
  }

  return;
})();
