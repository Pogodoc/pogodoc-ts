import { createReadStream, statSync } from "fs";
import { Readable } from "stream";
import { PogodocApiClient } from "./client";
import {
  GetJobStatusResponse,
  InitializeRenderJobRequest,
  StartImmediateRenderResponse,
  StartRenderJobResponse,
} from "./client/api";
import {
  FileStreamProps,
  GenerateDocumentProps,
  SaveTemplateMetadata,
  UpdateTemplateProps,
} from "./types";
import { uploadToS3WithUrl, wait } from "./utils";

/**
 * The PogodocClient provides a high-level interface to the Pogodoc API,
 * simplifying template management and document generation.
 */
export class PogodocClient extends PogodocApiClient {
  /**
   * Initializes a new instance of the PogodocClient.
   * @param {PogodocApiClient.Options} [options] - Configuration options for the client.
   * If a `token` is not provided, it will be read from the `POGODOC_API_TOKEN` environment variable.
   * @throws {Error} If the API token is not provided.
   */
  constructor(options?: PogodocApiClient.Options) {
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

  /**
   * Saves a new template from a local file path.
   * This method reads a template from a .zip file, uploads it, and saves it in Pogodoc.
   * It is a convenient wrapper around `saveTemplateFromFileStream`.
   *
   * @param {object} props - The properties for saving a template.
   * @param {string} props.path - The local file path to the .zip file containing the template.
   * @param {string} props.title - The title of the template.
   * @param {string} [props.description] - A description for the template.
   * @param {TemplateFormatType} props.type - The type of the template.
   * @param {string[]} [props.categories] - Categories for the template.
   * @param {any} [props.sampleData] - Sample data to be used for generating previews.
   * @param {string} [props.sourceCode] - A link to the source code of the template.
   * @returns {Promise<string>} A promise that resolves with the new template's ID.
   */
  async saveTemplate({
    path,
    ...rest
  }: {
    path: string;
  } & SaveTemplateMetadata): Promise<string> {
    const zip = createReadStream(path);
    const zipLength = statSync(path).size;

    return await this.saveTemplateFromFileStream({
      payload: zip,
      payloadLength: zipLength,
      ...rest,
    });
  }

  /**
   * Saves a new template from a file stream.
   * This is the core method for creating templates. It uploads a template from a stream,
   * generates previews, and saves it with the provided metadata.
   *
   * @param {FileStreamProps & SaveTemplateMetadata} props - The properties for saving a template from a stream.
   * @param {Readable} props.payload - The readable stream of the .zip file.
   * @param {number} props.payloadLength - The length of the payload in bytes.
   * @param {string} props.title - The title of the template.
   * @param {string} [props.description] - A description for the template.
   * @param {TemplateFormatType} props.type - The type of the template.
   * @param {string[]} [props.categories] - Categories for the template.
   * @param {any} [props.sampleData] - Sample data to be used for generating previews.
   * @param {string} [props.sourceCode] - A link to the source code of the template.
   * @returns {Promise<string>} A promise that resolves with the new template's ID.
   */
  async saveTemplateFromFileStream({
    payload,
    payloadLength,
    ...metadata
  }: FileStreamProps & SaveTemplateMetadata): Promise<string> {
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

  /**
   * Updates an existing template from a local file path.
   * This method reads a new version of a template from a .zip file, uploads it,
   * and updates the existing template in Pogodoc.
   * It is a convenient wrapper around `updateTemplateFromFileStream`.
   *
   * @param {object} props - The properties for updating a template.
   * @param {string} props.path - The local file path to the .zip file containing the new template version.
   * @param {string} props.templateId - The ID of the template to update.
   * @param {string} [props.title] - The new title of the template.
   * @param {string} [props.description] - A new description for the template.
   * @param {TemplateFormatType} [props.type] - The new type of the template.
   * @param {string[]} [props.categories] - New categories for the template.
   * @param {any} [props.sampleData] - New sample data to be used for generating previews.
   * @param {string} [props.sourceCode] - A new link to the source code of the template.
   * @returns {Promise<string>} A promise that resolves with the content ID of the new template version.
   */
  async updateTemplate({
    path,
    ...rest
  }: {
    path: string;
    templateId: string;
  } & UpdateTemplateProps): Promise<string> {
    const zip = createReadStream(path);
    const zipLength = statSync(path).size;

    return await this.updateTemplateFromFileStream({
      payload: zip,
      payloadLength: zipLength,
      ...rest,
    });
  }

  /**
   * Updates an existing template from a file stream.
   * This is the core method for updating templates. It uploads a new template version from a stream,
   * generates new previews, and updates the template with the provided metadata.
   *
   * @param {FileStreamProps & UpdateTemplateProps} props - The properties for updating a template from a stream.
   * @param {string} props.templateId - The ID of the template to update.
   * @param {Readable} props.payload - The readable stream of the .zip file with the new template version.
   * @param {number} props.payloadLength - The length of the payload in bytes.
   * @param {string} [props.title] - The new title of the template.
   * @param {string} [props.description] - A new description for the template.
   * @param {TemplateFormatType} [props.type] - The new type of the template.
   * @param {string[]} [props.categories] - New categories for the template.
   * @param {any} [props.sampleData] - New sample data to be used for generating previews.
   * @param {string} [props.sourceCode] - A new link to the source code of the template.
   * @returns {Promise<string>} A promise that resolves with the content ID of the new template version.
   */
  async updateTemplateFromFileStream({
    payload,
    payloadLength,
    ...metadata
  }: FileStreamProps & UpdateTemplateProps): Promise<string> {
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

  // TODO: add personal upload presigned s3 url to immediate render
  /**
   * Generates a document and returns the result immediately.
   * Use this method for quick, synchronous rendering of small documents.
   * The result is returned directly in the response.
   * For larger documents or when you need to handle rendering asynchronously, use `generateDocument`.
   *
   * You must provide either a `templateId` of a saved template or a `template` string.
   *
   * @param {GenerateDocumentProps} props - The properties for generating a document.
   * @param {string} [props.templateId] - The ID of the template to use for rendering.
   * @param {string} [props.template] - The raw HTML template string to use for rendering.
   * @param {any} props.data - The data to populate the template with.
   * @param {RenderConfig} props.renderConfig - Configuration for the rendering process.
   * @returns {Promise<StartImmediateRenderResponse>} A promise that resolves with the presigned url of the generated document.
   */
  async generateDocumentImmediate({
    template,
    templateId,
    data,
    renderConfig,
  }: GenerateDocumentProps): Promise<StartImmediateRenderResponse> {
    return this.documents.startImmediateRender({
      template,
      templateId,
      type: renderConfig.type,
      target: renderConfig.target,
      formatOpts: renderConfig.formatOpts,
      data,
    });
  }

  /**
   * Generates a document by starting a job and polling for its completion.
   * This is the recommended method for most use cases, especially for larger documents or when you want a simple fire-and-forget operation.
   * It first calls `startGenerateDocument` to begin the process, then `pollForJobCompletion` to wait for the result.
   *
   * You must provide either a `templateId` of a saved template or a `template` string.
   *
   * @param {GenerateDocumentProps} props - The properties for generating a document.
   * @param {string} [props.templateId] - The ID of the template to use for rendering.
   * @param {string} [props.template] - The raw HTML template string to use for rendering.
   * @param {any} props.data - The data to populate the template with.
   * @param {RenderConfig} props.renderConfig - Configuration for the rendering process.
   * @returns {Promise<GetJobStatusResponse>} A promise that resolves with the final job status, including the output URL.
   */
  async generateDocument({
    template,
    templateId,
    data,
    renderConfig,
  }: GenerateDocumentProps): Promise<GetJobStatusResponse> {
    const initResponse = await this.startGenerateDocument({
      template,
      templateId,
      data,
      renderConfig,
    });

    return await this.pollForJobCompletion(initResponse.jobId);
  }

  /**
   * Starts an asynchronous document generation job.
   * This is a lower-level method that only initializes the job.
   * You can use this if you want to implement your own polling logic.
   * It returns the initial job status, which includes the `jobId`.
   * Use `pollForJobCompletion` with the `jobId` to get the final result.
   *
   * You must provide either a `templateId` of a saved template or a `template` string.
   *
   * @param {GenerateDocumentProps} props - The properties for generating a document.
   * @param {string} [props.templateId] - The ID of the template to use for rendering.
   * @param {string} [props.template] - The raw HTML template string to use for rendering.
   * @param {any} props.data - The data to populate the template with.
   * @param {RenderConfig} props.renderConfig - Configuration for the rendering process.
   * @returns {Promise<StartRenderJobResponse>} A promise that resolves with the initial job information.
   */
  async startGenerateDocument({
    template,
    templateId,
    data,
    renderConfig,
  }: GenerateDocumentProps): Promise<StartRenderJobResponse> {
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

    return await this.documents.startRenderJob(initResponse.jobId, {
      uploadPresignedS3Url: renderConfig.personalUploadPresignedS3Url,
    });
  }

  /**
   * Polls for the completion of a rendering job.
   * This method repeatedly checks the status of a job until it is 'done'.
   *
   * @param {string} jobId - The ID of the job to poll.
   * @param {number} [maxAttempts=60] - The maximum number of polling attempts.
   * @param {number} [intervalMs=500] - The interval in milliseconds between polling attempts.
   * @returns {Promise<GetJobStatusResponse>} A promise that resolves with the final job status.
   */
  public async pollForJobCompletion(
    jobId: string,
    maxAttempts: number = 60,
    intervalMs: number = 500
  ): Promise<GetJobStatusResponse> {
    await wait(1000);

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const job = await this.documents.getJobStatus(jobId);

      if (job.status === "done") {
        return job;
      }

      await wait(intervalMs);
    }

    return await this.documents.getJobStatus(jobId);
  }
}
