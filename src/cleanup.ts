import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

const OUTPUT_DIR = path.resolve(process.cwd(), 'output');

const hrstart = process.hrtime();
console.log(chalk.bold('Deleting raw downloads in output directory...'));

const directories = fs
  .readdirSync(OUTPUT_DIR, {
    withFileTypes: true,
  })
  .filter((file) => file.isDirectory());

directories.forEach((directory) => {
  const dir = path.resolve(OUTPUT_DIR, directory.name, 'downloads');
  if (fs.existsSync(dir)) {
    fs.rmdirSync(dir, {
      recursive: true,
    });
  }
});

console.log(
  chalk.green.bold('✨ Finished in %dms.'),
  process.hrtime(hrstart)[1] / 1000000
);
