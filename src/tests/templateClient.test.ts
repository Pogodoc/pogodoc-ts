import { describe } from "node:test";
import { expect, test, vi } from "vitest";
import PogodocClient from "..";
import dotenv from "dotenv";
import fs from "fs";
import * as validator from "validator";
import * as core from "../sdk/core/index.js";
import { PogodocApiError, PogodocApiTimeoutError } from "../sdk";

dotenv.config();

describe("Template Client", async () => {
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

  test("Test initialize template creation", async () => {
    const response = await client.templates.initializeTemplateCreation();

    expect(response).toBeDefined();
    expect(response.jobId).toBeDefined();

    expect(validator.isUUID(response.jobId)).toBe(true);

    expect(response.presignedTemplateUploadUrl).toBeDefined();
    expect(
      validator.isURL(response.presignedTemplateUploadUrl!, {
        protocols: ["https"],
        require_protocol: true,
      })
    ).toBe(true);
  });

  test.skip("Test update template", async () => {
    const sampleData = readJsonFile("../../data/json_data/react.json");
    const templatePath = "../../data/templates/React-Demo-App.zip";

    const updateTemplateId = await client.updateTemplate({
      path: templatePath,
      templateId: "3ba0b3fa-3bdf-4b92-948c-1d3dc7b964d1",
      title: "Invoice",
      description: "Invoice template",
      type: "html",
      categories: ["invoice"],
      sampleData: sampleData,
    });

    expect(updateTemplateId).toBe(true);
    // expect(response).toBeDefined();
    // expect(response.jobId).toBeDefined();

    // expect(validator.isUUID(response.jobId)).toBe(true);

    // expect(response.presignedTemplateUploadUrl).toBeDefined();
    // expect(
    //   validator.isURL(response.presignedTemplateUploadUrl!, {
    //     protocols: ["https"],
    //     require_protocol: true,
    //   })
    // ).toBe(true);
  }, 10000);

  test("Test save template", async () => {
    const createdTemplateId = await client.saveTemplate({
      path: templatePath,
      title: "Invoice",
      description: "Invoice template",
      type: "html",
      categories: ["invoice"],
      sampleData: sampleData,
    });

    expect(createdTemplateId).toBeDefined();
    expect(validator.isUUID(createdTemplateId)).toBe(true);
    templateId = createdTemplateId;
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

  test("Test delete template", async () => {
    const deleteResponse = await client.templates.deleteTemplate(templateId);

    // TODO: Change this when it is implemented on the backend
    expect(deleteResponse).toBeUndefined();
    // expect(validator.isUUID(deleteResponse!)).toBe(true);
  }, 10000);
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
