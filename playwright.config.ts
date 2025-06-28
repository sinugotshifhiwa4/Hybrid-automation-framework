import { defineConfig, devices } from "@playwright/test";
import { OrtoniReportConfig } from "ortoni-report";
import { TIMEOUTS } from "./src/config/timeouts/timeout.config";
import EnvironmentDetector from "./src/config/environment/detector/detector";
import BrowserInitFlag from "./src/config/browserInitFlag";
import AuthStorageConstants from "./src/utils/auth/storage/authStorageManager";
import os from "os";

/**
 * Initialize configuration variables for Playwright test execution.
 *
 * - isCI: Detects if running in CI environment to adjust behavior (headless mode, reporters, etc.)
 * - shouldSkipBrowserInit: Flag to bypass browser setup project for performance optimization
 * - authStorageFilePath: Resolves path to authentication state file for session persistence
 */
const isCI = EnvironmentDetector.isCI();
const shouldSkipBrowserInit = BrowserInitFlag.shouldSkipBrowserInit();
const authStorageFilePath = AuthStorageConstants.resolveAuthStateFilePath();

// ortoni-report types
type chartType = "doughnut" | "pie";

const reportConfig: OrtoniReportConfig = {
  open: process.env.CI ? "never" : "always", // default to never
  folderPath: "ortoni-report",
  filename: "index.html",
  logo: "",
  title: "Hybrid Test Automation Report",
  showProject: !true,
  projectName: "Hybrid Automation Framework",
  testType: "regression",
  authorName: "Tshifhiwa Sinugo",
  base64Image: false,
  stdIO: false,
  preferredTheme: "dark",
  chartType: "doughnut" as chartType,
  meta: {
    project: "Hybrid Automation Framework",
    environment: process.env.ENV || "dev",
  },
};

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  timeout: TIMEOUTS.test,
  expect: {
    timeout: TIMEOUTS.expect,
  },
  testDir: "./tests",
  globalSetup: "./src/config/environment/global/globalEnvironmentSetup.ts",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: EnvironmentDetector.isShardingEnabled()
    ? Math.max(1, Math.floor(os.cpus().length / parseInt(process.env.SHARD_TOTAL || "1")))
    : Math.max(1, Math.floor(os.cpus().length / 2)),

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: isCI
    ? [["junit", { outputFile: "results.xml" }], ["dot"]]
    : [
        ["html", { open: "never" }],
        ["junit", { outputFile: "results.xml" }],
        ["ortoni-report", reportConfig],
        ["dot"],
      ],
  grep:
    typeof process.env.PLAYWRIGHT_GREP === "string"
      ? new RegExp(process.env.PLAYWRIGHT_GREP)
      : process.env.PLAYWRIGHT_GREP || /.*/,
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    // baseURL: 'http://localhost:3000',

    trace: "retain-on-failure",
    video: isCI ? "on" : "retain-on-failure",
    screenshot: isCI ? "off" : "on",
    headless: isCI ? true : false,

    launchOptions: {
      args: isCI
        ? [
            // ESSENTIAL (Must have for CI stability)
            "--no-sandbox", // Prevents permission failures in container
            "--disable-dev-shm-usage", // Prevents memory crashes in Docker
            "--disable-gpu", // Prevents GPU crashes in headless CI

            // PERFORMANCE (Recommended for consistent test execution)
            "--disable-background-timer-throttling", // Ensures consistent timing
            "--disable-backgrounding-occluded-windows", // Maintains performance in headless
            "--disable-renderer-backgrounding", // Keeps rendering at full speed

            // STABILITY (Additional reliability)
            "--disable-extensions", // Removes extension interference
            "--disable-plugins", // Prevents plugin issues
            "--no-first-run", // Skips first-run setup
            "--disable-default-apps", // Removes default app prompts
            "--disable-translate", // Prevents translation popups
          ]
        : [], // Clean environment for local development
    },
  },

  /* Configure projects for major browsers */
  projects: [
    /*
     * Project configuration with conditional browser setup:
     *
     * 1. When shouldSkipBrowserInit is FALSE (normal mode):
     *    - We include the "setup" project that handles browser initialization
     *    - The "setup" project runs tests matching the *.setup.ts pattern
     *    - The "chromium" project depends on "setup" to ensure proper sequencing
     *    - This ensures authentication is properly established before tests run
     *
     * 2. When shouldSkipBrowserInit is TRUE (performance optimization):
     *    - We completely skip the "setup" project (empty array is spread)
     *    - The "chromium" project has no dependencies (empty dependencies array)
     *    - This optimization is useful for operations that don't need browser context
     *      like crypto or database-only operations
     *
     * In both cases, the "chromium" project uses the authentication state from
     * the file path specified in authStorageFilePath.
     */
    ...(!shouldSkipBrowserInit
      ? [
          {
            name: "setup",
            use: { ...devices["Desktop Chrome"] },
            testMatch: /.*\.setup\.ts/,
          },
        ]
      : []),
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: authStorageFilePath,
      },
      dependencies: shouldSkipBrowserInit ? [] : ["setup"],
    },
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'], storageState: authStorageFilePath },
    //   dependencies: shouldSkipBrowserInit ? [] : ['setup'],
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'], storageState: authStorageFilePath },
    //   dependencies: shouldSkipBrowserInit ? [] : ['setup'],
    // },
    // {
    //   name: "chromium",
    //   use: { ...devices["Desktop Chrome"] },
    // },

    // {
    //   name: "firefox",
    //   use: { ...devices["Desktop Firefox"] },
    // },

    // {
    //   name: "webkit",
    //   use: { ...devices["Desktop Safari"] },
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
