// import { describe } from "node:test";
// import { expect, test } from "vitest";
// import PogodocClient from "..";
// import axios from "axios";
// import dotenv from "dotenv";

// dotenv.config();

// // Check if we need this deleteToken function in sdk
// describe.skip("Token Client", async () => {
//   const client = new PogodocClient({
//     token: process.env.POGODOC_API_TOKEN || "",
//     baseUrl: process.env.LAMBDA_BASE_URL || "",
//   });

//   test.only("Test delete token", async () => {
//     const response = await axios.post(
//       process.env.STRAPI_API_URL + "/generate-token",
//       { name: "Test token" },
//       {
//         headers: {
//           Authorization:
//             "Bearer " +
//             "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MjAsImlhdCI6MTc0ODg3MDg1NCwiZXhwIjoxNzUxNDYyODU0fQ.VMCL8eKztIu3QmVf5qNIIhvI-ChQF6Jn0QqFRu5PoPg",
//         },
//       }
//     );

//     //first generate token
//     //delete token
//     //try generate document with deleted token

//     // const nes = await client.tokens.;

//     expect(response).toBeDefined();
//     expect(response.data).toBeDefined();
//     expect(response.data.token).toBeDefined();

//     const deleteToken = await client.tokens.deleteApiToken(
//       response.data.token.tokenId
//     );

//     expect(deleteToken).toBe("true");
//   }, 10000);
// });
