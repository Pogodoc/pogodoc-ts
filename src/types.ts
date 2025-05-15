import { Readable } from "stream";
import { InitializeRenderJobRequestFormatOpts } from "./sdk/api";

export type PogodocClientConstructorType = {
  token: string;
  gatewayURL?: string;
};

export type GenerateDocumentProps = {
  template?: string;
  templateId?: string;
  data: { [key: string]: any };
  renderConfig: {
    type: TemplateFormatType;
    target: RenderTarget;
    formatOpts?: InitializeRenderJobRequestFormatOpts;
    personalUploadPresignedS3Url?: string;
  };
  shouldWaitForRenderCompletion?: boolean;
  uploadPresignedS3Url?: string;
};

export type Categories = ("invoice" | "mail" | "report" | "cv" | "other")[];

export type RenderTarget =
  | "pdf"
  | "html"
  | "docx"
  | "xlsx"
  | "pptx"
  | "png"
  | "jpg";

export type TemplateFormatType =
  | "docx"
  | "xlsx"
  | "pptx"
  | "ejs"
  | "html"
  | "latex"
  | "react";

export type FormatOptsType = {
  [key: string]: any;
  fromPage?: number;
  toPage?: number;
  format?: string;
  waitForSelector?: string;
};

export type SaveTemplateMetadata = {
  categories: Categories;
  title: string;
  description: string;
  sampleData: { [key: string]: any };
  type: TemplateFormatType;
  formatOpts?: FormatOptsType;
  sourceCode?: string;
};

export type UpdateTemplateProps = SaveTemplateMetadata & {
  templateId: string;
};

export type FileStreamProps = {
  payload: Readable;
  payloadLength: number;
};
