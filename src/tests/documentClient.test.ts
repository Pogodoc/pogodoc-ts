import { describe } from "node:test";
import { expect, test, vi } from "vitest";
import dotenv from "dotenv";
import PogodocClient from "..";
import fs from "fs";
import * as validator from "validator";
import axios from "axios";
import { console } from "inspector";
import { comparePdfToSnapshot } from "pdf-visual-diff";
import * as core from "../sdk/core/index.js";
import { PogodocApiError, PogodocApiTimeoutError } from "../sdk";

dotenv.config();

describe("Document Client", async () => {
  const client = new PogodocClient({
    token: process.env.POGODOC_API_TOKEN || "",
    baseUrl: process.env.LAMBDA_BASE_URL || "",
  });

  const testCases = [
    {
      fn: () =>
        client.documents.initializeRenderJob({
          type: "html",
          target: "pdf",
        }),
    },
    { fn: () => client.documents.startRenderJob("") },
    {
      fn: () =>
        client.documents.generateDocumentPreview({
          templateId: "",
          type: "html",
          data: { name: "Ferdzo" },
        }),
    },
    {
      fn: () =>
        client.documents.startImmediateRender({
          type: "html",
          target: "pdf",
          data: { name: "Ferdzo" },
        }),
    },
    { fn: () => client.documents.getJobStatus("") },
  ];

  test("Test initialize render job", async () => {
    const nes = await client.documents.initializeRenderJob({
      type: "html",
      target: "pdf",
      templateId: "3ba0b3fa-3bdf-4b92-948c-1d3dc7b964d1",
      formatOpts: {
        fromPage: 1,
        toPage: 1,
      },
    });

    expect(nes).toBeDefined();

    expect(validator.isUUID(nes.jobId)).toBe(true);

    expect(nes.presignedDataUploadUrl).toBeDefined();
    expect(
      validator.isURL(nes.presignedDataUploadUrl!, {
        protocols: ["https"],
        require_protocol: true,
      })
    ).toBe(true);

    expect(nes.presignedTemplateUploadUrl).toBeDefined();
    expect(
      validator.isURL(nes.presignedTemplateUploadUrl!, {
        protocols: ["https"],
        require_protocol: true,
      })
    ).toBe(true);

    expect(nes.target).toBe("pdf");
  }, 10000);

  test.skip("Test get job status", async () => {
    const nes = await client.documents.getJobStatus(
      "98b91367-ab18-48fb-af99-f8f44d6e916c"
    );

    expect(nes).toBeDefined();

    expect(nes).toBe(true);
  }, 10000);

  test.skip("Test get job status", async () => {
    const nes = await client.documents.startRenderJob;

    expect(nes).toBeDefined();

    expect(nes).toBe(true);
  }, 10000);

  test("Test immediate render", async () => {
    const documentOutput = await client.documents.startImmediateRender({
      template: "<h1>Hello <%= name %></h1>",
      data: { name: "Ferdzo" },
      type: "html",
      target: "pdf",
    });

    expect(documentOutput).toBeDefined();

    const response = await axios.get(documentOutput.url, {
      responseType: "arraybuffer",
    });

    expect(response.status).toBe(200);

    const same = await comparePdfToSnapshot(
      response.data,
      __dirname,
      "testImmediateRender",
      {
        tolerance: 0.95,
      }
    );

    expect(same).toEqual(true);
  }, 10000);

  test("Test generate document", async () => {
    const sampleData = readJsonFile("../../data/json_data/react.json");

    const documentOutput = await client.generateDocument({
      templateId: "3ba0b3fa-3bdf-4b92-948c-1d3dc7b964d1",
      data: sampleData,
      renderConfig: {
        type: "html",
        target: "pdf",
        formatOpts: {
          fromPage: 1,
          toPage: 1,
        },
      },
      shouldWaitForRenderCompletion: true,
    });

    expect(documentOutput).toBeDefined();

    const response = await axios.get(documentOutput.output?.data.url!, {
      responseType: "arraybuffer",
    });

    expect(response.status).toBe(200);

    const areSame = await comparePdfToSnapshot(
      response.data,
      __dirname,
      "testGenerateDocument",
      {
        tolerance: 0.05,
      }
    );

    expect(areSame).toEqual(true);
  }, 10000);

  test.each(testCases)("Throws on status-code error", async ({ fn }) => {
    vi.spyOn(core, "fetcher").mockResolvedValueOnce({
      ok: false,
      error: {
        reason: "status-code",
        statusCode: 400,
        body: { message: "Bad Request" },
      },
      rawResponse: {
        headers: new Headers(),
        redirected: false,
        status: 400,
        statusText: "Client Closed Request",
        type: "error",
        url: "",
      },
    });

    await expect(fn).rejects.toThrow(PogodocApiError);
  });

  test.each(testCases)("Throws on non-json error", async ({ fn }) => {
    vi.spyOn(core, "fetcher").mockResolvedValueOnce({
      ok: false,
      error: {
        reason: "non-json",
        statusCode: 400,
        rawBody: "Bad Request",
      },
      rawResponse: {
        headers: new Headers(),
        redirected: false,
        status: 400,
        statusText: "Client Closed Request",
        type: "error",
        url: "",
      },
    });

    await expect(fn).rejects.toThrow(PogodocApiError);
  });

  test.each(testCases)("Throws on timeout error", async ({ fn }) => {
    vi.spyOn(core, "fetcher").mockResolvedValueOnce({
      ok: false,
      error: {
        reason: "timeout",
      },
      rawResponse: {
        headers: new Headers(),
        redirected: false,
        status: 400,
        statusText: "Client Closed Request",
        type: "error",
        url: "",
      },
    });

    await expect(fn).rejects.toThrow(PogodocApiTimeoutError);
  });

  test.each(testCases)("Throws on unknown error", async ({ fn }) => {
    vi.spyOn(core, "fetcher").mockResolvedValueOnce({
      ok: false,
      error: {
        reason: "unknown",
        errorMessage: "Unknown error occurred",
      },
      rawResponse: {
        headers: new Headers(),
        redirected: false,
        status: 400,
        statusText: "Client Closed Request",
        type: "error",
        url: "",
      },
    });

    await expect(fn).rejects.toThrow(PogodocApiError);
  });
});

function readJsonFile(filePath: string) {
  try {
    const jsonString = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(jsonString);

    return data;
  } catch (error) {
    console.error("Error reading the JSON file:", error);
  }
}
