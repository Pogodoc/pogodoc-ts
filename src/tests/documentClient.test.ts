import { describe } from "node:test";
import { assert, expect, test, vi } from "vitest";
import dotenv from "dotenv";
import { PogodocClient } from "..";
import fs from "fs";
import * as validator from "validator";
import axios from "axios";
import * as core from "../sdk/core/index.js";
import { PogodocApiError, PogodocApiTimeoutError } from "../sdk";
import { stripBufferTimestamp, readJsonFile } from "./utils";
import { StartImmediateRenderRequest } from "../sdk/api";
import { GenerateDocumentProps } from "../types";

dotenv.config();

const testTemplateId = process.env.TEST_TEMPLATE_ID || "";

describe.skip("Document Client", async () => {
  const client = new PogodocClient({
    token: process.env.POGODOC_API_TOKEN || "",
    baseUrl: process.env.LAMBDA_BASE_URL || "",
  });

  const sampleData = readJsonFile("../../data/json_data/react.json");

  const testCasesImmediateRenderPDF: { params: StartImmediateRenderRequest }[] =
    [
      {
        params: {
          template: "<h1>Hello <%= name %></h1>",
          data: { name: "Ferdzo" },
          type: "html",
          target: "pdf",
          formatOpts: {
            fromPage: 1,
            toPage: 1,
          },
        },
      },
      {
        params: {
          template: "<h1>Hello <%= name %></h1>",
          data: { name: "Ferdzo" },
          type: "html",
          target: "pdf",
        },
      },
    ];
  const testCasesImmediateRenderPNG: { params: StartImmediateRenderRequest }[] =
    [
      {
        params: {
          template: "<h1>Hello <%= name %></h1>",
          data: { name: "Ferdzo" },
          type: "html",
          target: "png",
          formatOpts: {
            fromPage: 1,
            toPage: 1,
          },
        },
      },
      {
        params: {
          template: "<h1>Hello <%= name %></h1>",
          data: { name: "Ferdzo" },
          type: "html",
          target: "png",
        },
      },
    ];
  const testCasesGenerateDocumentPDF: {
    params: GenerateDocumentProps;
    reference: string;
  }[] = [
    {
      params: {
        templateId: testTemplateId,
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
      },
      reference: "/reference-documents/testGenerateDocumentOnePage.pdf",
    },
    {
      params: {
        templateId: testTemplateId,
        data: sampleData,
        renderConfig: {
          type: "html",
          target: "pdf",
        },
        shouldWaitForRenderCompletion: true,
      },
      reference: "/reference-documents/testGenerateDocument.pdf",
    },
  ];
  const testCasesGenerateDocumentPNG: { params: GenerateDocumentProps }[] = [
    {
      params: {
        templateId: testTemplateId,
        data: sampleData,
        renderConfig: {
          type: "html",
          target: "png",
          formatOpts: {
            fromPage: 1,
            toPage: 1,
          },
        },
        shouldWaitForRenderCompletion: true,
      },
    },
    // {
    //   params: {
    //     templateId: testTemplateId,
    //     data: sampleData,
    //     renderConfig: {
    //       type: "html",
    //       target: "png",
    //     },
    //     shouldWaitForRenderCompletion: true,
    //   },
    // },
  ];
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

  test.concurrent(
    "Test initialize render job",
    async () => {
      const response = await client.documents.initializeRenderJob({
        type: "html",
        target: "pdf",
        templateId: testTemplateId,
        formatOpts: {
          fromPage: 1,
          toPage: 1,
        },
      });

      expect(response).toBeDefined();

      expect(validator.isUUID(response.jobId)).toBe(true);

      assert(
        response.presignedDataUploadUrl,
        "Presigned data upload URL is not defined"
      );
      expect(
        validator.isURL(response.presignedDataUploadUrl, {
          protocols: ["https"],
          require_protocol: true,
        })
      ).toBe(true);

      expect(response.presignedTemplateUploadUrl).toBeNull();

      expect(response.target).toBe("pdf");
    },
    10000
  );

  test.concurrent.each(testCasesImmediateRenderPDF)(
    "Test immediate render pdf",
    async ({ params }) => {
      const documentOutput = await client.documents.startImmediateRender(
        params
      );

      expect(documentOutput).toBeDefined();

      const response = await axios.get(documentOutput.url, {
        responseType: "arraybuffer",
      });

      expect(response.status).toBe(200);

      const buffer = fs.readFileSync(
        __dirname + "/reference-documents/testImmediateRender.pdf"
      );

      const referenceBuffer = stripBufferTimestamp(buffer);
      const responseBuffer = stripBufferTimestamp(response.data);

      expect(responseBuffer.equals(referenceBuffer)).toEqual(true);
    },
    20000
  );

  test.concurrent.each(testCasesImmediateRenderPNG)(
    "Test immediate render png",
    async ({ params }) => {
      const documentOutput = await client.documents.startImmediateRender(
        params
      );

      expect(documentOutput).toBeDefined();

      const response = await axios.get(documentOutput.url, {
        responseType: "arraybuffer",
      });

      expect(response.status).toBe(200);

      const buffer = fs.readFileSync(
        __dirname + "/reference-documents/testImmediateRender.png"
      );

      expect(response.data).toEqual(buffer);
    },
    20000
  );

  test.concurrent.each(testCasesGenerateDocumentPDF)(
    "Test generate document pdf",
    async ({ params, reference }) => {
      const documentOutput = await client.generateDocument(params);

      expect(documentOutput).toBeDefined();

      const response = await axios.get(documentOutput.output?.data.url!, {
        responseType: "arraybuffer",
      });

      expect(response.status).toBe(200);

      const buffer = fs.readFileSync(__dirname + reference);

      const referenceBuffer = stripBufferTimestamp(buffer);
      const responseBuffer = stripBufferTimestamp(response.data);

      expect(responseBuffer.equals(referenceBuffer)).toEqual(true);
    },
    10000
  );

  test.concurrent.each(testCasesGenerateDocumentPNG)(
    "Test generate document png",
    async ({ params }) => {
      const documentOutput = await client.generateDocument(params);

      expect(documentOutput).toBeDefined();

      const response = await axios.get(documentOutput.output?.data.url!, {
        responseType: "arraybuffer",
      });

      expect(response.status).toBe(200);

      const buffer = fs.readFileSync(
        __dirname + "/reference-documents/testGenerateDocument.png"
      );

      expect(response.data).toEqual(buffer);
    },
    10000
  );

  test.concurrent(
    "Test generate document with template",
    async () => {
      const documentOutput = await client.generateDocument({
        template: "<h1>Hello <%= name %></h1>",
        data: { name: "Ferdzo" },
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

      const buffer = fs.readFileSync(
        __dirname + "/reference-documents/testGenerateDocument.pdf"
      );

      const referenceBuffer = stripBufferTimestamp(buffer);
      const responseBuffer = stripBufferTimestamp(response.data);

      expect(responseBuffer.equals(referenceBuffer)).toEqual(true);
    },
    10000
  );

  test.concurrent.each(testCases)(
    "Throws on status-code error",
    async ({ fn }) => {
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
    }
  );

  test.concurrent.each(testCases)(
    "Throws on non-json error",
    async ({ fn }) => {
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
    }
  );

  test.concurrent.each(testCases)("Throws on timeout error", async ({ fn }) => {
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

  test.concurrent.each(testCases)(
    `Throws on unknown error `,
    async ({ fn }) => {
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
    }
  );
});
