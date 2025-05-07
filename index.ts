import { createReadStream, statSync } from "fs";
import { PogodocApiClient } from "./sdk";
import {
  FileStreamProps,
  GenerateDocumentProps,
  SaveTemplateMetadata,
  UpdateTemplateProps,
} from "./types";
import { uploadToS3WithUrl } from "./utils";
import { Readable } from "stream";
import { InitializeRenderJobRequest, StartRenderJobRequest } from "./sdk/api";

class PogodocClient extends PogodocApiClient {
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
    const { presignedTemplateUploadUrl, jobId: templateId } =
      await this.templates.initializeTemplateCreation();

    await uploadToS3WithUrl(
      presignedTemplateUploadUrl,
      payload,
      payloadLength,
      "application/zip"
    );

    const resp = await this.templates.extractTemplateFiles(templateId);
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
    const { presignedTemplateUploadUrl, jobId: contentId } =
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

    await this.templates.updateTemplate(metadata.templateId, {
      contentId,
      templateInfo: {
        title: metadata.title,
        description: metadata.description,
        type: metadata.type,
        categories: metadata.categories,
        sampleData: metadata.sampleData,
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
  }: GenerateDocumentProps) {
    const initRequest: InitializeRenderJobRequest = {
      type: renderConfig.type,
      target: renderConfig.target,
      templateId,
    };

    if (renderConfig.formatOpts) {
      initRequest.formatOpts = renderConfig.formatOpts;
    }

    const initResponse = await this.documents.initializeRenderJob(initRequest);

    const dataString = JSON.stringify(data);
    const dataStream = Readable.from(dataString);
    console.log("jobid", initResponse.jobId);

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

    const startRenderJobRequest: StartRenderJobRequest = {
      uploadPresignedS3Url: renderConfig.personalUploadPresignedS3Url,
    };

    if (renderConfig.shouldWaitForRenderCompletion) {
      startRenderJobRequest.shouldWaitForRenderCompletion = true;
    }

    await this.documents.startRenderJob(
      initResponse.jobId,
      startRenderJobRequest
    );

    const results = await this.documents.getJobStatus(initResponse.jobId);

    return results;
  }
}

export default PogodocClient;
