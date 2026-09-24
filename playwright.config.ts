import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  timeout: 60000,
  use: {
    baseURL: "http://localhost:4200",
    browserName: "chromium",
    channel: "msedge",
    headless: true,
    screenshot: "only-on-failure",
  },
  reporter: "list",
  outputDir: "artifacts/playwright",
});
