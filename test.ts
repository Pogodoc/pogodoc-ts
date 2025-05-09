import PogodocClient from "./dist/index";
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

  if (!templateId) {
    throw new Error("Template ID is required");
  }

  const documentOutput = await client.generateDocument({
    templateId: templateId,
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

  const updateTemplateId = await client.updateTemplate({
    path: templatePath,
    templateId: "9c4ace0a-8d6f-4371-b455-38508f1f8ac2",
    title: "Invoice",
    description: "Invoice template",
    type: "html",
    categories: ["invoice"],
    sampleData: sampleData,
  });
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
