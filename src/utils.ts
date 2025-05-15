import axios from "axios";

import { AxiosResponse } from "axios";
import { Readable } from "stream";

export async function uploadToS3WithUrl(
  presignedUrl: string,
  stream: Readable,
  length: number,
  contentType?: string
): Promise<AxiosResponse> {
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

    return res;
  } catch (error) {
    console.error("Error uploading file with Axios:", error);
    throw new Error("Error uploading file with Axios");
  }
}
