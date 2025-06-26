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
