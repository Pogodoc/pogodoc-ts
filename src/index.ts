import { createReadStream, statSync } from "fs";
import { Readable } from "stream";
import { PogodocApiClient } from "./client";
import { InitializeRenderJobRequest } from "./client/api";
import {
  FileStreamProps,
  GenerateDocumentProps,
  SaveTemplateMetadata,
  UpdateTemplateProps,
} from "./types";
import { uploadToS3WithUrl } from "./utils";

export class PogodocClient extends PogodocApiClient {
  constructor(options: PogodocApiClient.Options) {
    const token = options?.token || process.env.POGODOC_API_TOKEN;
    if (!token) {
      throw new Error(
        "API token is required. Please provide it either as a parameter or set the POGODOC_API_TOKEN environment variable."
      );
    }
    super({
      ...options,
      baseUrl: options?.baseUrl || process.env.POGODOC_BASE_URL,
      token,
    });
  }

  async saveTemplate({
    path,
    ...rest
  }: {
    path: string;
  } & SaveTemplateMetadata) {
    const zip = createReadStream(path);
    const zipLength = statSync(path).size;

    return await this.saveTemplateFromFileStream({
      payload: zip,
      payloadLength: zipLength,
      ...rest,
    });
  }

  async saveTemplateFromFileStream({
    payload,
    payloadLength,
    ...metadata
  }: FileStreamProps & SaveTemplateMetadata) {
    const { presignedTemplateUploadUrl, templateId } =
      await this.templates.initializeTemplateCreation();

    await uploadToS3WithUrl(
      presignedTemplateUploadUrl,
      payload,
      payloadLength,
      "application/zip"
    );

    await this.templates.extractTemplateFiles(templateId);

    const { pdfPreview, pngPreview } =
      await this.templates.generateTemplatePreviews(templateId, {
        type: metadata.type,
        data: metadata.sampleData,
      });

    await this.templates.saveCreatedTemplate(templateId, {
      templateInfo: {
        title: metadata.title,
        description: metadata.description,
        type: metadata.type,
        categories: metadata.categories,
        sampleData: metadata.sampleData,
        sourceCode: metadata.sourceCode,
      },
      previewIds: {
        pngJobId: pngPreview.jobId,
        pdfJobId: pdfPreview.jobId,
      },
    });

    return templateId;
  }

  async updateTemplate({
    path,
    ...rest
  }: {
    path: string;
    templateId: string;
  } & UpdateTemplateProps) {
    const zip = createReadStream(path);
    const zipLength = statSync(path).size;

    return await this.updateTemplateFromFileStream({
      payload: zip,
      payloadLength: zipLength,
      ...rest,
    });
  }

  async updateTemplateFromFileStream({
    payload,
    payloadLength,
    ...metadata
  }: FileStreamProps & UpdateTemplateProps) {
    const { presignedTemplateUploadUrl, templateId: contentId } =
      await this.templates.initializeTemplateCreation();

    await uploadToS3WithUrl(
      presignedTemplateUploadUrl,
      payload,
      payloadLength,
      "application/zip"
    );

    await this.templates.extractTemplateFiles(contentId);

    const { pdfPreview, pngPreview } =
      await this.templates.generateTemplatePreviews(contentId, {
        type: metadata.type,
        data: metadata.sampleData,
      });

    //TODO: rename to finalizeUpdateTemplate?
    await this.templates.updateTemplate(metadata.templateId, {
      contentId,
      templateInfo: {
        title: metadata.title,
        description: metadata.description,
        type: metadata.type,
        categories: metadata.categories,
        sampleData: metadata.sampleData,
        sourceCode: metadata.sourceCode,
      },
      previewIds: {
        pngJobId: pngPreview.jobId,
        pdfJobId: pdfPreview.jobId,
      },
    });

    return contentId;
  }

  async generateDocument({
    template,
    templateId,
    data,
    renderConfig,
    shouldWaitForRenderCompletion,
  }: GenerateDocumentProps) {
    const initRequest: InitializeRenderJobRequest = {
      type: renderConfig.type,
      target: renderConfig.target,
      templateId,
      formatOpts: renderConfig.formatOpts,
    };

    const initResponse = await this.documents.initializeRenderJob(initRequest);

    const dataString = JSON.stringify(data);
    const dataStream = Readable.from(dataString);

    if (initResponse.presignedDataUploadUrl) {
      await uploadToS3WithUrl(
        initResponse.presignedDataUploadUrl,
        dataStream,
        dataString.length,
        "application/json"
      );
    }

    if (template && initResponse.presignedTemplateUploadUrl) {
      await uploadToS3WithUrl(
        initResponse.presignedTemplateUploadUrl,
        Readable.from(template),
        template.length,
        "text/html"
      );
    }

    console.log(initResponse.jobId);

    await this.documents.startRenderJob(initResponse.jobId, {
      shouldWaitForRenderCompletion,
      uploadPresignedS3Url: renderConfig.personalUploadPresignedS3Url,
    });

    console.log("jobId", initResponse.jobId);

    const results = await this.documents.getJobStatus(initResponse.jobId);

    return results;
  }
}
