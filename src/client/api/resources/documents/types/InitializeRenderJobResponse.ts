/**
 * This file was auto-generated by Fern from our API Definition.
 */

export interface InitializeRenderJobResponse {
    /** ID of the render job */
    jobId: string;
    /** Type of output to be rendered */
    target: InitializeRenderJobResponse.Target;
    /** Presigned URL to upload the data for the render job to S3 */
    presignedDataUploadUrl?: string;
    /** Presigned URL to upload the template for the render job to S3. Only works with EJS templates */
    presignedTemplateUploadUrl?: string;
}

export namespace InitializeRenderJobResponse {
    /**
     * Type of output to be rendered
     */
    export type Target = "pdf" | "html" | "docx" | "xlsx" | "pptx" | "png" | "jpg";
    export const Target = {
        Pdf: "pdf",
        Html: "html",
        Docx: "docx",
        Xlsx: "xlsx",
        Pptx: "pptx",
        Png: "png",
        Jpg: "jpg",
    } as const;
}
