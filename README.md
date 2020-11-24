# Extract RT

Simple CLI tool to download audio files from a popular ATC communications streaming site and remove noise and silence using ffmpeg.

## Installation

1. Make sure you have ffmpeg installed.
2. Create .env file with `BASE_URL=<YOUR_FEED>`

## Usage

```
npm run extract
```

## To-do

Noise reduction using recurrent neural networks is working decent but not great. Might need to find another solution or tweak the values passed to ffmpeg.
