// import { readdir } from 'node:fs/promises';

import path from "path";

const __dirname = new URL('.', import.meta.url).pathname;

// const path = __dirname + "/alat_files"

// console.log({path})

// try {
//   const files = await readdir(path);
//   for (const file of files)
//     if (file.slice(0,2) === "CB") {
//       console.log(file);
//     }
// } catch (err) {
//   console.error(err);
// }


import fs from 'node:fs';
const myPath = path.resolve(__dirname, "cache.txt")

const content = 'Some content!\n';
try {
  fs.appendFileSync(myPath, content);
  // file written successfully
} catch (err) {
  console.error(err);
}


try {
  const data = fs.readFileSync(myPath, 'utf8');
  console.log(data.split("\n"));
} catch (err) {
  console.error(err);
}
