import axios from "axios";
import { Readable } from "stream";

export const wait = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

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
