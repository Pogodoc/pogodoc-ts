/**
 * This file was auto-generated by Fern from our API Definition.
 */

/**
 * @example
 *     {}
 */
export interface StartRenderJobRequest {
    /** Whether to wait for the render job to complete, if false, the job will be returned immediately */
    shouldWaitForRenderCompletion?: boolean;
    uploadPresignedS3Url?: string;
}
