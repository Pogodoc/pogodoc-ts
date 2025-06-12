import dotenv from "dotenv";
import fs, { ReadStream } from "fs";
import { describe } from "node:test";
import * as validator from "validator";
import { beforeEach, expect, test, vi } from "vitest";
import PogodocClient from "../index";
import { PogodocApiError, PogodocApiTimeoutError } from "../sdk";
import * as core from "../sdk/core/index.js";
import { readJsonFile } from "../utils";
import { callParams, mockTemplateCreationFunctions } from "./utils";

dotenv.config();

describe("Template Client", async () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });
  const client = new PogodocClient({
    token: process.env.POGODOC_API_TOKEN || "",
    baseUrl: process.env.LAMBDA_BASE_URL || "",
  });

  const sampleData = readJsonFile("../../data/json_data/react.json");
  const templatePath = "../../data/templates/React-Demo-App.zip";

  let templateId: string;

  const testCases = [
    {
      fn: () =>
        client.templates.saveCreatedTemplate("", {
          templateInfo: {
            title: "title",
            description: "description",
            type: "docx",
            sampleData: {
              key: "value",
            },
            categories: ["invoice"],
          },
          previewIds: {
            pngJobId: "pngJobId",
            pdfJobId: "pdfJobId",
          },
        }),
    },
    { fn: () => client.templates.initializeTemplateCreation() },
    {
      fn: () =>
        client.templates.updateTemplate("", {
          templateInfo: {
            title: "title",
            description: "description",
            type: "docx",
            sampleData: {
              key: "value",
            },
            categories: ["invoice"],
          },
          previewIds: {
            pngJobId: "pngJobId",
            pdfJobId: "pdfJobId",
          },
          contentId: "",
        }),
    },
    { fn: () => client.templates.deleteTemplate("") },
    { fn: () => client.templates.extractTemplateFiles("") },
    {
      fn: () =>
        client.templates.generateTemplatePreviews("", {
          type: "docx",
          data: {
            key: "value",
          },
        }),
    },
    { fn: () => client.templates.generatePresignedGetUrl("") },
    { fn: () => client.templates.getTemplateIndexHtml("") },
    {
      fn: () =>
        client.templates.uploadTemplateIndexHtml("", {
          templateIndex: "<html><body>Test</body></html>",
        }),
    },
    { fn: () => client.templates.cloneTemplate("") },
  ];

  test("Test saveTemplate", async () => {
    const saveTemplateSpy = vi.spyOn(client, "saveTemplate");

    const saveTemplateFromFileStreamSpy = vi
      .spyOn(client, "saveTemplateFromFileStream")
      .mockResolvedValue(callParams.templateId);

    await client.saveTemplate({
      path: callParams.templatePath,
      title: callParams.title,
      description: callParams.description,
      type: callParams.type,
      categories: callParams.categories,
      sampleData: callParams.sampleData,
    });

    const saveTemplateFromFileStreamCallParams =
      saveTemplateFromFileStreamSpy.mock.calls[0][0];

    expect(
      (saveTemplateFromFileStreamCallParams.payload as ReadStream).path
    ).toBe(callParams.readStream.path);
    expect(saveTemplateFromFileStreamCallParams.payloadLength).toBe(
      callParams.fileLength
    );
    expect(saveTemplateFromFileStreamCallParams.title).toBe(callParams.title);
    expect(saveTemplateFromFileStreamCallParams.description).toBe(
      callParams.description
    );
    expect(saveTemplateFromFileStreamCallParams.type).toBe(callParams.type);
    expect(saveTemplateFromFileStreamCallParams.categories).toBe(
      callParams.categories
    );
    expect(saveTemplateFromFileStreamCallParams.sampleData).toBe(
      callParams.sampleData
    );

    expect(saveTemplateSpy).toHaveResolvedWith(callParams.templateId);
  });

  test("Test saveTemplateFromFileStream", async () => {
    const readStream = fs.createReadStream(templatePath);
    const fileLength = fs.statSync(templatePath).size;

    const {
      initializeTemplateCreationSpy,
      uploadToS3WithUrlSpy,
      extractTemplateFilesSpy,
      generateTemplatePreviewsSpy,
      saveCreatedTemplateSpy,
      saveTemplateFromFileStreamSpy,
    } = mockTemplateCreationFunctions(client, callParams);

    await client.saveTemplateFromFileStream({
      payload: readStream,
      payloadLength: fileLength,
      title: callParams.title,
      description: callParams.description,
      type: callParams.type,
      categories: callParams.categories,
      sampleData: sampleData,
    });

    expect(initializeTemplateCreationSpy).toHaveBeenCalledOnce();

    const uploadTemplateCall = uploadToS3WithUrlSpy.mock.calls[0];
    expect(uploadTemplateCall[0]).toBe(callParams.presignedTemplateUploadUrl);
    expect((uploadTemplateCall[1] as ReadStream).path).toBe(
      callParams.readStream.path
    );
    expect(uploadTemplateCall[2]).toBe(callParams.fileLength);
    expect(uploadTemplateCall[3]).toBe("application/zip");

    expect(extractTemplateFilesSpy).toHaveBeenCalledWith(callParams.templateId);

    expect(generateTemplatePreviewsSpy).toHaveBeenCalledWith(
      callParams.templateId,
      {
        type: callParams.type,
        data: callParams.sampleData,
      }
    );

    expect(saveCreatedTemplateSpy).toHaveBeenCalledWith(callParams.templateId, {
      templateInfo: {
        title: callParams.title,
        description: callParams.description,
        type: callParams.type,
        sampleData: callParams.sampleData,
        categories: callParams.categories,
      },
      previewIds: {
        pdfJobId: callParams.pdfPreview.jobId,
        pngJobId: callParams.pngPreview.jobId,
      },
      sourceCode: undefined,
    });

    expect(saveTemplateFromFileStreamSpy).toHaveResolvedWith(
      callParams.templateId
    );
  }, 30000);

  test("Test updateTemplate", async () => {
    const updateTemplateFromFileStreamSpy = vi
      .spyOn(client, "updateTemplateFromFileStream")
      .mockResolvedValue(callParams.templateId);

    const updateTemplateSpy = vi.spyOn(client, "updateTemplate");

    await client.updateTemplate({
      templateId: callParams.oldTemplateId,
      path: callParams.templatePath,
      title: callParams.title,
      description: callParams.description,
      type: callParams.type,
      categories: callParams.categories,
      sampleData: callParams.sampleData,
    });

    const updateTemplateFromFileStreamCallParams =
      updateTemplateFromFileStreamSpy.mock.calls[0][0];

    expect(
      (updateTemplateFromFileStreamCallParams.payload as ReadStream).path
    ).toBe(callParams.readStream.path);
    expect(updateTemplateFromFileStreamCallParams.payloadLength).toBe(
      callParams.fileLength
    );
    expect(updateTemplateFromFileStreamCallParams.title).toBe(callParams.title);
    expect(updateTemplateFromFileStreamCallParams.description).toBe(
      callParams.description
    );
    expect(updateTemplateFromFileStreamCallParams.type).toBe(callParams.type);
    expect(updateTemplateFromFileStreamCallParams.categories).toBe(
      callParams.categories
    );
    expect(updateTemplateFromFileStreamCallParams.sampleData).toBe(
      callParams.sampleData
    );

    expect(updateTemplateSpy).toHaveResolvedWith(callParams.templateId);
  });

  test("Test updateTemplateFromFileStream", async () => {
    const readStream = fs.createReadStream(templatePath);
    const fileLength = fs.statSync(templatePath).size;

    const {
      initializeTemplateCreationSpy,
      uploadToS3WithUrlSpy,
      extractTemplateFilesSpy,
      generateTemplatePreviewsSpy,
      updateTemplateSpy,
      updateTemplateFromFileStreamSpy,
    } = mockTemplateCreationFunctions(client, callParams);

    await client.updateTemplateFromFileStream({
      templateId: callParams.oldTemplateId,
      payload: readStream,
      payloadLength: fileLength,
      title: callParams.title,
      description: callParams.description,
      type: callParams.type,
      categories: callParams.categories,
      sampleData: sampleData,
      sourceCode: callParams.sourceCode,
    });

    expect(initializeTemplateCreationSpy).toHaveBeenCalledOnce();

    const uploadTemplateCall = uploadToS3WithUrlSpy.mock.calls[0];
    expect(uploadTemplateCall[0]).toBe(callParams.presignedTemplateUploadUrl);
    expect((uploadTemplateCall[1] as ReadStream).path).toBe(
      callParams.readStream.path
    );
    expect(uploadTemplateCall[2]).toBe(callParams.fileLength);
    expect(uploadTemplateCall[3]).toBe("application/zip");

    expect(extractTemplateFilesSpy).toHaveBeenCalledWith(callParams.templateId);

    expect(generateTemplatePreviewsSpy).toHaveBeenCalledWith(
      callParams.templateId,
      {
        type: callParams.type,
        data: callParams.sampleData,
      }
    );

    expect(updateTemplateSpy).toHaveBeenCalledWith(callParams.oldTemplateId, {
      contentId: callParams.templateId,
      templateInfo: {
        title: callParams.title,
        description: callParams.description,
        type: callParams.type,
        sampleData: callParams.sampleData,
        categories: callParams.categories,
        sourceCode: callParams.sourceCode,
      },
      previewIds: {
        pdfJobId: callParams.pdfPreview.jobId,
        pngJobId: callParams.pngPreview.jobId,
      },
    });

    expect(updateTemplateFromFileStreamSpy).toHaveResolvedWith(
      callParams.templateId
    );
  }, 30000);

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
