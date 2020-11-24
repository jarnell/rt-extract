require('dotenv').config();
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import dayjs from 'dayjs';
import dayjsUtc from 'dayjs/plugin/utc';
import dayjsCustomParseFormat from 'dayjs/plugin/customParseFormat';

import downloadFile from './downloadFile';
import AudioProcessingQueue from './AudioProcessingQueue';

// DayJS extensions
dayjs.extend(dayjsUtc);
dayjs.extend(dayjsCustomParseFormat);

const OUTPUT_DIR = path.resolve(process.cwd(), 'output');

interface UserPromptValues {
  date: string;
  startTime: string;
  hours: number;
}

const prompt = async (): Promise<UserPromptValues> => {
  console.log(
    chalk.white.bgMagenta.bold(
      'What period do you want to download and extract?'
    )
  );

  try {
    const answers = await inquirer.prompt([
      {
        name: 'date',
        message: 'Date (YYMMDD)',
        default: dayjs().format('YYMMDD'),
        validate: (value: string): boolean | string => {
          const pass = value.match(/^2[0-9][0-1][0-9][0-3][0-9]$/);
          if (!pass) return 'Invalid date';
          return true;
        },
      },
      {
        name: 'startTime',
        message: 'Start time (HHMM)',
        default: '0000',
        validate: (value: string): boolean | string => {
          const pass = value.match(/^[0-2][0-9](00|30)$/);
          if (!pass) return 'Invalid start time (minute must be 00 or 30)';
          return true;
        },
      },
      {
        name: 'hours',
        message: 'How many hours forward?',
        default: 12,
        type: 'number',
        validate: (value: number): boolean | string => {
          const pass = Number.isInteger(value) && value >= 1 && value <= 24;
          if (!pass) return 'Enter a number between 1 and 24';
          return true;
        },
      },
    ]);

    return answers;
  } catch (e) {
    process.exit(1);
  }
};

const main = async (): Promise<void> => {
  const answers = await prompt(); // Get user response
  const startTime = dayjs(
    answers.date + answers.startTime,
    'YYMMDDHHmm',
    true
  ).utc(true);
  const extractDir = path.resolve(OUTPUT_DIR, startTime.format('YYMMDD'));
  const downloadDir = path.resolve(extractDir, 'downloads');
  fs.mkdirSync(downloadDir, { recursive: true }); // Create directory
  const queue = new AudioProcessingQueue();

  console.log('');
  console.log(chalk.bold('⬇️  Starting to download...'));

  for (let i = 0; i < answers.hours * 2; i++) {
    // Set file name and paths
    const time = startTime.add(30 * i, 'minute');

    // Cancel if next day
    if (!time.isSame(startTime, 'day')) {
      break;
    }

    const fileName = `${time.format('HHmm')}Z.mp3`;
    const downloadPath = path.resolve(downloadDir, fileName);
    const extractPath = path.resolve(extractDir, fileName);
    const url = `${process.env.BASE_URL}${time.format(
      'MMM-DD-YYYY-HHmm'
    )}Z.mp3`;

    try {
      // Download and add to processing queue
      await downloadFile(url, downloadPath);
      queue.add(downloadPath, extractPath);
    } catch (e) {
      console.log(chalk.red.bold(e.message));
    }
  }
};

main();
