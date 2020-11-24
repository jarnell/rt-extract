import { spawn } from 'child_process';
import chalk from 'chalk';
import Gauge from 'gauge';

/**
 * Queue item.
 */
class QueueItem {
  inputPath: string;
  outputPath: string;

  constructor(inputPath: string, outputPath: string) {
    this.inputPath = inputPath;
    this.outputPath = outputPath;
  }
}

/**
 * Managing a queue for audio file processing
 */
class AudioProcessingQueue {
  private queue: QueueItem[] = [];
  private isProcessing = false;
  private totalProcessed = 0;

  /**
   * Adding an item to the queue.
   * @param inputPath File input path
   * @param outputPath File output path
   */
  add(inputPath: string, outputPath: string): void {
    this.queue = [...this.queue, new QueueItem(inputPath, outputPath)];
    if (!this.isProcessing) this.startProcessing();
  }

  /**
   * Start processing the queue.
   */
  async startProcessing(): Promise<void> {
    console.log(chalk.bold('Starting to process...'));
    this.isProcessing = true;
    const gauge = new Gauge(); // Init progress bar
    let progress: NodeJS.Timer;
    const totalHrStart = process.hrtime();
    let itemProcessingTime = 30; // Estimated processing time, will use real value after first is finished

    while (this.queue.length > 0) {
      // Use first item in queue
      const item = this.queue[0];
      this.queue = this.queue.slice(1);
      let tick = 0;

      // Create an interval for the progress bar
      progress = setInterval(() => {
        tick++;
        const total = this.totalProcessed + this.queue.length + 1;
        gauge.pulse();
        gauge.show(
          chalk.green.bold(
            `Processing: ${
              this.totalProcessed + 1
            } of ${total} (${item.outputPath.slice(-9)})`
          ),
          tick / itemProcessingTime / 5
        );
      }, 200);

      try {
        const itemHrStart = process.hrtime();
        await this.process(item);
        itemProcessingTime = process.hrtime(itemHrStart)[0];

        clearInterval(progress);
        this.totalProcessed++;
      } catch (e) {
        clearInterval(progress);
        console.log(chalk.red(e.message));
      }
    }

    this.isProcessing = false;
    const totalHrEnd = process.hrtime(totalHrStart); // Processing time

    // Hide progress bar and write to console
    gauge.hide();
    console.log('');
    console.log(
      chalk.green.bold('Finished processing in %dm %ds'),
      Math.floor(totalHrEnd[0] / 60),
      totalHrEnd[0] % 60
    );
  }

  /**
   * Process an audio file with ffmpeg. Currently reducing noise, removing silence, and normalizing.
   * @param item Item to process
   */
  async process(item: QueueItem): Promise<void> {
    return new Promise((resolve, reject) => {
      const args = [
        '-y',
        '-to',
        '1820',
        '-i',
        item.inputPath,
        '-ar',
        '22050',
        '-b:a',
        '16k',
        '-af',
        'highpass=f=230, lowpass=f=2500, volume=25dB, arnndn=m=profiles/sh.rnnn, silenceremove=start_periods=1:start_duration=0:start_threshold=-30dB:start_silence=2:stop_periods=-1:stop_threshold=-35dB:stop_duration=4:stop_silence=0:window=0, dynaudnorm=m=15',
        item.outputPath,
      ];
      const ffmpeg = spawn('ffmpeg', args);

      /*
      ffmpeg.stdout.setEncoding('utf8');
      ffmpeg.stdout.on('data', (data) => {
        console.log(data);
      });

      ffmpeg.stderr.setEncoding('utf8');
      ffmpeg.stderr.on('data', (data) => {
        console.log(data);
      });
      */

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error('Could not process audio with ffmpeg.'));
        }
      });
    });
  }
}

export default AudioProcessingQueue;
