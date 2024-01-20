import { error } from 'node:console';
import fs from 'node:fs';
import path from "path";

const __dirname = new URL('.', import.meta.url).pathname;

const cachePath = path.resolve(__dirname, "cache.txt")

export const addToCache = (alatName: string): string => {
  const formattedAlatName = `${alatName}\n`
  try {
    fs.appendFileSync(cachePath, formattedAlatName);
    // file written successfully
  } catch (err) {
    console.error(err);
  }
  return alatName
}

export const readCache = (): string[] => {
  try {
    const data = fs.readFileSync(cachePath, 'utf8');
    const asList = data.split("\n")
    return asList
  } catch (err) {
    console.error(err);
    throw error
  }

}
