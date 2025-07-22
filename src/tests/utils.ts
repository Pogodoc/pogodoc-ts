import { vi } from "vitest";
import { PogodocClient } from "..";
import * as utils from "../utils";
import fs from "fs";
import { Categories, TemplateFormatType } from "../types";

const sampleData = readJsonFile("../../data/json_data/react.json");
const templatePath = "../../data/templates/React-Demo-App.zip";

const readStream = fs.createReadStream(templatePath);
const fileLength = fs.statSync(templatePath).size;

export function stripBufferTimestamp(buffer: Buffer): Buffer {
  const creationDateSequence = Buffer.from([
    0x2f, 0x43, 0x72, 0x65, 0x61, 0x74, 0x69, 0x6f, 0x6e, 0x44, 0x61, 0x74,
    0x65,
  ]);

  const modDateSequence = Buffer.from([
    0x2f, 0x4d, 0x6f, 0x64, 0x44, 0x61, 0x74, 0x65,
  ]);

  let modifiedBuffer = Buffer.from(buffer);

  modifiedBuffer = removeSequenceRowFromBuffer(
    modifiedBuffer,
    creationDateSequence
  );

  modifiedBuffer = removeSequenceRowFromBuffer(modifiedBuffer, modDateSequence);

  return modifiedBuffer;
}

function removeSequenceRowFromBuffer(buffer: Buffer, sequence: Buffer) {
  const sequenceStartIndex = buffer.indexOf(sequence);
  if (sequenceStartIndex !== -1) {
    const nextNewline = buffer.indexOf(0x0a, sequenceStartIndex);
    if (nextNewline !== -1) {
      buffer = Buffer.concat([
        buffer.subarray(0, sequenceStartIndex),
        buffer.subarray(nextNewline + 1),
      ]);
    }
  }
  return buffer;
}

export function readJsonFile(filePath: string) {
  try {
    const jsonString = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(jsonString);

    return data;
  } catch (error) {
    console.error("Error reading the JSON file:", error);
  }
}

export const callParams = {
  templateId: "template-creation-job-id",
  oldTemplateId: "old-template-id",
  templatePath: templatePath,
  fileLength: fileLength,
  readStream: readStream,
  presignedTemplateUploadUrl: "presigned-template-upload-url",
  title: "Full Mock Template",
  description: "Full Mock Template",
  type: "html" as TemplateFormatType,
  categories: ["invoice", "other"] as Categories,
  sampleData: sampleData,
  pdfPreview: {
    jobId: "pdf-preview-job-id",
    url: "pdf-preview-url",
  },
  pngPreview: {
    jobId: "png-preview-job-id",
    url: "png-preview-url",
  },
  sourceCode: "source-code",
};

export const mockTemplateCreationFunctions = (
  client: PogodocClient,
  callParams: { [key: string]: any }
) => {
  const saveTemplateFromFileStreamSpy = vi.spyOn(
    client,
    "saveTemplateFromFileStream"
  );

  const updateTemplateFromFileStreamSpy = vi.spyOn(
    client,
    "updateTemplateFromFileStream"
  );

  const initializeTemplateCreationSpy = vi
    .spyOn(client.templates, "initializeTemplateCreation")
    .mockResolvedValue({
      templateId: callParams.templateId,
      presignedTemplateUploadUrl: callParams.presignedTemplateUploadUrl,
    });

  const uploadToS3WithUrlSpy = vi
    .spyOn(utils, "uploadToS3WithUrl")
    .mockResolvedValue();

  const extractTemplateFilesSpy = vi
    .spyOn(client.templates, "extractTemplateFiles")
    .mockResolvedValue();

  const generateTemplatePreviewsSpy = vi
    .spyOn(client.templates, "generateTemplatePreviews")
    .mockResolvedValue({
      pdfPreview: callParams.pdfPreview,
      pngPreview: callParams.pngPreview,
    });

  const saveCreatedTemplateSpy = vi
    .spyOn(client.templates, "saveCreatedTemplate")
    .mockResolvedValue();

  const updateTemplateSpy = vi
    .spyOn(client.templates, "updateTemplate")
    .mockResolvedValue({
      newContentId: callParams.templateId,
    });

  return {
    initializeTemplateCreationSpy,
    uploadToS3WithUrlSpy,
    extractTemplateFilesSpy,
    generateTemplatePreviewsSpy,
    saveCreatedTemplateSpy,
    updateTemplateSpy,
    saveTemplateFromFileStreamSpy,
    updateTemplateFromFileStreamSpy,
  };
};
