import { readdir } from 'node:fs/promises';

const __dirname = new URL('.', import.meta.url).pathname;

const path = __dirname + "/alat_files"

console.log({path})

try {
  const files = await readdir(path);
  for (const file of files)
    if (file.slice(0,2) === "CB") {
      console.log(file);
    }
} catch (err) {
  console.error(err);
}
