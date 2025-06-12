import axios from "axios";

import { AxiosResponse } from "axios";
import { Readable } from "stream";
import fs from "fs";

export async function uploadToS3WithUrl(
  presignedUrl: string,
  stream: Readable,
  length: number,
  contentType?: string
): Promise<void> {
  try {
    const headers: Record<string, any> = {
      "Content-Length": length,
    };

    if (contentType) {
      headers["Content-Type"] = contentType;
    }

    const res = await axios.put(presignedUrl, stream, {
      headers,
    });
  } catch (error) {
    console.error("Error uploading file with Axios:", error);
    throw new Error("Error uploading file with Axios");
  }
}

export function stripBufferTimestamp(buffer: Buffer): Buffer {
  const creationDateSequence = Buffer.from([
    0x2f, 0x43, 0x72, 0x65, 0x61, 0x74, 0x69, 0x6f, 0x6e, 0x44, 0x61, 0x74,
    0x65,
  ]);

  const modDateSequence = Buffer.from([
    0x2f, 0x4d, 0x6f, 0x64, 0x44, 0x61, 0x74, 0x65,
  ]);

  let modifiedBuffer = Buffer.from(buffer);

  modifiedBuffer = removeSequenceRowFromBuffer(
    modifiedBuffer,
    creationDateSequence
  );

  modifiedBuffer = removeSequenceRowFromBuffer(modifiedBuffer, modDateSequence);

  return modifiedBuffer;
}

function removeSequenceRowFromBuffer(
  buffer: Buffer<ArrayBuffer>,
  sequence: Buffer<ArrayBuffer>
) {
  const sequenceStartIndex = buffer.indexOf(sequence);
  if (sequenceStartIndex !== -1) {
    const nextNewline = buffer.indexOf(0x0a, sequenceStartIndex);
    if (nextNewline !== -1) {
      buffer = Buffer.concat([
        buffer.subarray(0, sequenceStartIndex),
        buffer.subarray(nextNewline + 1),
      ]);
    }
  }
  return buffer;
}

export function readJsonFile(filePath: string) {
  try {
    const jsonString = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(jsonString);

    return data;
  } catch (error) {
    console.error("Error reading the JSON file:", error);
  }
}
