import PogodocClient from ".";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const sampleData = readJsonFile("../../data/json_data/react.json");
const templatePath = "../../data/templates/React-Demo-App.zip";

const client = new PogodocClient({
  token: process.env.POGODOC_API_TOKEN || "",
  baseUrl: process.env.LAMBDA_BASE_URL || "",
});

async function main() {
  const templateId = await client.saveTemplate({
    path: templatePath,
    title: "Invoice",
    description: "Invoice template",
    type: "html",
    categories: ["invoice"],
    sampleData: sampleData,
  });

  console.log("templateId", templateId);

  if (!templateId) {
    throw new Error("Template ID is required");
  }

  const updateTemplateId = await client.updateTemplate({
    path: templatePath,
    templateId: "9c4ace0a-8d6f-4371-b455-38508f1f8ac2",
    title: "Invoice",
    description: "Invoice template",
    type: "html",
    categories: ["invoice"],
    sampleData: sampleData,
  });

  console.log("updateTemplateId", updateTemplateId);

  const presignedUrl = await client.templates.generatePresignedGetUrl(
    templateId
  );

  console.log("presignedUrl", presignedUrl);

  const documentOutput = await client.generateDocument({
    templateId: "80f63a14-ac9f-4cb4-9bfa-70b38daf33a6",
    data: sampleData,
    renderConfig: {
      type: "html",
      target: "pdf",
      formatOpts: {
        fromPage: 1,
        toPage: 1,
      },
    },
    shouldWaitForRenderCompletion: true,
  });

  console.log("documentOutput", documentOutput);

  const documentOutput2 = await client.documents.startImmediateRender({
    template: "<h1>Hello <%= name %></h1>",
    data: { name: "Ferdzo" },
    type: "html",
    target: "pdf",
  });

  console.log("documentOutput2", documentOutput2);
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

function readJsonFile(filePath: string) {
  try {
    const jsonString = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(jsonString);

    return data;
  } catch (error) {
    console.error("Error reading the JSON file:", error);
  }
}
