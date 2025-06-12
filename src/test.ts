import axios from "axios";
import PogodocClient from ".";
import dotenv from "dotenv";
import fs from "fs";
import { readJsonFile, stripBufferTimestamp } from "./utils";

dotenv.config();

const sampleData = readJsonFile("../../data/json_data/react.json");
const templatePath = "../../data/templates/React-Demo-App.zip";

const client = new PogodocClient({
  token: process.env.POGODOC_API_TOKEN || "",
  baseUrl: process.env.LAMBDA_BASE_URL || "",
});

async function main() {
  console.log("running tests");

  // const documentOutput = await client.documents.startImmediateRender({
  //   template: "<h1>Hello <%= name %></h1>",
  //   data: { name: "Ferdzo" },
  //   type: "html",
  //   target: "png",
  // });
  // const response = await axios.get(documentOutput.url, {
  //   responseType: "arraybuffer",
  // });
  // console.log("response.data", response.data);
  // console.log("output url", documentOutput.url);

  // const responseBuffer = Buffer.from(response.data);

  // const buffer = fs.readFileSync("src/tests/output.png");
  // const savedBuffer = buffer;

  // console.log("Buffers are equal:", responseBuffer.equals(savedBuffer));

  // const modifiedSavedBuffer = stripBufferTimestamp(savedBuffer);
  // const modifiedResponseBuffer = stripBufferTimestamp(responseBuffer);

  // if (!modifiedResponseBuffer.equals(modifiedSavedBuffer)) {
  //   fs.writeFileSync("response-output.txt", modifiedResponseBuffer.toString());
  //   fs.writeFileSync("saved-output.txt", modifiedSavedBuffer.toString());
  // }

  // function formatAllBufferBytes(buffer: Buffer): string {
  //   const hexBytes = [];
  //   for (let i = 0; i < buffer.length; i++) {
  //     hexBytes.push(buffer[i].toString(16).padStart(2, "0"));
  //   }

  //   // Break into lines of 16 bytes each for readability
  //   const lines = [];
  //   for (let i = 0; i < hexBytes.length; i += 16) {
  //     const line = hexBytes.slice(i, i + 16).join(" ");
  //     lines.push(`${i.toString().padStart(8, "0")}: ${line}`);
  //   }

  //   return lines.join("\n");
  // }

  // console.log(
  //   "Buffers are equal:",
  //   modifiedResponseBuffer.equals(modifiedSavedBuffer)
  // );

  // fs.writeFileSync(
  //   "outputDataBuffer.txt",
  //   formatAllBufferBytes(responseBuffer)
  // );
  // fs.writeFileSync("savedDataBuffer.txt", formatAllBufferBytes(savedBuffer));

  const templateId = await client.saveTemplate({
    path: templatePath,
    title: "Invoice",
    description: "Invoice template",
    type: "html",
    categories: ["invoice"],
    sampleData: sampleData,
  });

  // console.log("templateId", templateId);

  // if (!templateId) {
  //   throw new Error("Template ID is required");
  // }

  // const updateTemplateId = await client.updateTemplate({
  //   path: templatePath,
  //   templateId: templateId,
  //   title: "Invoice",
  //   description: "Invoice template",
  //   type: "html",
  //   categories: ["invoice"],
  //   sampleData: sampleData,
  // });

  // console.log("updateTemplateId", updateTemplateId);

  // const presignedUrl = await client.templates.generatePresignedGetUrl(
  //   templateId
  // );

  // console.log("presignedUrl", presignedUrl);

  // const documentOutput = await client.generateDocument({
  //   templateId: "080d2631-0c8f-440b-a908-5e10f8287b0f",
  //   data: sampleData,
  //   renderConfig: {
  //     type: "html",
  //     target: "pdf",
  //     formatOpts: {
  //       fromPage: 1,
  //       toPage: 1,
  //     },
  //   },
  //   shouldWaitForRenderCompletion: true,
  // });

  // console.log("documentOutput", documentOutput);

  // const documentOutput2 = await client.documents.startImmediateRender({
  //   template: "<h1>Hello <%= name %></h1>",
  //   data: { name: "Ferdzo" },
  //   type: "html",
  //   target: "pdf",
  // });

  // console.log("documentOutput2", documentOutput2);
  // const saveTemplate = await Promise.all(
  //   Array(50)
  //     .fill(0)
  //     .map(async (_, index) => {
  //       try {
  //         const templateId = await client.saveTemplate({
  //           path: templatePath,
  //           title: "Invoice",
  //           description: "Invoice template",
  //           type: "html",
  //           categories: ["invoice"],
  //           sampleData: sampleData,
  //         });

  //         console.log("Template:", templateId);
  //       } catch (error) {
  //         console.error(`Error generating document ${index}:`, error);
  //       }
  //     })
  // );

  // const generateDocuments = await Promise.all(
  //   Array(50)
  //     .fill(0)
  //     .map(async (_, index) => {
  //       try {
  //         const documentOutput = await client.generateDocument({
  //           templateId: "656098fa-571b-42d3-be46-58c1c0020564",
  //           data: sampleData,
  //           renderConfig: {
  //             type: "html",
  //             target: "pdf",
  //           },
  //           shouldWaitForRenderCompletion: true,
  //         });

  //         console.log("Document:", documentOutput);
  //       } catch (error) {
  //         console.error(`Error generating document ${index}:`, error);
  //       }
  //     })
  // );
}

main();
