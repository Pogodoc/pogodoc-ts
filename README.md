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

async function main() {
  const client = new PogodocClient({
    token: "YOUR-POGODOC-API-TOKEN",
  });

  const response = await client.generateDocument({
    templateId: "your-template-id",
    data: { name: "John Doe" },
    renderConfig: {
      type: "html",
      target: "pdf",
    },
  });

  console.log("Generated document url: \n", response.output?.data.url);
}

main();
```

### License

MIT License
