## Pogodoc Typescript SDK

The Pogodoc Typescript SDK enables developers to seamlessly generate documents and manage templates using Pogodoc’s API.

### Installation

To install the Typescript SDK, just execute the following command

```bash
$ npm install @pogodoc/sdk
```

### Setup

To use the SDK you will need an API key which can be obtained from the [Pogodoc Dashboard](https://pogodoc.com)

### Example

```ts
import { PogodocClient } from "@pogodoc/sdk";
import * as fs from "fs";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const client = new PogodocClient();

  const sampleData = readJsonFile("../../data/json_data/react.json");
  const templatePath = "../../data/templates/React-Demo-App.zip";

  const templateId = await client.saveTemplate({
    path: templatePath,
    title: "Invoice",
    description: "Invoice description",
    sampleData: sampleData,
    type: "react",
    categories: ["invoice"],
  });
  console.log("Created template id:", templateId);

  await client.updateTemplate({
    path: templatePath,
    templateId: templateId,
    title: "Invoice Updated",
    description: "Description updated",
    type: "react",
    categories: ["invoice"],
    sampleData: sampleData,
  });
  console.log("Template updated successfully");

  const response = await client.generateDocument({
    templateId: templateId,
    data: sampleData,
    renderConfig: {
      type: "react",
      target: "pdf",
    },
    shouldWaitForRenderCompletion: true,
  });

  console.log("Generated document url: \n", response.output?.data.url);
}

main().then(console.log);

function readJsonFile(filePath: string) {
  try {
    const jsonString = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(jsonString);

    return data;
  } catch (error) {
    console.error("Error reading the JSON file:", error);
  }
}
```

### License

MIT License
