import dotenv from "dotenv";
import { PogodocClient } from "../../dist/index";

dotenv.config({ path: "../../.env" });

async function main() {
  const Pogodoc = new PogodocClient({
    token: process.env.POGODOC_API_TOKEN || "",
    baseUrl: process.env.POGODOC_BASE_URL,
  });

  const templateId = process.env.TEMPLATE_ID;

  const sampleData = {
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "1234567890",
    address: "123 Main St, Anytown, USA",
    city: "Anytown",
  };

  console.log(templateId);

  const document = await Pogodoc.generateDocument({
    templateId,
    data: sampleData,
    renderConfig: {
      type: "ejs",
      target: "pdf",
    },
  });

  console.log("generateDocument", document);

  const documentImmediate = await Pogodoc.generateDocumentImmediate({
    templateId,
    data: sampleData,
    renderConfig: {
      type: "ejs",
      target: "pdf",
    },
  });

  console.log("documentImmediate", documentImmediate);

  const startDocumentResponse = await Pogodoc.startGenerateDocument({
    templateId,
    data: sampleData,
    renderConfig: {
      type: "ejs",
      target: "pdf",
    },
  });

  const jobStatus = await Pogodoc.pollForJobCompletion(
    startDocumentResponse.jobId
  );

  console.log("startGenerateDocument jobStatus", jobStatus);
}

main();
