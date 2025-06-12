/// <reference types="vitest" />
import { defineConfig } from "vite";

export default defineConfig({
  test: {
    exclude: ["**/node_modules/**", "**/dist/**", "**/build/**"],
    reporters: ["verbose"],
    silent: false,
    coverage: {
      exclude: [
        "**/*.d.ts",
        "**/types/**",
        "**/interfaces/**",
        "**/node_modules/**",
        "**/types/**",
        "**/dist/**",
        "**/build/**",
        "build.js",
        "vitest.config.ts",
        "src/tests/**",
        "install-imports.js",
      ],
      provider: "v8",
      reporter: ["text", "json", "html"],
    },
    printConsoleTrace: true,
    disableConsoleIntercept: true,
    onConsoleLog(log: string, type: "stdout" | "stderr"): false | void {
      console.log("log in test: ", log);
      if (log === "message from third party library" && type === "stdout") {
        return false;
      }
    },
  },
});
