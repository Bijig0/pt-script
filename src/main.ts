import { parser } from 'csv';
import { parse } from 'csv-parse';
import * as fs from 'fs';
import { readdir } from 'node:fs/promises';
import * as path from 'path';
import { addToCache, readCache } from './cache.js';
import { DataSchema, RowSchema, dataSchema } from './schemas.js';
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
  const toInsert = companyNames.map((name) => {
    return { name };
  });

  const { error } = await supabase.from('company').upsert(toInsert);

  if (error) console.error(error);
};

const insertCompany = async (record: RowSchema) => {
  console.log(`Inserting company data for ${record.companyName}`);
  const { data, error } = await supabase
    .from('company')
    .upsert({ name: record.companyName })
    .select('name');
  // if (error) throw error;
  console.log(`Inserted company data for ${record.companyName}`);

  if (data.length > 1) throw new Error('Found multiple companies');
  return data;
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

  const { error } = await supabase.from('alat').upsert(toInsert);

  if (error) console.error(error);
};

const insertAlat = async (alatName: string, companyData: { name: any }) => {
  const placeHolderHarga = -1;
  console.log(`Inserting alat data for ${alatName}`);
  const { data, error } = await supabase.from('alat').upsert({
    name: alatName,
    harga: placeHolderHarga,
    company: companyData.name,
  });
  // if (error) throw error;
  console.log(`Inserted alat data for ${alatName}`);
  console.log({ data, error });
  return;
};

const insertAllRecords = async (records: DataSchema, alatName: string) => {
  const newRecords = records.map((record) => {
    return {
      company_name: record.companyName,
      tanggal: record.tanggal,
      masuk: record.masuk,
      keluar: record.keluar,
      alat_name: alatName,
    };
  });

  const { error } = await supabase.from('record').insert(newRecords);

  if (error) console.error(error);
};

const insertRecords = async (records: DataSchema, alatName: string) => {
  for await (const record of records) {
    const unclenaedCompanyData = await insertCompany(record);
    const companyData = await unclenaedCompanyData[0];
    await insertAlat(alatName, companyData);
    console.log(
      `Inserting record for ${record.companyName} of alat ${alatName}`,
    );
    console.log(`Record is ${JSON.stringify(record)}`);
    const { data: data, error: error } = await supabase.from('record').insert({
      company_name: record.companyName,
      tanggal: record.tanggal,
      masuk: record.masuk,
      keluar: record.keluar,
      alat_name: alatName,
    });
    console.log(
      `Inserted record for ${record.companyName} of alat ${alatName}`,
    );
    console.log([data, error]);
  }
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

    await insertCompanies(parsedData.map((record) => record.companyName));

    await insertAlats(
      alatName,
      parsedData.map((record) => record.companyName),
    );

    await insertAllRecords(parsedData, alatName);

    

  }

  return;
})();
