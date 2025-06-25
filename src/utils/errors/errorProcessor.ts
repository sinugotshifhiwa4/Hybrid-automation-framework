// import DataSanitizer from "../sanitization/dataSanitizer";
// import { CustomError } from "./customError";
// import { ErrorCategory } from "../../config/coreTypes/errors/error-category.enum";
// import { ErrorPatterns } from "./errorPatterns";
// import {
//   ErrorDetails,
//   PlaywrightMatcherResult,
// } from "../../config/coreTypes/errors/error-handler.types";

// export default class ErrorProcessor {
//   /**
//    * Create a standardized error object with source, context, message, and category.
//    * HTTP details are added if the error is an Axios error.
//    * @param error - The error object to process.
//    * @param source - The source of the error.
//    * @param context - The context of the error (optional).
//    * @returns A structured error object with source, context, message, and category.
//    */
//   public static createErrorDetails(error: unknown, source: string, context?: string): ErrorDetails {
//     // Analyze the error to get category and context
//     const analysis = this.categorizeError(error);

//     // Base error details
//     const details: ErrorDetails = {
//       source,
//       context: context || analysis.context,
//       message: this.getErrorMessage(error),
//       category: analysis.category,
//       timestamp: new Date().toISOString(),
//       environment: process.env.ENV || "dev",
//       version: process.env.APP_VERSION,
//     };

//     return details;
//   }

//   /**
//    * Clean any error message by stripping ANSI sequences and keeping only first line
//    */
//   public static sanitizeErrorMessage(message: string): string {
//     if (!message) return "";

//     // First sanitize the string using SanitizationConfig
//     let cleaned = DataSanitizer.sanitizeString(message);

//     // Strip ANSI escape sequences
//     // Using the decimal code for ESC (27) in a character class
//     const ESC = String.fromCharCode(27);
//     cleaned = cleaned.replace(
//       new RegExp(ESC + "\\[\\d+(?:;\\d+)*m|" + ESC + "\\??[0-9;]*[A-Za-z]", "g"),
//       "",
//     );

//     // Strip error prefix and quotes
//     cleaned = cleaned.replace(/^'Error: |^'|'$/g, "");

//     // Only keep first line (common pattern in stacktraces)
//     return cleaned.split("\n")[0];
//   }

//   /**
//    * Get the error message from any error type
//    */
//   public static getErrorMessage(error: unknown): string {
//     if (error instanceof Error) {
//       return this.sanitizeErrorMessage(error.message);
//     }

//     if (typeof error === "string") {
//       return this.sanitizeErrorMessage(error);
//     }

//     // Handle error-like objects
//     if (error && typeof error === "object") {
//       const errorObj = error as Record<string, unknown>;

//       // Try different message properties
//       const messageProps = ["message", "error", "description", "detail"];
//       for (const prop of messageProps) {
//         if (typeof errorObj[prop] === "string") {
//           return this.sanitizeErrorMessage(errorObj[prop]);
//         }
//       }

//       // Try to stringify if it looks like an error object
//       if ("name" in errorObj || "code" in errorObj) {
//         return this.sanitizeErrorMessage(JSON.stringify(errorObj));
//       }
//     }

//     return "Unknown error occurred";
//   }

//   /**
//    * Create a cache key for error deduplication
//    */
//   public static generateErrorCacheKey(details: ErrorDetails): string {
//     return `${details.source}_${details.category}_${
//       details.statusCode || "0"
//     }_${details.message.substring(0, 30)}`;
//   }

//   /**
//    * Extract additional details from error objects
//    */
//   public static extractAdditionalErrorDetails(error: unknown): Record<string, unknown> {
//     // Handle Playwright matcher results
//     if (this.isPlaywrightError(error)) {
//       return this.extractPlaywrightDetails(error);
//     }

//     // Handle general objects
//     if (typeof error === "object" && error !== null) {
//       return this.sanitizeErrorObject(error as Record<string, unknown>);
//     }

//     return {};
//   }

//   /**
//    * Sanitize object for safe logging, using SanitizationConfig
//    */
//   public static sanitizeErrorObject(obj: Record<string, unknown>): Record<string, unknown> {
//     if (!obj) return {};

//     // Define custom sanitization parameters
//     const customSanitizationParams = {
//       ...DataSanitizer.getDefaultParams(),
//       skipProperties: ["stack"],
//       truncateUrls: true,
//       maxStringLength: 1000,
//     };

//     // Use a single sanitization call
//     return DataSanitizer.sanitizeData(obj, customSanitizationParams);
//   }

//   // PRIVATE HELPER METHODS BELOW

//   private static categorizeError(error: unknown): { category: ErrorCategory; context: string } {
//     // Check for native JavaScript errors first (common in browser automation)
//     const jsErrorResult = this.analyzeJavaScriptError(error);
//     if (jsErrorResult.category !== ErrorCategory.UNKNOWN) {
//       return jsErrorResult;
//     }

//     // Check for Playwright-specific errors (highest priority for UI automation)
//     if (this.isPlaywrightError(error)) {
//       return this.analyzePlaywrightError(error);
//     }

//     // Check for browser-specific errors
//     const browserErrorResult = this.analyzeBrowserError(error);
//     if (browserErrorResult.category !== ErrorCategory.UNKNOWN) {
//       return browserErrorResult;
//     }

//     // Check for HTTP/API errors (important for API testing)
//     const httpErrorResult = this.analyzeHttpError(error);
//     if (httpErrorResult.category !== ErrorCategory.UNKNOWN) {
//       return httpErrorResult;
//     }

//     // Check for system errors with codes
//     if (error instanceof Error && "code" in error) {
//       const systemResult = this.analyzeSystemError(error as Error & { code?: string | undefined });
//       if (systemResult) return systemResult;
//     }

//     // Check for timeout patterns (critical in UI automation)
//     if (this.isTimeoutError(error)) {
//       return {
//         category: ErrorCategory.TIMEOUT,
//         context: "Timeout Error",
//       };
//     }

//     // Handle CustomError/AppError
//     if (error instanceof CustomError) {
//       return this.analyzeAppError(error);
//     }

//     // Analyze error message for patterns
//     const messageAnalysisResult = this.analyzeErrorMessage(error);
//     if (messageAnalysisResult.category !== ErrorCategory.UNKNOWN) {
//       return messageAnalysisResult;
//     }

//     // Default fallback with error name if available
//     const result = {
//       category: ErrorCategory.UNKNOWN,
//       context: "General Error",
//     };

//     if (error instanceof Error && error.name) {
//       result.context = `${error.name} Error`;
//     }

//     return result;
//   }

//   /**
//    * Analyze Playwright-specific errors with enhanced detection
//    */
//   private static analyzePlaywrightError(
//     error: Error & { matcherResult?: PlaywrightMatcherResult },
//   ): { category: ErrorCategory; context: string } {
//     const errorMessage = error.message.toLowerCase();

//     // Priority-based error analysis for common Playwright patterns

//     // Screenshot-specific errors (high priority)
//     if (
//       /\bscreenshot\s+(?:failed|timeout|error)\b/.test(errorMessage) ||
//       error.matcherResult?.name?.includes("screenshot")
//     ) {
//       return {
//         category: ErrorCategory.SCREENSHOT_ERROR,
//         context: "Playwright Screenshot Error",
//       };
//     }

//     // Download/Upload errors
//     if (
//       /\bdownload\s+(?:failed|timeout)\b/.test(errorMessage) ||
//       /\bwaitForDownload\b/.test(errorMessage)
//     ) {
//       return {
//         category: ErrorCategory.DOWNLOAD_ERROR,
//         context: "Playwright Download Error",
//       };
//     }

//     if (
//       /\bupload\s+(?:failed|timeout)\b/.test(errorMessage) ||
//       /\bsetInputFiles\b/.test(errorMessage)
//     ) {
//       return {
//         category: ErrorCategory.UPLOAD_ERROR,
//         context: "Playwright Upload Error",
//       };
//     }

//     // Cookie-related errors
//     if (
//       /\bcookie\s+(?:set|get|delete)\s+(?:failed|error)\b/.test(errorMessage) ||
//       /\bpage\.(?:addCookie|getCookies|deleteCookies)\b/.test(errorMessage)
//     ) {
//       return {
//         category: ErrorCategory.COOKIE_ERROR,
//         context: "Playwright Cookie Error",
//       };
//     }

//     // Storage-related errors
//     if (
//       /\b(?:localStorage|sessionStorage)\s+(?:access|error|not\s+available)\b/.test(errorMessage) ||
//       /\bpage\.evaluate.*(?:localStorage|sessionStorage)\b/.test(errorMessage)
//     ) {
//       return {
//         category: ErrorCategory.STORAGE_ERROR,
//         context: "Playwright Storage Error",
//       };
//     }

//     // Navigation errors
//     if (/\b(?:goto|navigation|waitForNavigation)\b/.test(errorMessage)) {
//       return {
//         category: ErrorCategory.NAVIGATION,
//         context: "Playwright Navigation Error",
//       };
//     }

//     // IFrame specific errors (check before generic frame errors)
//     if (
//       /\biframe\b/.test(errorMessage) ||
//       /\bframe\b/.test(errorMessage) ||
//       /\bframeLocator\b/.test(errorMessage)
//     ) {
//       if (/\btimeout\b/.test(errorMessage)) {
//         return {
//           category: ErrorCategory.FRAME_TIMEOUT,
//           context: "Playwright Frame Timeout Error",
//         };
//       }
//       return {
//         category: ErrorCategory.IFRAME_ERROR,
//         context: "Playwright IFrame Error",
//       };
//     }

//     // Interaction errors - Keyboard
//     if (
//       /\bkeyboard\.(?:press|type|down|up)\b/.test(errorMessage) ||
//       /\bpage\.keyboard\b/.test(errorMessage) ||
//       /\blocator\.(?:press|type)\b/.test(errorMessage)
//     ) {
//       return {
//         category: ErrorCategory.KEYBOARD_ERROR,
//         context: "Playwright Keyboard Error",
//       };
//     }

//     // Interaction errors - Mouse
//     if (
//       /\bmouse\.(?:click|move|wheel|down|up)\b/.test(errorMessage) ||
//       /\bpage\.mouse\b/.test(errorMessage)
//     ) {
//       return {
//         category: ErrorCategory.MOUSE_ERROR,
//         context: "Playwright Mouse Error",
//       };
//     }

//     // Drag and drop errors
//     if (
//       /\bdrag\s+(?:and\s+)?drop\b/.test(errorMessage) ||
//       /\blocator\.dragTo\b/.test(errorMessage) ||
//       /\bdragAndDrop\b/.test(errorMessage)
//     ) {
//       return {
//         category: ErrorCategory.DRAG_DROP_ERROR,
//         context: "Playwright Drag Drop Error",
//       };
//     }

//     // Hover errors
//     if (
//       /\bhover\b/.test(errorMessage) ||
//       /\blocator\.hover\b/.test(errorMessage) ||
//       /\bpage\.hover\b/.test(errorMessage)
//     ) {
//       return {
//         category: ErrorCategory.HOVER_ERROR,
//         context: "Playwright Hover Error",
//       };
//     }

//     // Locator errors - more specific pattern matching
//     if (/\blocator\./.test(errorMessage)) {
//       if (/\blocator\.(?:fill|type)\b/.test(errorMessage)) {
//         return {
//           category: ErrorCategory.ELEMENT,
//           context: "Playwright Input Error",
//         };
//       }

//       if (/\blocator\.click\b/.test(errorMessage)) {
//         return {
//           category: ErrorCategory.ELEMENT,
//           context: "Playwright Click Error",
//         };
//       }

//       return {
//         category: ErrorCategory.LOCATOR,
//         context: "Playwright Locator Error",
//       };
//     }

//     // Selector errors
//     if (/\b(?:selector|invalid\s+selector|selector\s+resolved\s+to)\b/.test(errorMessage)) {
//       return {
//         category: ErrorCategory.SELECTOR,
//         context: "Playwright Selector Error",
//       };
//     }

//     // Wait condition errors
//     if (
//       /\bwait\s+for\s+(?:condition|state|function)\b/.test(errorMessage) ||
//       /\bwaitFor(?:Condition|State|Function)\b/.test(errorMessage) ||
//       /\bpage\.waitFor(?:Condition|State|Function)\b/.test(errorMessage)
//     ) {
//       return {
//         category: ErrorCategory.WAIT_CONDITION_ERROR,
//         context: "Playwright Wait Condition Error",
//       };
//     }

//     // Element state errors
//     if (
//       /\belement\s+(?:state|condition)\b/.test(errorMessage) ||
//       /\bwait\s+for\s+element\s+state\b/.test(errorMessage) ||
//       /\blocator\.waitFor\b/.test(errorMessage) ||
//       /\b(?:not\s+visible|not\s+attached|element\s+is\s+not\s+attached)\b/.test(errorMessage)
//     ) {
//       return {
//         category: ErrorCategory.ELEMENT_STATE_ERROR,
//         context: "Playwright Element State Error",
//       };
//     }

//     // Tab management errors
//     if (
//       /\btab\b/.test(errorMessage) ||
//       /\bpage\.bringToFront\b/.test(errorMessage) ||
//       /\bmultiple\s+(?:pages|tabs)\b/.test(errorMessage)
//     ) {
//       return {
//         category: ErrorCategory.TAB_ERROR,
//         context: "Playwright Tab Error",
//       };
//     }

//     // Context errors
//     if (
//       /\bcontext\b/.test(errorMessage) ||
//       /\bbrowserContext\b/.test(errorMessage) ||
//       /\bnewContext\b/.test(errorMessage)
//     ) {
//       return {
//         category: ErrorCategory.CONTEXT_ERROR,
//         context: "Playwright Context Error",
//       };
//     }

//     // Scroll errors
//     if (
//       /\bscroll\b/.test(errorMessage) ||
//       /\bscrollIntoView\b/.test(errorMessage) ||
//       /\bpage\.evaluate.*scroll\b/.test(errorMessage)
//     ) {
//       return {
//         category: ErrorCategory.SCROLL_ERROR,
//         context: "Playwright Scroll Error",
//       };
//     }

//     // Viewport errors
//     if (
//       /\bviewport\b/.test(errorMessage) ||
//       /\bsetViewportSize\b/.test(errorMessage) ||
//       /\bpage\.setViewportSize\b/.test(errorMessage)
//     ) {
//       return {
//         category: ErrorCategory.VIEWPORT_ERROR,
//         context: "Playwright Viewport Error",
//       };
//     }

//     // Text verification errors
//     if (
//       /\bexpect.*(?:toHaveText|toContainText|textContent)\b/.test(errorMessage) ||
//       /\btext\s+(?:assertion|verification)\b/.test(errorMessage)
//     ) {
//       return {
//         category: ErrorCategory.TEXT_VERIFICATION_ERROR,
//         context: "Playwright Text Verification Error",
//       };
//     }

//     // Timeout errors in Playwright context
//     if (this.isTimeoutError(error)) {
//       return {
//         category: ErrorCategory.TIMEOUT,
//         context: "Playwright Timeout Error",
//       };
//     }

//     // Generic Playwright test/assertion error
//     return {
//       category: ErrorCategory.TEST,
//       context: `Playwright Test Error: ${error.matcherResult?.name || "Unknown"}`,
//     };
//   }

//   /**
//    * Analyze Node.js system errors
//    */
//   private static analyzeSystemError(
//     error: Error & { code?: string | undefined },
//   ): { category: ErrorCategory; context: string } | null {
//     if (!error.code) return null;

//     const systemCategory = this.mapSystemErrorToCategory(error);
//     if (systemCategory) {
//       return {
//         category: systemCategory,
//         context: this.mapSystemErrorToContext(error),
//       };
//     }

//     return null;
//   }

//   /**
//    * Check if an error is a timeout error based on its message
//    */
//   private static isTimeoutError(error: unknown): boolean {
//     const errorMessage = this.getErrorMessage(error).toLowerCase();

//     // More precise timeout detection
//     const timeoutPatterns = [
//       /timeout.*exceeded/,
//       /timed\s+out/,
//       /timeout.*\d+ms/,
//       /wait.*timeout/,
//       /navigation.*timeout/,
//       /locator.*timeout/,
//       /expect.*timeout/,
//     ];

//     return timeoutPatterns.some((pattern) => pattern.test(errorMessage));
//   }

//   /**
//    * Analyze AppError instances
//    */
//   private static analyzeAppError(error: CustomError): { category: ErrorCategory; context: string } {
//     return {
//       category:
//         error.category in ErrorCategory ? (error.category as ErrorCategory) : ErrorCategory.UNKNOWN,
//       context: `App Error: ${(error.category as string) || "Unknown"}`,
//     };
//   }

//   /**
//    * Analyze error messages for patterns that indicate specific categories
//    */
//   private static analyzeErrorMessage(error: unknown): { category: ErrorCategory; context: string } {
//     const result = {
//       category: ErrorCategory.UNKNOWN,
//       context: "General Error",
//     };

//     const errorMessage =
//       typeof error === "string"
//         ? error.toLowerCase()
//         : error instanceof Error
//           ? error.message.toLowerCase()
//           : String(error).toLowerCase();

//     // Check against our category-keyword map
//     const categoryMatch = this.extractCategoryFromMessage(errorMessage);
//     if (categoryMatch) {
//       result.category = categoryMatch.category;
//       result.context = categoryMatch.context;
//     }

//     return result;
//   }

//   /**
//    * Comprehensive enhanced category-context mapping with all error categories
//    * Combines UI automation, interaction, security, and browser management errors
//    */
//   private static extractCategoryFromMessage(
//     errorMessage: string,
//   ): { category: ErrorCategory; context: string } | null {
//     const normalized = errorMessage.toLowerCase().trim();

//     // Comprehensive category-context mapping with all error types
//     const categoryContextMap = [
//       // Browser and page errors (highest priority for UI automation)
//       {
//         category: ErrorCategory.BROWSER_ERROR,
//         context: "Browser Error",
//         patterns: [
//           /\bbrowser\s+(?:closed|crashed|disconnected)\b/,
//           /\b(?:chromium|firefox|webkit)\s+(?:error|crashed)\b/,
//           /\bbrowser\s+context\s+(?:closed|invalid)\b/,
//         ],
//       },
//       {
//         category: ErrorCategory.PAGE_ERROR,
//         context: "Page Error",
//         patterns: [
//           /\bpage\s+(?:closed|crashed)\b/,
//           /\bpage\.goto\s+failed\b/,
//           /\btarget\s+page\s+(?:closed|crashed)\b/,
//           /\bpage\s+navigation\s+failed\b/,
//         ],
//       },
//       {
//         category: ErrorCategory.FRAME_ERROR,
//         context: "Frame Error",
//         patterns: [
//           /\bframe\s+(?:detached|not\s+found)\b/,
//           /\biframe\s+(?:error|not\s+accessible|not\s+found)\b/,
//           /\bframe\.locator\s+failed\b/,
//           /\bframe\s+(?:access|loading|content)\s+(?:error|denied)\b/,
//           /\bcross\s+frame\s+(?:error|access\s+denied)\b/,
//           /\biframe\s+(?:security|sandbox)\s+(?:error|violation)\b/,
//         ],
//       },
//       {
//         category: ErrorCategory.IFRAME_ERROR,
//         context: "IFrame Error",
//         patterns: [
//           /\biframe\s+(?:error|not\s+accessible|not\s+found)\b/,
//           /\bframe\s+(?:access|loading|content)\s+(?:error|denied)\b/,
//           /\bcross\s+frame\s+(?:error|access\s+denied)\b/,
//           /\biframe\s+(?:security|sandbox)\s+(?:error|violation)\b/,
//         ],
//       },
//       {
//         category: ErrorCategory.FRAME_TIMEOUT,
//         context: "Frame Timeout Error",
//         patterns: [
//           /\bframe\s+(?:load|loading)\s+timeout\b/,
//           /\biframe\s+(?:load|loading)\s+timeout\b/,
//           /\bframe\s+(?:ready|available)\s+timeout\b/,
//           /\bwait\s+for\s+frame\s+timeout\b/,
//         ],
//       },

//       // UI interaction errors
//       {
//         category: ErrorCategory.ELEMENT,
//         context: "Element Interaction Error",
//         patterns: [
//           /\belement\s+(?:not\s+visible|not\s+attached|not\s+interactable)\b/,
//           /\belement\s+is\s+(?:not\s+attached|hidden|disabled)\b/,
//           /\bno\s+such\s+element\b/,
//         ],
//       },
//       {
//         category: ErrorCategory.LOCATOR,
//         context: "Locator Error",
//         patterns: [
//           /\blocator\.(?:fill|click|type|clear|hover)\s+failed\b/,
//           /\blocator\s+(?:not\s+found|timed\s+out)\b/,
//           /\bwaiting\s+for\s+locator\b/,
//         ],
//       },
//       {
//         category: ErrorCategory.SELECTOR,
//         context: "Selector Error",
//         patterns: [
//           /\binvalid\s+selector\b/,
//           /\bselector\s+resolved\s+to\b/,
//           /\bmalformed\s+selector\b/,
//           /\bcss\s+selector\s+(?:error|invalid)\b/,
//         ],
//       },
//       {
//         category: ErrorCategory.ELEMENT_STATE_ERROR,
//         context: "Element State Error",
//         patterns: [
//           /\belement\s+(?:state|condition)\s+(?:invalid|unexpected|error)\b/,
//           /\belement\s+(?:not\s+in\s+expected\s+state|state\s+mismatch)\b/,
//           /\belement\s+(?:disabled|hidden|readonly)\s+(?:state|error)\b/,
//           /\belement\s+(?:enabled|visible|editable)\s+(?:check|validation)\s+failed\b/,
//         ],
//       },

//       // Cookie and session management errors
//       {
//         category: ErrorCategory.COOKIE_ERROR,
//         context: "Cookie Error",
//         patterns: [
//           /\bcookie\s+(?:failed|error|invalid|expired)\b/,
//           /\bset\s+cookie\s+(?:failed|error)\b/,
//           /\bcookie\s+(?:not\s+found|missing)\b/,
//           /\bcookie\s+(?:security|samesite)\s+error\b/,
//         ],
//       },
//       {
//         category: ErrorCategory.SESSION_ERROR,
//         context: "Session Error",
//         patterns: [
//           /\bsession\s+(?:expired|invalid|not\s+found|timeout)\b/,
//           /\bsession\s+(?:failed|error)\b/,
//           /\bsession\s+(?:storage|management)\s+error\b/,
//         ],
//       },
//       {
//         category: ErrorCategory.STORAGE_ERROR,
//         context: "Storage Error",
//         patterns: [
//           /\b(?:localStorage|sessionStorage|indexedDB)\s+(?:error|failed|not\s+supported)\b/,
//           /\bstorage\s+(?:quota|limit)\s+exceeded\b/,
//           /\bweb\s+storage\s+(?:error|unavailable)\b/,
//           /\bstorage\s+(?:access|permission)\s+denied\b/,
//         ],
//       },

//       // Interaction errors
//       {
//         category: ErrorCategory.KEYBOARD_ERROR,
//         context: "Keyboard Error",
//         patterns: [
//           /\bkeyboard\s+(?:error|failed|not\s+working)\b/,
//           /\bkey\s+(?:press|down|up)\s+(?:failed|error)\b/,
//           /\btype\s+(?:failed|error)\b/,
//           /\binput\s+method\s+(?:error|failed)\b/,
//         ],
//       },
//       {
//         category: ErrorCategory.MOUSE_ERROR,
//         context: "Mouse Error",
//         patterns: [
//           /\bmouse\s+(?:error|failed|not\s+working)\b/,
//           /\bclick\s+(?:failed|error|not\s+working)\b/,
//           /\bmouse\s+(?:move|hover|drag)\s+(?:failed|error)\b/,
//           /\bpointer\s+(?:events|error)\b/,
//         ],
//       },
//       {
//         category: ErrorCategory.GESTURE_ERROR,
//         context: "Gesture Error",
//         patterns: [
//           /\btouch\s+(?:gesture|event)\s+(?:failed|error)\b/,
//           /\bswipe\s+(?:failed|error|not\s+supported)\b/,
//           /\bpinch\s+(?:zoom|gesture)\s+(?:failed|error)\b/,
//           /\bmulti\s+touch\s+(?:failed|error)\b/,
//         ],
//       },
//       {
//         category: ErrorCategory.DRAG_DROP_ERROR,
//         context: "Drag and Drop Error",
//         patterns: [
//           /\bdrag\s+(?:and\s+)?drop\s+(?:failed|error)\b/,
//           /\bdragstart\s+(?:failed|error)\b/,
//           /\bdrop\s+(?:failed|error|not\s+allowed)\b/,
//           /\bdraggable\s+(?:error|not\s+supported)\b/,
//         ],
//       },
//       {
//         category: ErrorCategory.HOVER_ERROR,
//         context: "Hover Error",
//         patterns: [
//           /\bhover\s+(?:failed|error|not\s+working)\b/,
//           /\bmouseover\s+(?:failed|error)\b/,
//           /\bmouseenter\s+(?:failed|error)\b/,
//           /\bhover\s+(?:state|effect)\s+(?:failed|error)\b/,
//         ],
//       },

//       // Wait and state condition errors
//       {
//         category: ErrorCategory.WAIT_CONDITION_ERROR,
//         context: "Wait Condition Error",
//         patterns: [
//           /\bwait\s+(?:for|until)\s+(?:condition|state)\s+(?:failed|timeout)\b/,
//           /\bwait\s+for\s+(?:element|text|attribute)\s+(?:failed|timeout)\b/,
//           /\bexpected\s+condition\s+(?:not\s+met|failed|timeout)\b/,
//           /\bwait\s+condition\s+(?:never|not)\s+(?:satisfied|met)\b/,
//         ],
//       },

//       // Tab and window management
//       {
//         category: ErrorCategory.TAB_ERROR,
//         context: "Tab Error",
//         patterns: [
//           /\btab\s+(?:switch|change|focus)\s+(?:failed|error)\b/,
//           /\btab\s+(?:not\s+found|closed|invalid)\b/,
//           /\btab\s+(?:creation|opening)\s+(?:failed|error)\b/,
//           /\bmultiple\s+tabs\s+(?:error|issue)\b/,
//         ],
//       },
//       {
//         category: ErrorCategory.WINDOW_ERROR,
//         context: "Window Error",
//         patterns: [
//           /\bwindow\s+(?:switch|focus|resize)\s+(?:failed|error)\b/,
//           /\bwindow\s+(?:not\s+found|closed|invalid)\b/,
//           /\bpopup\s+(?:window|blocked|error)\b/,
//           /\bwindow\s+(?:handle|reference)\s+(?:invalid|lost)\b/,
//         ],
//       },
//       {
//         category: ErrorCategory.CONTEXT_ERROR,
//         context: "Context Error",
//         patterns: [
//           /\bbrowser\s+context\s+(?:error|invalid|closed)\b/,
//           /\bcontext\s+(?:switch|creation|management)\s+(?:failed|error)\b/,
//           /\bisolated\s+context\s+(?:error|failed)\b/,
//           /\bcontext\s+(?:not\s+found|expired|invalid)\b/,
//         ],
//       },

//       // Scroll and viewport errors
//       {
//         category: ErrorCategory.SCROLL_ERROR,
//         context: "Scroll Error",
//         patterns: [
//           /\bscroll\s+(?:into\s+view\s+)?(?:failed|error|not\s+working)\b/,
//           /\bscroll\s+(?:to\s+)?(?:element|position)\s+(?:failed|error)\b/,
//           /\bscrollable\s+(?:area|container)\s+(?:not\s+found|error)\b/,
//           /\bscroll\s+(?:behavior|animation)\s+(?:failed|error)\b/,
//         ],
//       },
//       {
//         category: ErrorCategory.VIEWPORT_ERROR,
//         context: "Viewport Error",
//         patterns: [
//           /\bviewport\s+(?:size|dimensions|resize)\s+(?:failed|error)\b/,
//           /\bviewport\s+(?:not\s+set|invalid|error)\b/,
//           /\bscreen\s+resolution\s+(?:error|not\s+supported)\b/,
//           /\bdevice\s+viewport\s+(?:error|mismatch)\b/,
//         ],
//       },

//       // CSS and styling errors
//       {
//         category: ErrorCategory.CSS_ERROR,
//         context: "CSS Error",
//         patterns: [
//           /\bcss\s+(?:selector|rule|property)\s+(?:error|invalid)\b/,
//           /\bstyle\s+(?:computation|application)\s+(?:failed|error)\b/,
//           /\bcss\s+(?:parsing|syntax)\s+error\b/,
//           /\bstylesheet\s+(?:loading|error|not\s+found)\b/,
//         ],
//       },
//       {
//         category: ErrorCategory.STYLE_ERROR,
//         context: "Style Error",
//         patterns: [
//           /\bstyle\s+(?:property|attribute)\s+(?:error|invalid|not\s+found)\b/,
//           /\bcomputed\s+style\s+(?:error|failed|unavailable)\b/,
//           /\binline\s+style\s+(?:error|invalid)\b/,
//           /\bstyle\s+(?:inheritance|cascade)\s+(?:error|issue)\b/,
//         ],
//       },

//       // Text and content verification
//       {
//         category: ErrorCategory.TEXT_VERIFICATION_ERROR,
//         context: "Text Verification Error",
//         patterns: [
//           /\btext\s+(?:verification|validation|check)\s+(?:failed|error)\b/,
//           /\btext\s+(?:content|value)\s+(?:mismatch|incorrect|error)\b/,
//           /\bexpected\s+text\s+(?:not\s+found|different|error)\b/,
//           /\btext\s+(?:assertion|comparison)\s+(?:failed|error)\b/,
//         ],
//       },
//       {
//         category: ErrorCategory.CONTENT_MISMATCH_ERROR,
//         context: "Content Mismatch Error",
//         patterns: [
//           /\bcontent\s+(?:mismatch|different|unexpected)\b/,
//           /\bpage\s+content\s+(?:changed|incorrect|error)\b/,
//           /\bexpected\s+content\s+(?:not\s+found|missing)\b/,
//           /\bcontent\s+(?:verification|validation)\s+(?:failed|error)\b/,
//         ],
//       },

//       // Security and sanitization
//       {
//         category: ErrorCategory.SANITIZATION_ERROR,
//         context: "Sanitization Error",
//         patterns: [
//           /\bsanitization\s+(?:failed|error|invalid)\b/,
//           /\bdata\s+sanitization\s+(?:error|failed)\b/,
//           /\binput\s+sanitization\s+(?:failed|error)\b/,
//           /\bsanitize\s+(?:function|method)\s+(?:failed|error)\b/,
//         ],
//       },

//       // Data generation and utility errors
//       {
//         category: ErrorCategory.DATA_GENERATION_ERROR,
//         context: "Data Generation Error",
//         patterns: [
//           /\brandom\s+(?:data|string|number)\s+generation\s+(?:failed|error)\b/,
//           /\btest\s+data\s+(?:generation|creation)\s+(?:failed|error)\b/,
//           /\bmock\s+data\s+(?:generation|error)\b/,
//           /\bfake\s+data\s+(?:generation|error)\b/,
//         ],
//       },

//       // Compound action errors
//       {
//         category: ErrorCategory.COMPOUND_ACTION_ERROR,
//         context: "Compound Action Error",
//         patterns: [
//           /\b(?:hover\s+and\s+click|multi\s+step\s+action)\s+(?:failed|error)\b/,
//           /\bcompound\s+(?:action|interaction)\s+(?:failed|error|interrupted)\b/,
//           /\bsequential\s+(?:actions|steps)\s+(?:failed|error)\b/,
//           /\bchained\s+(?:actions|operations)\s+(?:failed|error)\b/,
//         ],
//       },

//       // File operations (common in UI testing)
//       {
//         category: ErrorCategory.SCREENSHOT_ERROR,
//         context: "Screenshot Error",
//         patterns: [/\bscreenshot\s+(?:failed|timeout|error)\b/, /\bpage\.screenshot\s+failed\b/],
//       },
//       {
//         category: ErrorCategory.DOWNLOAD_ERROR,
//         context: "Download Error",
//         patterns: [
//           /\bdownload\s+(?:failed|timeout|error)\b/,
//           /\bwaitForDownload\s+(?:failed|timeout)\b/,
//         ],
//       },
//       {
//         category: ErrorCategory.UPLOAD_ERROR,
//         context: "Upload Error",
//         patterns: [
//           /\bupload\s+(?:failed|timeout|error)\b/,
//           /\bsetInputFiles\s+(?:failed|error)\b/,
//           /\bfile\s+upload\s+(?:failed|error)\b/,
//         ],
//       },

//       // Network and API errors
//       {
//         category: ErrorCategory.INTERCEPT,
//         context: "Network Interception Error",
//         patterns: [
//           /\bpage\.route\s+(?:failed|error)\b/,
//           /\brequest\s+interception\s+(?:failed|error)\b/,
//           /\bmock\s+response\s+(?:failed|error)\b/,
//         ],
//       },
//       {
//         category: ErrorCategory.CORS,
//         context: "CORS Error",
//         patterns: [
//           /\bcors\s+(?:error|policy)\b/,
//           /\bcross-origin\s+(?:request|error)\b/,
//           /\baccess-control-allow-origin\b/,
//         ],
//       },
//       {
//         category: ErrorCategory.TOKEN_EXPIRED,
//         context: "Token Expired Error",
//         patterns: [
//           /\btoken\s+(?:expired|invalid)\b/,
//           /\bjwt\s+(?:expired|invalid)\b/,
//           /\baccess\s+token\s+(?:expired|invalid)\b/,
//         ],
//       },

//       // Test execution
//       {
//         category: ErrorCategory.RETRY_EXHAUSTED,
//         context: "Retry Exhausted Error",
//         patterns: [
//           /\bretry\s+(?:exhausted|limit\s+reached)\b/,
//           /\bmax\s+retries\s+(?:reached|exceeded)\b/,
//           /\ball\s+retries\s+failed\b/,
//         ],
//       },
//       {
//         category: ErrorCategory.FIXTURE,
//         context: "Test Fixture Error",
//         patterns: [
//           /\bfixture\s+(?:failed|error)\b/,
//           /\b(?:before|after)\s+(?:each|all)\s+(?:failed|error)\b/,
//           /\bsetup\s+(?:failed|error)\b/,
//         ],
//       },

//       // HTTP errors (important for API testing)
//       {
//         category: ErrorCategory.RATE_LIMIT,
//         context: "Rate Limit Error",
//         patterns: [
//           /\brate\s+limit\s+(?:exceeded|error)\b/,
//           /\btoo\s+many\s+requests\b/,
//           /\bquota\s+exceeded\b/,
//           /\bthrottled\b/,
//           /\b429\b/,
//         ],
//       },
//       {
//         category: ErrorCategory.HTTP_CLIENT,
//         context: "HTTP Client Error",
//         patterns: [
//           /\b(?:400|401|403|404|409|422)\b/,
//           /\bclient\s+error\b/,
//           /\bbad\s+request\b/,
//           /\bunauthorized\b/,
//           /\bforbidden\b/,
//           /\bnot\s+found\b/,
//         ],
//       },
//       {
//         category: ErrorCategory.HTTP_SERVER,
//         context: "HTTP Server Error",
//         patterns: [
//           /\b(?:500|502|503|504)\b/,
//           /\bserver\s+error\b/,
//           /\binternal\s+server\s+error\b/,
//           /\bservice\s+unavailable\b/,
//           /\bgateway\s+timeout\b/,
//         ],
//       },

//       // Timeout (critical in UI automation)
//       {
//         category: ErrorCategory.TIMEOUT,
//         context: "Timeout Error",
//         patterns: [
//           /\btimeout\s+(?:exceeded|error)\b/,
//           /\btimed\s+out\b/,
//           /\bwait\s+timeout\b/,
//           /\bnavigation\s+timeout\b/,
//           /\blocator\s+timeout\b/,
//         ],
//       },

//       // Authentication/Authorization
//       {
//         category: ErrorCategory.AUTHENTICATION,
//         context: "Authentication Error",
//         patterns: [
//           /\bauthentication\s+(?:failed|error)\b/,
//           /\blogin\s+(?:failed|error)\b/,
//           /\binvalid\s+credentials\b/,
//         ],
//       },
//       {
//         category: ErrorCategory.AUTHORIZATION,
//         context: "Authorization Error",
//         patterns: [
//           /\bauthorization\s+(?:failed|error)\b/,
//           /\baccess\s+denied\b/,
//           /\bpermission\s+denied\b/,
//         ],
//       },

//       // Data and validation
//       {
//         category: ErrorCategory.VALIDATION,
//         context: "Validation Error",
//         patterns: [
//           /\bvalidation\s+(?:failed|error)\b/,
//           /\binvalid\s+(?:input|data|format)\b/,
//           /\bschema\s+(?:validation|error)\b/,
//         ],
//       },
//       {
//         category: ErrorCategory.PARSING,
//         context: "Parsing Error",
//         patterns: [
//           /\bparse\s+error\b/,
//           /\bjson\s+parse\s+error\b/,
//           /\bxml\s+parse\s+error\b/,
//           /\bparsing\s+failed\b/,
//         ],
//       },

//       // Network errors
//       {
//         category: ErrorCategory.NETWORK,
//         context: "Network Error",
//         patterns: [
//           /\bnetwork\s+(?:error|failure)\b/,
//           /\bdns\s+(?:error|failure)\b/,
//           /\bhost\s+unreachable\b/,
//           /\bconnection\s+(?:refused|reset|failed)\b/,
//         ],
//       },

//       // Generic fallbacks (should be last to avoid false positives)
//       {
//         category: ErrorCategory.NOT_FOUND,
//         context: "Not Found Error",
//         patterns: [/\bnot\s+found\b/, /\bdoes\s+not\s+exist\b/, /\bmissing\b/, /\bno\s+such\b/],
//       },
//     ];

//     // Efficient pattern matching - exit early on first match
//     for (const mapping of categoryContextMap) {
//       for (const pattern of mapping.patterns) {
//         if (pattern.test(normalized)) {
//           return {
//             category: mapping.category,
//             context: mapping.context,
//           };
//         }
//       }
//     }

//     return null;
//   }

//   private static mapSystemErrorToCategory(error: Error & { code?: string }): ErrorCategory | null {
//     if (!error.code) return null;

//     const codeMap: Record<string, ErrorCategory> = {
//       // File system errors (important for screenshots, downloads, reports)
//       ENOENT: ErrorCategory.FILE_NOT_FOUND,
//       EEXIST: ErrorCategory.FILE_EXISTS,
//       EACCES: ErrorCategory.ACCESS_DENIED,
//       EFBIG: ErrorCategory.FILE_TOO_LARGE,

//       // Network error codes (for API testing)
//       ECONNREFUSED: ErrorCategory.CONNECTION,
//       ECONNRESET: ErrorCategory.CONNECTION,
//       ETIMEDOUT: ErrorCategory.TIMEOUT,
//       EHOSTUNREACH: ErrorCategory.NETWORK,
//       ENETUNREACH: ErrorCategory.NETWORK,

//       // Permission and security
//       EPERM: ErrorCategory.SECURITY_ERROR,
//     };

//     return codeMap[error.code] || null;
//   }

//   private static mapSystemErrorToContext(error: Error & { code?: string }): string {
//     if (!error.code) return "System Error";

//     const contextMap: Record<string, string> = {
//       ENOENT: "File Not Found Error",
//       EEXIST: "File Already Exists Error",
//       EACCES: "File Access Denied Error",
//       EFBIG: "File Too Large Error",
//       ECONNREFUSED: "Connection Refused Error",
//       ECONNRESET: "Connection Reset Error",
//       ETIMEDOUT: "Connection Timeout Error",
//       EHOSTUNREACH: "Host Unreachable Error",
//       ENETUNREACH: "Network Unreachable Error",
//       EPERM: "Permission Denied Error",
//     };

//     return contextMap[error.code] || "System Error";
//   }

//   /**
//    * Type guard to safely check if an error is a Playwright error
//    */
//   private static isPlaywrightError(error: unknown): error is Error & {
//     matcherResult?: PlaywrightMatcherResult;
//   } {
//     if (!(error instanceof Error)) return false;

//     // Check for Playwright-specific properties or error patterns
//     return (
//       "matcherResult" in error ||
//       error.message.includes("playwright") ||
//       error.message.includes("locator") ||
//       error.message.includes("page.") ||
//       error.message.includes("expect(") ||
//       error.stack?.includes("playwright") ||
//       false
//     );
//   }

//   /**
//    * Extract details from Playwright errors
//    */
//   private static extractPlaywrightDetails(
//     error: Error & { matcherResult?: PlaywrightMatcherResult },
//   ): Record<string, unknown> {
//     const matcher = error.matcherResult;

//     if (!matcher) {
//       return {};
//     }

//     return {
//       name: matcher.name,
//       pass: matcher.pass,
//       expected: matcher.expected,
//       actual: matcher.actual,
//       message: matcher.message ? this.sanitizeErrorMessage(matcher.message) : undefined,
//       log: Array.isArray(matcher.log)
//         ? matcher.log
//             .filter((entry) => !entry.includes("http"))
//             .map((entry) => this.sanitizeErrorMessage(entry))
//         : undefined,
//     };
//   }

//   /**
//    * Analyze JavaScript native errors
//    */
//   private static analyzeJavaScriptError(error: unknown): {
//     category: ErrorCategory;
//     context: string;
//   } {
//     if (!(error instanceof Error)) {
//       return { category: ErrorCategory.UNKNOWN, context: "General Error" };
//     }

//     // Map JavaScript error types to categories
//     const jsErrorMap: Record<string, { category: ErrorCategory; context: string }> = {
//       TypeError: { category: ErrorCategory.TYPE_ERROR, context: "Type Error" },
//       ReferenceError: { category: ErrorCategory.REFERENCE_ERROR, context: "Reference Error" },
//       SyntaxError: { category: ErrorCategory.SYNTAX_ERROR, context: "Syntax Error" },
//       RangeError: { category: ErrorCategory.RANGE_ERROR, context: "Range Error" },
//     };

//     const errorMapping = jsErrorMap[error.name];
//     if (errorMapping) {
//       return errorMapping;
//     }

//     return { category: ErrorCategory.UNKNOWN, context: "General Error" };
//   }

//   /**
//    * Analyze browser-specific errors with improved pattern matching
//    */
//   private static analyzeBrowserError(error: unknown): { category: ErrorCategory; context: string } {
//     const errorMessage = this.getErrorMessage(error).toLowerCase();

//     // Browser crash/closure patterns
//     if (/\bbrowser\s+(?:has\s+been\s+closed|closed|crashed)\b/.test(errorMessage)) {
//       return { category: ErrorCategory.BROWSER_ERROR, context: "Browser Closed Error" };
//     }

//     // Page-related errors
//     if (
//       /\bpage\s+(?:has\s+been\s+closed|closed)\b/.test(errorMessage) ||
//       /\btarget\s+page\b/.test(errorMessage)
//     ) {
//       return { category: ErrorCategory.PAGE_ERROR, context: "Page Closed Error" };
//     }

//     // Frame-related errors
//     if (
//       /\bframe\b/.test(errorMessage) &&
//       (/\bdetached\b/.test(errorMessage) || /\bnot\s+found\b/.test(errorMessage))
//     ) {
//       return { category: ErrorCategory.FRAME_ERROR, context: "Frame Error" };
//     }

//     // Dialog handling errors
//     if (/\b(?:dialog|alert|confirm|prompt)\b/.test(errorMessage)) {
//       return { category: ErrorCategory.DIALOG, context: "Dialog Handling Error" };
//     }

//     // Network interception errors
//     if (
//       /\b(?:route|intercept|mock)\b/.test(errorMessage) ||
//       /\brequest\s+interception\b/.test(errorMessage)
//     ) {
//       return { category: ErrorCategory.INTERCEPT, context: "Network Interception Error" };
//     }

//     // Mobile context errors
//     if (
//       /\b(?:mobile|device)\b/.test(errorMessage) ||
//       (/\bviewport\b/.test(errorMessage) && /\bmobile\b/.test(errorMessage))
//     ) {
//       return { category: ErrorCategory.MOBILE_DEVICE, context: "Mobile Device Error" };
//     }

//     return { category: ErrorCategory.UNKNOWN, context: "General Error" };
//   }

//   /**
//    * Analyze HTTP/API errors with comprehensive status code handling
//    */
//   private static analyzeHttpError(error: unknown): { category: ErrorCategory; context: string } {
//     const errorMessage = this.getErrorMessage(error).toLowerCase();

//     // Check for HTTP status code patterns
//     if (error && typeof error === "object") {
//       // Define proper types for different error structures
//       interface AxiosLikeError {
//         response?: {
//           status?: number;
//         };
//       }

//       interface StatusError {
//         status?: number;
//         statusCode?: number;
//       }

//       // Type guard for Axios-style errors
//       function isAxiosLikeError(obj: object): obj is AxiosLikeError {
//         return (
//           "response" in obj &&
//           obj.response !== null &&
//           typeof obj.response === "object" &&
//           "status" in obj.response
//         );
//       }

//       // Type guard for status errors
//       function isStatusError(obj: object): obj is StatusError {
//         return "status" in obj || "statusCode" in obj;
//       }

//       // Axios-style errors
//       if (isAxiosLikeError(error)) {
//         const status = error.response?.status;
//         if (typeof status === "number") {
//           if (status >= 400 && status < 500) {
//             // Handle specific 4xx errors
//             switch (status) {
//               case 401:
//                 return {
//                   category: ErrorCategory.AUTHENTICATION,
//                   context: "Authentication Error (401)",
//                 };
//               case 403:
//                 return {
//                   category: ErrorCategory.AUTHORIZATION,
//                   context: "Authorization Error (403)",
//                 };
//               case 404:
//                 return { category: ErrorCategory.NOT_FOUND, context: "Not Found Error (404)" };
//               case 409:
//                 return { category: ErrorCategory.CONFLICT, context: "Conflict Error (409)" };
//               case 429:
//                 return { category: ErrorCategory.RATE_LIMIT, context: "Rate Limit Error (429)" };
//               default:
//                 return { category: ErrorCategory.HTTP_CLIENT, context: `Client Error (${status})` };
//             }
//           } else if (status >= 500) {
//             return { category: ErrorCategory.HTTP_SERVER, context: `Server Error (${status})` };
//           }
//         }
//       }

//       // Check for status code in error properties
//       if (isStatusError(error)) {
//         const status = error.status ?? error.statusCode;
//         if (typeof status === "number") {
//           if (status >= 400 && status < 500) {
//             return { category: ErrorCategory.HTTP_CLIENT, context: `Client Error (${status})` };
//           } else if (status >= 500) {
//             return { category: ErrorCategory.HTTP_SERVER, context: `Server Error (${status})` };
//           }
//         }
//       }
//     }

//     // CORS errors (common in web testing)
//     if (
//       errorMessage.includes("cors") ||
//       errorMessage.includes("cross-origin") ||
//       errorMessage.includes("access-control-allow-origin")
//     ) {
//       return { category: ErrorCategory.CORS, context: "CORS Error" };
//     }

//     // Token/JWT errors
//     if (
//       errorMessage.includes("token expired") ||
//       errorMessage.includes("jwt expired") ||
//       errorMessage.includes("token invalid")
//     ) {
//       return { category: ErrorCategory.TOKEN_EXPIRED, context: "Token Expired Error" };
//     }

//     // API version errors
//     if (
//       errorMessage.includes("api version") ||
//       errorMessage.includes("version not supported") ||
//       errorMessage.includes("deprecated api")
//     ) {
//       return { category: ErrorCategory.API_VERSION_ERROR, context: "API Version Error" };
//     }

//     return { category: ErrorCategory.UNKNOWN, context: "General Error" };
//   }
// }

import DataSanitizer from "../sanitization/dataSanitizer";
import { CustomError } from "./customError";
import { ErrorCategory } from "../../config/coreTypes/errors/error-category.enum";
import { ErrorPatterns } from "./errorPatterns";
import {
  ErrorDetails,
  PlaywrightMatcherResult,
  ErrorPatternGroup,
} from "../../config/coreTypes/errors/error-handler.types";

export default class ErrorProcessor {
  /**
   * Create a standardized error object with source, context, message, and category.
   * HTTP details are added if the error is an Axios error.
   * @param error - The error object to process.
   * @param source - The source of the error.
   * @param context - The context of the error (optional).
   * @returns A structured error object with source, context, message, and category.
   */
  public static createErrorDetails(error: unknown, source: string, context?: string): ErrorDetails {
    // Analyze the error to get category and context
    const analysis = this.categorizeError(error);

    // Base error details
    const details: ErrorDetails = {
      source,
      context: context || analysis.context,
      message: this.getErrorMessage(error),
      category: analysis.category,
      timestamp: new Date().toISOString(),
      environment: process.env.ENV || "dev",
      version: process.env.APP_VERSION,
    };

    return details;
  }

  /**
   * Clean any error message by stripping ANSI sequences and keeping only first line
   */
  public static sanitizeErrorMessage(message: string): string {
    if (!message) return "";

    // First sanitize the string using SanitizationConfig
    let cleaned = DataSanitizer.sanitizeString(message);

    // Strip ANSI escape sequences
    // Using the decimal code for ESC (27) in a character class
    const ESC = String.fromCharCode(27);
    cleaned = cleaned.replace(
      new RegExp(ESC + "\\[\\d+(?:;\\d+)*m|" + ESC + "\\??[0-9;]*[A-Za-z]", "g"),
      "",
    );

    // Strip error prefix and quotes
    cleaned = cleaned.replace(/^'Error: |^'|'$/g, "");

    // Only keep first line (common pattern in stacktraces)
    return cleaned.split("\n")[0];
  }

  /**
   * Get the error message from any error type
   */
  public static getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return this.sanitizeErrorMessage(error.message);
    }

    if (typeof error === "string") {
      return this.sanitizeErrorMessage(error);
    }

    // Handle error-like objects
    if (error && typeof error === "object") {
      const errorObj = error as Record<string, unknown>;

      // Try different message properties
      const messageProps = ["message", "error", "description", "detail"];
      for (const prop of messageProps) {
        if (typeof errorObj[prop] === "string") {
          return this.sanitizeErrorMessage(errorObj[prop]);
        }
      }

      // Try to stringify if it looks like an error object
      if ("name" in errorObj || "code" in errorObj) {
        return this.sanitizeErrorMessage(JSON.stringify(errorObj));
      }
    }

    return "Unknown error occurred";
  }

  /**
   * Create a cache key for error deduplication
   */
  public static generateErrorCacheKey(details: ErrorDetails): string {
    return `${details.source}_${details.category}_${
      details.statusCode || "0"
    }_${details.message.substring(0, 30)}`;
  }

  /**
   * Extract additional details from error objects
   */
  public static extractAdditionalErrorDetails(error: unknown): Record<string, unknown> {
    // Handle Playwright matcher results
    if (this.isPlaywrightError(error)) {
      return this.extractPlaywrightDetails(error);
    }

    // Handle general objects
    if (typeof error === "object" && error !== null) {
      return this.sanitizeErrorObject(error as Record<string, unknown>);
    }

    return {};
  }

  /**
   * Sanitize object for safe logging, using SanitizationConfig
   */
  public static sanitizeErrorObject(obj: Record<string, unknown>): Record<string, unknown> {
    if (!obj) return {};

    // Define custom sanitization parameters
    const customSanitizationParams = {
      ...DataSanitizer.getDefaultParams(),
      skipProperties: ["stack"],
      truncateUrls: true,
      maxStringLength: 1000,
    };

    // Use a single sanitization call
    return DataSanitizer.sanitizeData(obj, customSanitizationParams);
  }

  // PRIVATE HELPER METHODS BELOW

  private static categorizeError(error: unknown): { category: ErrorCategory; context: string } {
    // Check for native JavaScript errors first (common in browser automation)
    const jsErrorResult = this.analyzeJavaScriptError(error);
    if (jsErrorResult.category !== ErrorCategory.UNKNOWN) {
      return jsErrorResult;
    }

    // Check for Playwright-specific errors (highest priority for UI automation)
    if (this.isPlaywrightError(error)) {
      return this.analyzePlaywrightError(error);
    }

    // Check for browser-specific errors
    const browserErrorResult = this.analyzeBrowserError(error);
    if (browserErrorResult.category !== ErrorCategory.UNKNOWN) {
      return browserErrorResult;
    }

    // Check for HTTP/API errors (important for API testing)
    const httpErrorResult = this.analyzeHttpError(error);
    if (httpErrorResult.category !== ErrorCategory.UNKNOWN) {
      return httpErrorResult;
    }

    // Check for system errors with codes
    if (error instanceof Error && "code" in error) {
      const systemResult = this.analyzeSystemError(error as Error & { code?: string | undefined });
      if (systemResult) return systemResult;
    }

    // Check for timeout patterns (critical in UI automation)
    if (this.isTimeoutError(error)) {
      return {
        category: ErrorCategory.TIMEOUT,
        context: "Timeout Error",
      };
    }

    // Handle CustomError/AppError
    if (error instanceof CustomError) {
      return this.analyzeAppError(error);
    }

    // Analyze error message for patterns
    const messageAnalysisResult = this.analyzeErrorMessage(error);
    if (messageAnalysisResult.category !== ErrorCategory.UNKNOWN) {
      return messageAnalysisResult;
    }

    // Default fallback with error name if available
    const result = {
      category: ErrorCategory.UNKNOWN,
      context: "General Error",
    };

    if (error instanceof Error && error.name) {
      result.context = `${error.name} Error`;
    }

    return result;
  }

  private static analyzePlaywrightError(
    error: Error & { matcherResult?: PlaywrightMatcherResult },
  ): { category: ErrorCategory; context: string } {
    const errorMessage = error.message.toLowerCase();

    // Define pattern groups in priority order for Playwright-specific analysis
    const patternGroups = [
      // High priority patterns
      ErrorPatterns.SCREENSHOT_PATTERNS,
      ErrorPatterns.DOWNLOAD_PATTERNS,
      ErrorPatterns.UPLOAD_PATTERNS,
      ErrorPatterns.COOKIE_PATTERNS,
      ErrorPatterns.STORAGE_PATTERNS,

      // Navigation and page errors
      ErrorPatterns.PAGE_PATTERNS,

      // Frame-related errors (check iframe before generic frame)
      ErrorPatterns.IFRAME_PATTERNS,
      ErrorPatterns.FRAME_TIMEOUT_PATTERNS,
      ErrorPatterns.FRAME_PATTERNS,

      // Interaction errors
      ErrorPatterns.KEYBOARD_PATTERNS,
      ErrorPatterns.MOUSE_PATTERNS,
      ErrorPatterns.DRAG_DROP_PATTERNS,
      ErrorPatterns.HOVER_PATTERNS,
      ErrorPatterns.GESTURE_PATTERNS,

      // Element and locator errors
      ErrorPatterns.LOCATOR_PATTERNS,
      ErrorPatterns.SELECTOR_PATTERNS,
      ErrorPatterns.ELEMENT_PATTERNS,
      ErrorPatterns.ELEMENT_STATE_PATTERNS,

      // Wait and state conditions
      ErrorPatterns.WAIT_CONDITION_PATTERNS,

      // Tab and window management
      ErrorPatterns.TAB_PATTERNS,
      ErrorPatterns.WINDOW_PATTERNS,
      ErrorPatterns.CONTEXT_PATTERNS,

      // Viewport and scrolling
      ErrorPatterns.SCROLL_PATTERNS,
      ErrorPatterns.VIEWPORT_PATTERNS,

      // Text and content verification
      ErrorPatterns.TEXT_VERIFICATION_PATTERNS,
      ErrorPatterns.CONTENT_MISMATCH_PATTERNS,

      // Dialog handling
      ErrorPatterns.DIALOG_PATTERNS,

      // Network and API
      ErrorPatterns.NETWORK_PATTERNS,
      ErrorPatterns.HTTP_CLIENT_PATTERNS,
      ErrorPatterns.HTTP_SERVER_PATTERNS,
      ErrorPatterns.CORS_PATTERNS,
      ErrorPatterns.INTERCEPT_PATTERNS,

      // Authentication and authorization
      ErrorPatterns.AUTHENTICATION_PATTERNS,
      ErrorPatterns.AUTHORIZATION_PATTERNS,
      ErrorPatterns.TOKEN_EXPIRED_PATTERNS,

      // CSS and styling
      ErrorPatterns.CSS_PATTERNS,
      ErrorPatterns.STYLE_PATTERNS,

      // Security
      ErrorPatterns.SECURITY_ERROR_PATTERNS,

      // Mobile specific
      ErrorPatterns.MOBILE_DEVICE_PATTERNS,

      // JavaScript errors
      ErrorPatterns.TYPE_ERROR_PATTERNS,
      ErrorPatterns.REFERENCE_ERROR_PATTERNS,
      ErrorPatterns.SYNTAX_ERROR_PATTERNS,
      ErrorPatterns.RANGE_ERROR_PATTERNS,

      // File system errors
      ErrorPatterns.FILE_NOT_FOUND_PATTERNS,
      ErrorPatterns.FILE_EXISTS_PATTERNS,
      ErrorPatterns.ACCESS_DENIED_PATTERNS,
      ErrorPatterns.FILE_TOO_LARGE_PATTERNS,

      // Connection errors
      ErrorPatterns.CONNECTION_PATTERNS,

      // Conflict and resource errors
      ErrorPatterns.CONFLICT_PATTERNS,

      // API version errors
      ErrorPatterns.API_VERSION_ERROR_PATTERNS,

      // Generic timeout (lower priority)
      ErrorPatterns.TIMEOUT_PATTERNS,

      // Test and fixture errors (lowest priority)
      ErrorPatterns.TEST_PATTERNS,
      ErrorPatterns.FIXTURE_PATTERNS,
    ];

    // Check each pattern group in priority order
    for (const patternGroup of patternGroups) {
      if (this.matchesPatternGroup(errorMessage, error, patternGroup)) {
        return {
          category: patternGroup.category as ErrorCategory,
          context: patternGroup.context,
        };
      }
    }

    // Fallback for unmatched Playwright errors
    return {
      category: ErrorCategory.TEST,
      context: `Playwright Test Error: ${error.matcherResult?.name || "Unknown"}`,
    };
  }

  /**
   * Check if error message matches any pattern in the given pattern group
   */
  private static matchesPatternGroup(
    errorMessage: string,
    error: Error & { matcherResult?: PlaywrightMatcherResult },
    patternGroup: ErrorPatternGroup,
  ): boolean {
    // Check error message against all patterns in the group
    for (const pattern of patternGroup.patterns) {
      if (pattern.test(errorMessage)) {
        return true;
      }
    }

    // Special case: Check matcherResult for specific patterns
    if (error.matcherResult?.name) {
      const matcherName = error.matcherResult.name.toLowerCase();

      // Check if any pattern would match the matcher name
      for (const pattern of patternGroup.patterns) {
        if (pattern.test(matcherName)) {
          return true;
        }
      }

      // Specific matcher name checks for common cases
      if (patternGroup.category === "SCREENSHOT_ERROR" && matcherName.includes("screenshot")) {
        return true;
      }
    }

    return false;
  }

  /**
   * Analyze Node.js system errors
   */
  private static analyzeSystemError(
    error: Error & { code?: string | undefined },
  ): { category: ErrorCategory; context: string } | null {
    if (!error.code) return null;

    const systemCategory = this.mapSystemErrorToCategory(error);
    if (systemCategory) {
      return {
        category: systemCategory,
        context: this.mapSystemErrorToContext(error),
      };
    }

    return null;
  }

  /**
   * Check if an error is a timeout error based on its message
   */
  private static isTimeoutError(error: unknown): boolean {
    const errorMessage = this.getErrorMessage(error);

    return ErrorPatterns.TIMEOUT_PATTERNS.patterns.some((pattern) => pattern.test(errorMessage));
  }

  /**
   * Analyze AppError instances
   */
  private static analyzeAppError(error: CustomError): { category: ErrorCategory; context: string } {
    return {
      category:
        error.category in ErrorCategory ? (error.category as ErrorCategory) : ErrorCategory.UNKNOWN,
      context: `App Error: ${(error.category as string) || "Unknown"}`,
    };
  }

  /**
   * Analyze error messages for patterns that indicate specific categories
   */
  private static analyzeErrorMessage(error: unknown): { category: ErrorCategory; context: string } {
    const result = {
      category: ErrorCategory.UNKNOWN,
      context: "General Error",
    };

    const errorMessage =
      typeof error === "string"
        ? error.toLowerCase()
        : error instanceof Error
          ? error.message.toLowerCase()
          : String(error).toLowerCase();

    // Check against our category-keyword map
    const categoryMatch = this.extractCategoryFromMessage(errorMessage);
    if (categoryMatch) {
      result.category = categoryMatch.category;
      result.context = categoryMatch.context;
    }

    return result;
  }

  private static extractCategoryFromMessage(
    errorMessage: string,
  ): { category: ErrorCategory; context: string } | null {
    const normalized = errorMessage.toLowerCase().trim();

    // Comprehensive category-context mapping with all error types
    const categoryContextMap: ErrorPatternGroup[] = [
      // Browser and page errors (highest priority for UI automation)
      ErrorPatterns.BROWSER_PATTERNS,
      ErrorPatterns.PAGE_PATTERNS,
      ErrorPatterns.FRAME_PATTERNS,
      ErrorPatterns.IFRAME_PATTERNS,
      ErrorPatterns.FRAME_TIMEOUT_PATTERNS,

      // UI interaction errors
      ErrorPatterns.ELEMENT_PATTERNS,
      ErrorPatterns.LOCATOR_PATTERNS,
      ErrorPatterns.SELECTOR_PATTERNS,
      ErrorPatterns.ELEMENT_STATE_PATTERNS,

      // Cookie and session management errors
      ErrorPatterns.COOKIE_PATTERNS,
      ErrorPatterns.SESSION_PATTERNS,
      ErrorPatterns.STORAGE_PATTERNS,

      // Interaction errors
      ErrorPatterns.KEYBOARD_PATTERNS,
      ErrorPatterns.MOUSE_PATTERNS,
      ErrorPatterns.GESTURE_PATTERNS,
      ErrorPatterns.DRAG_DROP_PATTERNS,
      ErrorPatterns.HOVER_PATTERNS,

      // Wait and state condition errors
      ErrorPatterns.WAIT_CONDITION_PATTERNS,

      // Tab and window management
      ErrorPatterns.TAB_PATTERNS,
      ErrorPatterns.WINDOW_PATTERNS,
      ErrorPatterns.CONTEXT_PATTERNS,

      // Scroll and viewport errors
      ErrorPatterns.SCROLL_PATTERNS,
      ErrorPatterns.VIEWPORT_PATTERNS,

      // Text and content verification
      ErrorPatterns.TEXT_VERIFICATION_PATTERNS,
      ErrorPatterns.CONTENT_MISMATCH_PATTERNS,

      // Security and sanitization
      ErrorPatterns.SECURITY_ERROR_PATTERNS,

      // File operations
      ErrorPatterns.SCREENSHOT_PATTERNS,
      ErrorPatterns.DOWNLOAD_PATTERNS,
      ErrorPatterns.UPLOAD_PATTERNS,

      // Network and API errors
      ErrorPatterns.NETWORK_PATTERNS,
      ErrorPatterns.HTTP_CLIENT_PATTERNS,
      ErrorPatterns.HTTP_SERVER_PATTERNS,
      ErrorPatterns.CORS_PATTERNS,
      ErrorPatterns.INTERCEPT_PATTERNS,

      // Authentication and authorization
      ErrorPatterns.AUTHENTICATION_PATTERNS,
      ErrorPatterns.AUTHORIZATION_PATTERNS,
      ErrorPatterns.TOKEN_EXPIRED_PATTERNS,

      // Timeout and test errors
      ErrorPatterns.TIMEOUT_PATTERNS,
      ErrorPatterns.TEST_PATTERNS,
      ErrorPatterns.FIXTURE_PATTERNS,

      // Generic fallbacks (should be last to avoid false positives)
      {
        category: ErrorCategory.NOT_FOUND,
        context: "Not Found Error",
        patterns: [/\bnot\s+found\b/, /\bdoes\s+not\s+exist\b/, /\bmissing\b/, /\bno\s+such\b/],
      },
    ];

    // Efficient pattern matching - exit early on first match
    for (const mapping of categoryContextMap) {
      for (const pattern of mapping.patterns) {
        if (pattern.test(normalized)) {
          return {
            category: mapping.category as ErrorCategory,
            context: mapping.context,
          };
        }
      }
    }

    return null;
  }

  private static mapSystemErrorToCategory(error: Error & { code?: string }): ErrorCategory | null {
    if (!error.code) return null;

    const codeMap: Record<string, ErrorCategory> = {
      // File system errors (important for screenshots, downloads, reports)
      ENOENT: ErrorCategory.FILE_NOT_FOUND,
      EEXIST: ErrorCategory.FILE_EXISTS,
      EACCES: ErrorCategory.ACCESS_DENIED,
      EFBIG: ErrorCategory.FILE_TOO_LARGE,

      // Network error codes (for API testing)
      ECONNREFUSED: ErrorCategory.CONNECTION,
      ECONNRESET: ErrorCategory.CONNECTION,
      ETIMEDOUT: ErrorCategory.TIMEOUT,
      EHOSTUNREACH: ErrorCategory.NETWORK,
      ENETUNREACH: ErrorCategory.NETWORK,

      // Permission and security
      EPERM: ErrorCategory.SECURITY_ERROR,
    };

    return codeMap[error.code] || null;
  }

  private static mapSystemErrorToContext(error: Error & { code?: string }): string {
    if (!error.code) return "System Error";

    const contextMap: Record<string, string> = {
      ENOENT: "File Not Found Error",
      EEXIST: "File Already Exists Error",
      EACCES: "File Access Denied Error",
      EFBIG: "File Too Large Error",
      ECONNREFUSED: "Connection Refused Error",
      ECONNRESET: "Connection Reset Error",
      ETIMEDOUT: "Connection Timeout Error",
      EHOSTUNREACH: "Host Unreachable Error",
      ENETUNREACH: "Network Unreachable Error",
      EPERM: "Permission Denied Error",
    };

    return contextMap[error.code] || "System Error";
  }

  private static isPlaywrightError(error: unknown): error is Error & {
    matcherResult?: PlaywrightMatcherResult;
  } {
    if (!(error instanceof Error)) return false;

    // Check for Playwright-specific properties or error patterns
    return (
      "matcherResult" in error ||
      error.message.toLowerCase().includes("playwright") ||
      error.message.toLowerCase().includes("locator") ||
      error.message.toLowerCase().includes("page.") ||
      error.message.toLowerCase().includes("expect(") ||
      error.stack?.toLowerCase().includes("playwright") ||
      false
    );
  }

  /**
   * Extract details from Playwright errors
   */
  private static extractPlaywrightDetails(
    error: Error & { matcherResult?: PlaywrightMatcherResult },
  ): Record<string, unknown> {
    const matcher = error.matcherResult;

    if (!matcher) {
      return {};
    }

    return {
      name: matcher.name,
      pass: matcher.pass,
      expected: matcher.expected,
      actual: matcher.actual,
      message: matcher.message ? this.sanitizeErrorMessage(matcher.message) : undefined,
      log: Array.isArray(matcher.log)
        ? matcher.log
            .filter((entry) => !entry.includes("http"))
            .map((entry) => this.sanitizeErrorMessage(entry))
        : undefined,
    };
  }

  /**
   * Analyze JavaScript native errors
   */
  private static analyzeJavaScriptError(error: unknown): {
    category: ErrorCategory;
    context: string;
  } {
    if (!(error instanceof Error)) {
      return { category: ErrorCategory.UNKNOWN, context: "General Error" };
    }

    // Map JavaScript error types to categories
    const jsErrorMap: Record<string, { category: ErrorCategory; context: string }> = {
      TypeError: { category: ErrorCategory.TYPE_ERROR, context: "Type Error" },
      ReferenceError: { category: ErrorCategory.REFERENCE_ERROR, context: "Reference Error" },
      SyntaxError: { category: ErrorCategory.SYNTAX_ERROR, context: "Syntax Error" },
      RangeError: { category: ErrorCategory.RANGE_ERROR, context: "Range Error" },
    };

    const errorMapping = jsErrorMap[error.name];
    if (errorMapping) {
      return errorMapping;
    }

    return { category: ErrorCategory.UNKNOWN, context: "General Error" };
  }

  private static analyzeBrowserError(error: unknown): { category: ErrorCategory; context: string } {
    const errorMessage = this.getErrorMessage(error).toLowerCase();
    const errorObj = error as Error & { matcherResult?: PlaywrightMatcherResult };

    // Define pattern groups in priority order for browser-specific analysis
    const patternGroups = [
      // High priority browser-specific patterns
      ErrorPatterns.BROWSER_PATTERNS,
      ErrorPatterns.PAGE_PATTERNS,

      // Frame-related errors (check iframe before generic frame)
      ErrorPatterns.IFRAME_PATTERNS,
      ErrorPatterns.FRAME_TIMEOUT_PATTERNS,
      ErrorPatterns.FRAME_PATTERNS,

      // Dialog handling (common browser errors)
      ErrorPatterns.DIALOG_PATTERNS,

      // Network interception (browser context)
      ErrorPatterns.INTERCEPT_PATTERNS,

      // Tab and window management
      ErrorPatterns.TAB_PATTERNS,
      ErrorPatterns.WINDOW_PATTERNS,
      ErrorPatterns.CONTEXT_PATTERNS,

      // Mobile device emulation
      ErrorPatterns.MOBILE_DEVICE_PATTERNS,

      // Element and interaction errors
      ErrorPatterns.ELEMENT_PATTERNS,
      ErrorPatterns.LOCATOR_PATTERNS,
      ErrorPatterns.SELECTOR_PATTERNS,
      ErrorPatterns.ELEMENT_STATE_PATTERNS,

      // Interaction errors
      ErrorPatterns.KEYBOARD_PATTERNS,
      ErrorPatterns.MOUSE_PATTERNS,
      ErrorPatterns.DRAG_DROP_PATTERNS,
      ErrorPatterns.HOVER_PATTERNS,
      ErrorPatterns.GESTURE_PATTERNS,

      // Wait conditions
      ErrorPatterns.WAIT_CONDITION_PATTERNS,

      // Viewport and scrolling
      ErrorPatterns.SCROLL_PATTERNS,
      ErrorPatterns.VIEWPORT_PATTERNS,

      // File operations
      ErrorPatterns.SCREENSHOT_PATTERNS,
      ErrorPatterns.DOWNLOAD_PATTERNS,
      ErrorPatterns.UPLOAD_PATTERNS,

      // Storage and cookies
      ErrorPatterns.COOKIE_PATTERNS,
      ErrorPatterns.SESSION_PATTERNS,
      ErrorPatterns.STORAGE_PATTERNS,

      // Network errors
      ErrorPatterns.NETWORK_PATTERNS,
      ErrorPatterns.HTTP_CLIENT_PATTERNS,
      ErrorPatterns.HTTP_SERVER_PATTERNS,
      ErrorPatterns.CORS_PATTERNS,

      // Authentication
      ErrorPatterns.AUTHENTICATION_PATTERNS,
      ErrorPatterns.AUTHORIZATION_PATTERNS,
      ErrorPatterns.TOKEN_EXPIRED_PATTERNS,

      // Security
      ErrorPatterns.SECURITY_ERROR_PATTERNS,

      // CSS and styling
      ErrorPatterns.CSS_PATTERNS,
      ErrorPatterns.STYLE_PATTERNS,

      // Content verification
      ErrorPatterns.TEXT_VERIFICATION_PATTERNS,
      ErrorPatterns.CONTENT_MISMATCH_PATTERNS,

      // JavaScript errors
      ErrorPatterns.TYPE_ERROR_PATTERNS,
      ErrorPatterns.REFERENCE_ERROR_PATTERNS,
      ErrorPatterns.SYNTAX_ERROR_PATTERNS,
      ErrorPatterns.RANGE_ERROR_PATTERNS,

      // File system errors
      ErrorPatterns.FILE_NOT_FOUND_PATTERNS,
      ErrorPatterns.FILE_EXISTS_PATTERNS,
      ErrorPatterns.ACCESS_DENIED_PATTERNS,
      ErrorPatterns.FILE_TOO_LARGE_PATTERNS,

      // Connection errors
      ErrorPatterns.CONNECTION_PATTERNS,

      // Conflict errors
      ErrorPatterns.CONFLICT_PATTERNS,

      // API version errors
      ErrorPatterns.API_VERSION_ERROR_PATTERNS,

      // Generic timeout (lower priority)
      ErrorPatterns.TIMEOUT_PATTERNS,

      // Test errors (lowest priority)
      ErrorPatterns.TEST_PATTERNS,
      ErrorPatterns.FIXTURE_PATTERNS,
    ];

    // Check each pattern group in priority order
    for (const patternGroup of patternGroups) {
      if (this.matchesPatternGroup(errorMessage, errorObj, patternGroup)) {
        return {
          category: patternGroup.category as ErrorCategory,
          context: patternGroup.context,
        };
      }
    }

    // Default fallback
    return { category: ErrorCategory.UNKNOWN, context: "General Error" };
  }

  /**
   * Analyze HTTP/API errors with comprehensive status code handling
   */
  private static analyzeHttpError(error: unknown): { category: ErrorCategory; context: string } {
    const errorMessage = this.getErrorMessage(error).toLowerCase();

    // Check for HTTP status code patterns
    if (error && typeof error === "object") {
      // Define proper types for different error structures
      interface AxiosLikeError {
        response?: {
          status?: number;
        };
      }

      interface StatusError {
        status?: number;
        statusCode?: number;
      }

      // Type guard for Axios-style errors
      function isAxiosLikeError(obj: object): obj is AxiosLikeError {
        return (
          "response" in obj &&
          obj.response !== null &&
          typeof obj.response === "object" &&
          "status" in obj.response
        );
      }

      // Type guard for status errors
      function isStatusError(obj: object): obj is StatusError {
        return "status" in obj || "statusCode" in obj;
      }

      // Axios-style errors
      if (isAxiosLikeError(error)) {
        const status = error.response?.status;
        if (typeof status === "number") {
          if (status >= 400 && status < 500) {
            // Handle specific 4xx errors
            switch (status) {
              case 401:
                return {
                  category: ErrorCategory.AUTHENTICATION,
                  context: "Authentication Error (401)",
                };
              case 403:
                return {
                  category: ErrorCategory.AUTHORIZATION,
                  context: "Authorization Error (403)",
                };
              case 404:
                return { category: ErrorCategory.NOT_FOUND, context: "Not Found Error (404)" };
              case 409:
                return { category: ErrorCategory.CONFLICT, context: "Conflict Error (409)" };
              case 429:
                return { category: ErrorCategory.RATE_LIMIT, context: "Rate Limit Error (429)" };
              default:
                return { category: ErrorCategory.HTTP_CLIENT, context: `Client Error (${status})` };
            }
          } else if (status >= 500) {
            return { category: ErrorCategory.HTTP_SERVER, context: `Server Error (${status})` };
          }
        }
      }

      // Check for status code in error properties
      if (isStatusError(error)) {
        const status = error.status ?? error.statusCode;
        if (typeof status === "number") {
          if (status >= 400 && status < 500) {
            return { category: ErrorCategory.HTTP_CLIENT, context: `Client Error (${status})` };
          } else if (status >= 500) {
            return { category: ErrorCategory.HTTP_SERVER, context: `Server Error (${status})` };
          }
        }
      }
    }

    // CORS errors (common in web testing)
    if (
      errorMessage.includes("cors") ||
      errorMessage.includes("cross-origin") ||
      errorMessage.includes("access-control-allow-origin")
    ) {
      return { category: ErrorCategory.CORS, context: "CORS Error" };
    }

    // Token/JWT errors
    if (
      errorMessage.includes("token expired") ||
      errorMessage.includes("jwt expired") ||
      errorMessage.includes("token invalid")
    ) {
      return { category: ErrorCategory.TOKEN_EXPIRED, context: "Token Expired Error" };
    }

    // API version errors
    if (
      errorMessage.includes("api version") ||
      errorMessage.includes("version not supported") ||
      errorMessage.includes("deprecated api")
    ) {
      return { category: ErrorCategory.API_VERSION_ERROR, context: "API Version Error" };
    }

    return { category: ErrorCategory.UNKNOWN, context: "General Error" };
  }
}
