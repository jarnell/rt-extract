import fs from 'fs';
import https from 'https';

/**
 * Downloads a file from given url.
 * @param url File to download
 * @param path Where file should be saved
 */
const downloadFile = async (url: string, path: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(path);

    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        fs.unlink(path, () => {});
        reject(
          new Error(
            `Request failed with status code ${response.statusCode} (${url})`
          )
        );
      }

      response.pipe(file);
    });

    file.on('finish', (): void => {
      resolve();
    });

    file.on('error', (err: Error): void => {
      fs.unlink(path, () => {});
      reject(err);
    });
  });
};

export default downloadFile;
