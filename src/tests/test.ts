import dotenv from "dotenv";
import { PogodocClient } from "../../dist/index";

dotenv.config({ path: "../../.env" });

async function main() {
  const Pogodoc = new PogodocClient({
    token: process.env.POGODOC_API_TOKEN || "",
  });

  const templateId = process.env.TEMPLATE_ID;

  console.log(templateId);

  const document = await Pogodoc.generateDocument({
    templateId,
    data: { name: "John Doe" },
    renderConfig: {
      type: "ejs",
      target: "pdf",
    },
  });

  console.log("generateDocument", document);

  const documentImmediate = await Pogodoc.generateDocumentImmediate({
    templateId,
    data: { name: "John Doe" },
    renderConfig: {
      type: "ejs",
      target: "pdf",
    },
  });

  console.log("documentImmediate", documentImmediate);

  const jobId = await Pogodoc.startGenerateDocument({
    templateId,
    data: { name: "John Doe" },
    renderConfig: {
      type: "ejs",
      target: "pdf",
    },
  });

  const jobStatus = await Pogodoc.pollForJobCompletion(jobId);

  console.log("startGenerateDocument jobStatus", jobStatus);
}

main();
