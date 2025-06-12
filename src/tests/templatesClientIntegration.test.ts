import dotenv from "dotenv";
import PogodocClient from "..";
import {
  assert,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from "vitest";
import { readJsonFile, uploadToS3WithUrl } from "../utils";
import validator from "validator";
import { createReadStream, readFileSync, statSync } from "fs";
import axios from "axios";
import * as core from "../sdk/core";

dotenv.config();

describe.skip("Templates Client Integration", () => {
  const client = new PogodocClient({
    token: process.env.POGODOC_API_TOKEN || "",
    baseUrl: process.env.LAMBDA_BASE_URL || "",
  });

  const fetcherSpy = vi.spyOn(core, "fetcher");

  //   beforeAll(async () => {
  //     templateId = await client.saveTemplate({
  //       path: templatePath,
  //       title: "Invoice",
  //       description: "Invoice template",
  //       type: "html",
  //       categories: ["invoice"],
  //       sampleData: sampleData,
  //     });
  //   });

  beforeEach(() => {
    vi.resetAllMocks();
  });

  let templateInitParams: {
    templateId: string;
    presignedTemplateUploadUrl: string;
  };

  let templatePreviewsParams: {
    pdfPreview: {
      jobId: string;
      url: string;
    };
    pngPreview: {
      jobId: string;
      url: string;
    };
  };

  const sampleData = readJsonFile("../../data/json_data/react.json");
  const templatePath = "../../data/templates/React-Demo-App.zip";

  test("Test initialize template creation", async () => {
    templateInitParams = await client.templates.initializeTemplateCreation();

    expect(
      validator.isURL(templateInitParams.presignedTemplateUploadUrl, {
        protocols: ["https"],
        require_protocol: true,
      })
    ).toBe(true);
    expect(validator.isUUID(templateInitParams.templateId)).toBe(true);
  });

  test("Test upload template to s3", async () => {
    console.log("templateInitParams", templateInitParams);
    const axiosPutSpy = vi.spyOn(axios, "put");

    await uploadToS3WithUrl(
      templateInitParams.presignedTemplateUploadUrl,
      createReadStream(templatePath),
      readFileSync(templatePath).length,
      "application/zip"
    );

    const axiosPutResult = axiosPutSpy.mock.settledResults[0].value;
    expect((axiosPutResult as any).status).toBe(200);
  });

  test("Test extract template files", async () => {
    await client.templates.extractTemplateFiles(templateInitParams.templateId);

    const fetcherResult = fetcherSpy.mock.settledResults[0].value;
    expect(fetcherResult.rawResponse.status).toBe(204);
  });

  test("Test generate template previews", async () => {
    const templatePreviewsParams =
      await client.templates.generateTemplatePreviews(
        templateInitParams.templateId,
        { type: "html", data: sampleData }
      );
    expect(validator.isUUID(templatePreviewsParams.pdfPreview.jobId)).toBe(
      true
    );
    expect(validator.isUUID(templatePreviewsParams.pngPreview.jobId)).toBe(
      true
    );

    assert(templatePreviewsParams);
    expect(validator.isUUID(templatePreviewsParams.pdfPreview.jobId)).toBe(
      true
    );
  });

  test("Test generate presigned get Url", async () => {
    const { presignedUrl } = await client.templates.generatePresignedGetUrl(
      templateInitParams.templateId
    );
    expect(presignedUrl).toBeDefined();
    expect(
      validator.isURL(presignedUrl, {
        protocols: ["https"],
        require_protocol: true,
      })
    ).toBe(true);
  }, 10000);

  // test("Test get template Index Html", async () => {
  //   const { templateIndex } = await client.templates.getTemplateIndexHtml(
  //     templateCreationParams.templateId
  //   );

  //   expect(templateIndex).toBeDefined();
  //   expect(typeof templateIndex).toBe("string");
  //   expect(templateIndex).toBe(
  //     readFileSync(
  //       __dirname + "/reference-documents/reactTemplateIndex.html",
  //       "utf8"
  //     )
  //   );
  // }, 10000);

  // test.only("Test get template Index Html", async () => {
  //   const { templateIndex } = await client.templates.uploadTemplateIndexHtml(
  //     templateId,
  //     {
  //       templateIndex: "<html><body>Test</body></html>",
  //     }
  //   );

  //   expect(templateIndex).toBe(true);
  //   expect(templateIndex).toBeDefined();
  // }, 10000);

  //   test("Test update template", async () => {
  //     const sampleData = readJsonFile("../../data/json_data/react.json");
  //     const templatePath = "../../data/templates/React-Demo-App.zip";

  //     const updateTemplateId = await client.templates.updateTemplate(templateId, {
  //       templateInfo: {
  //         contentId: templateId,
  //         path: templatePath,
  //         title: "Invoice",
  //         description: "Invoice template",
  //         type: "html",
  //         categories: ["invoice"],
  //         sampleData: sampleData,
  //       },
  //     });

  //     expect(updateTemplateId).toBeDefined();
  //     expect(validator.isUUID(updateTemplateId)).toBe(true);
  //   }, 30000);

  //   test.skip("Test delete template", async () => {
  //     const deleteResponse = await client.templates.deleteTemplate(templateId);

  //     // TODO: Change this when it is implemented on the backend
  //     expect(deleteResponse).toBeUndefined();
  //     // expect(validator.isUUID(deleteResponse!)).toBe(true);
  //   }, 10000);
});
