## Pogodoc Typescript SDK

The Pogodoc Typescript SDK enables developers to seamlessly generate documents and manage templates using Pogodoc’s API.

### Installation

To install the Typescript SDK, just execute the following command

```bash
$ npm install @pogodoc/sdk
```

### Setup

To use the SDK you will need an API key which can be obtained from the [Pogodoc Dashboard](https://app.pogodoc.com)

### Example

```ts
import { PogodocClient } from "@pogodoc/sdk";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const client = new PogodocClient();

  const sampleData = {
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "1234567890",
    address: "123 Main St, Anytown, USA",
    city: "Anytown",
  };

  const response = await client.generateDocument({
    templateId: templateId,
    data: sampleData,
    renderConfig: {
      type: "ejs",
      target: "pdf",
    },
  });

  console.log("Generated document url: \n", response.output?.data.url);
}

main();
```

### License

MIT License
