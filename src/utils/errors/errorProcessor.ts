import DataSanitizer from "../sanitization/dataSanitizer";
import { CustomError } from "./customError";
import { ErrorCategory } from "../../config/coreTypes/errors/error-category.enum";
import { ErrorPatterns } from "./errorPatterns";
import {
  ErrorDetails,
  PlaywrightMatcherResult,
  ErrorPatternGroup,
} from "../../config/coreTypes/errors/error-handler.types";
import {
  PRIORITIZED_PATTERN_GROUPS,
  SYSTEM_ERROR_MAP,
  ANSI_REGEX,
  MESSAGE_PROPS,
  JS_ERROR_MAP,
  HTTP_STATUS_MAP,
  generateMatchCacheKey,
  getCachedPattern,
  MAX_MATCH_CACHE_SIZE,
  MATCH_RESULT_CACHE,
} from "./regexPatternCache";

/**
 * ErrorProcessor - Centralized error processing utility
 *
 * This class provides methods for creating standardized error details,
 * sanitizing error messages, and categorizing errors based on their type.
 */
export default class ErrorProcessor {
  private static DEFAULT_ERROR_MESSAGE = "An unexpected error occurred";

  /**
   * Create a standardized error object with source, context, message, and category.
   * @param error - The error to process
   * @param source - The source of the error (e.g., function name)
   * @param context - Optional additional context for the error
   * @returns An object containing structured error details
   */
  public static createErrorDetails(error: unknown, source: string, context?: string): ErrorDetails {
    const analysis = this.categorizeError(error);

    return {
      source,
      context: context || analysis.context,
      message: this.getErrorMessage(error),
      category: analysis.category,
      timestamp: new Date().toISOString(),
      environment: process.env.ENV || "dev",
      version: process.env.APP_VERSION,
    };
  }

  /**
   * Optimized error message sanitization
   */
  public static sanitizeErrorMessage(message: string): string {
    if (!message) return "";

    // Single pass sanitization
    const cleaned = DataSanitizer.sanitizeString(message)
      .replace(ANSI_REGEX, "")
      .replace(/^'Error: |^'|'$/g, "");

    return cleaned.split("\n")[0];
  }

  public static getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return this.sanitizeErrorMessage(error.message);
    }

    if (typeof error === "string") {
      return this.sanitizeErrorMessage(error);
    }

    if (error && typeof error === "object") {
      const errorObj = error as Record<string, unknown>;

      // Fast property lookup
      for (const prop of MESSAGE_PROPS) {
        const value = errorObj[prop];
        if (typeof value === "string" && value.trim()) {
          return this.sanitizeErrorMessage(value);
        }
      }

      // Fallback for error-like objects with more context
      if ("name" in errorObj || "code" in errorObj) {
        const contextParts: string[] = [];

        if ("name" in errorObj && typeof errorObj.name === "string") {
          contextParts.push(`name: ${errorObj.name}`);
        }

        if (
          "code" in errorObj &&
          (typeof errorObj.code === "string" || typeof errorObj.code === "number")
        ) {
          contextParts.push(`code: ${errorObj.code}`);
        }

        if ("status" in errorObj && typeof errorObj.status === "number") {
          contextParts.push(`status: ${errorObj.status}`);
        }

        if ("statusCode" in errorObj && typeof errorObj.statusCode === "number") {
          contextParts.push(`statusCode: ${errorObj.statusCode}`);
        }

        if (contextParts.length > 0) {
          return this.sanitizeErrorMessage(`Error object (${contextParts.join(", ")})`);
        }

        // Safe JSON stringify with error handling
        try {
          return this.sanitizeErrorMessage(JSON.stringify(errorObj));
        } catch {
          return this.sanitizeErrorMessage("[Object with circular references]");
        }
      }

      // Try to extract any meaningful string representation
      try {
        const stringifiedObj = JSON.stringify(errorObj);
        if (stringifiedObj && stringifiedObj !== "{}") {
          return this.sanitizeErrorMessage(`Object error: ${stringifiedObj}`);
        }
      } catch {
        return this.sanitizeErrorMessage("[Object with circular references]");
      }
    }

    // Enhanced fallback with type information
    const errorType = error === null ? "null" : typeof error;
    const errorValue =
      error === undefined
        ? "undefined"
        : error === null
          ? "null"
          : typeof error === "boolean"
            ? error.toString()
            : typeof error === "number"
              ? error.toString()
              : typeof error === "symbol"
                ? error.toString()
                : typeof error === "function"
                  ? "[Function]"
                  : "[Unknown]";

    return `Unknown error occurred (type: ${errorType}, value: ${errorValue})`;
  }

  /**
   * Generate cache key for error deduplication
   */
  public static generateErrorCacheKey(details: ErrorDetails): string {
    return `${details.source}_${details.category}_${details.statusCode || "0"}_${details.message.substring(0, 30)}`;
  }

  /**
   * Extract additional error details with optimized type checking
   */
  public static extractAdditionalErrorDetails(error: unknown): Record<string, unknown> {
    if (this.isPlaywrightError(error)) {
      return this.extractPlaywrightDetails(error);
    }

    if (typeof error === "object" && error !== null) {
      return this.sanitizeErrorObject(error as Record<string, unknown>);
    }

    return {};
  }

  /**
   * Optimized object sanitization
   */
  public static sanitizeErrorObject(obj: Record<string, unknown>): Record<string, unknown> {
    if (!obj) return {};

    const customSanitizationParams = {
      ...DataSanitizer.getDefaultParams(),
      skipProperties: ["stack"],
      truncateUrls: true,
      maxStringLength: 1000,
    };

    return DataSanitizer.sanitizeData(obj, customSanitizationParams);
  }

  // PRIVATE HELPER METHODS

  private static analyzePlaywrightError(
    error: Error & { matcherResult?: PlaywrightMatcherResult },
  ): { category: ErrorCategory; context: string } {
    const errorMessage = error.message.toLowerCase();

    // Fast pattern matching using prioritized groups
    for (const patternGroup of PRIORITIZED_PATTERN_GROUPS) {
      if (this.matchesPatternGroup(errorMessage, error, patternGroup)) {
        return {
          category: patternGroup.category as ErrorCategory,
          context: patternGroup.context,
        };
      }
    }

    return {
      category: ErrorCategory.TEST,
      context: `Playwright Test Error: ${error.matcherResult?.name || "Unknown"}`,
    };
  }

  private static matchesPatternGroup(
    errorMessage: string,
    error: Error & { matcherResult?: PlaywrightMatcherResult },
    patternGroup: ErrorPatternGroup,
  ): boolean {
    // Check match result cache first
    const cacheKey = generateMatchCacheKey(errorMessage);
    if (MATCH_RESULT_CACHE.has(cacheKey)) {
      const cachedResult = MATCH_RESULT_CACHE.get(cacheKey)!;
      return cachedResult.category === patternGroup.category;
    }

    // Test patterns against error message with cached compilation
    for (const pattern of patternGroup.patterns) {
      const patternSource = pattern.source;
      const cachedPattern = getCachedPattern(patternSource);

      if (cachedPattern.test(errorMessage)) {
        // Cache the successful match
        if (MATCH_RESULT_CACHE.size >= MAX_MATCH_CACHE_SIZE) {
          const firstKey = MATCH_RESULT_CACHE.keys().next().value;
          if (firstKey !== undefined) {
            MATCH_RESULT_CACHE.delete(firstKey);
          }
        }

        MATCH_RESULT_CACHE.set(cacheKey, {
          category: patternGroup.category as ErrorCategory,
          context: patternGroup.context,
        });

        return true;
      }
    }

    // Special case for matcherResult (unchanged)
    const matcherName = error.matcherResult?.name?.toLowerCase();
    if (matcherName) {
      if (patternGroup.category === "SCREENSHOT_ERROR" && matcherName.includes("screenshot")) {
        return true;
      }

      for (const pattern of patternGroup.patterns) {
        const cachedPattern = getCachedPattern(pattern.source);
        if (cachedPattern.test(matcherName)) {
          return true;
        }
      }
    }

    return false;
  }

  private static analyzeSystemError(
    error: Error & { code?: string },
  ): { category: ErrorCategory; context: string } | null {
    if (!error.code) return null;
    return SYSTEM_ERROR_MAP.get(error.code) || null;
  }

  private static isTimeoutError(error: unknown): boolean {
    const errorMessage = this.getErrorMessage(error);

    // Use cached pattern matching instead of direct pattern access
    for (const pattern of ErrorPatterns.TIMEOUT_PATTERNS.patterns) {
      const cachedPattern = getCachedPattern(pattern.source);
      if (cachedPattern.test(errorMessage)) {
        return true;
      }
    }
    return false;
  }

  private static isPlaywrightError(
    error: unknown,
  ): error is Error & { matcherResult?: PlaywrightMatcherResult } {
    if (!(error instanceof Error)) return false;

    return !!(
      "matcherResult" in error ||
      error.message.toLowerCase().includes("playwright") ||
      error.message.toLowerCase().includes("locator") ||
      error.message.toLowerCase().includes("page.") ||
      error.message.toLowerCase().includes("expect(") ||
      error.stack?.toLowerCase().includes("playwright")
    );
  }

  private static extractPlaywrightDetails(
    error: Error & { matcherResult?: PlaywrightMatcherResult },
  ): Record<string, unknown> {
    const matcher = error.matcherResult;
    if (!matcher) return {};

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

  private static analyzeBrowserError(error: unknown): { category: ErrorCategory; context: string } {
    const errorMessage = this.getErrorMessage(error).toLowerCase();
    const errorObj = error as Error & { matcherResult?: PlaywrightMatcherResult };

    // Use the same cached pattern matching as other methods
    for (const patternGroup of PRIORITIZED_PATTERN_GROUPS) {
      if (this.matchesPatternGroup(errorMessage, errorObj, patternGroup)) {
        return {
          category: patternGroup.category as ErrorCategory,
          context: patternGroup.context,
        };
      }
    }

    return { category: ErrorCategory.UNKNOWN, context: "General Error" };
  }

  // Updated categorizeError method - simplified and fixed logic
  private static categorizeError(error: unknown): { category: ErrorCategory; context: string } {
    // Fast path for JavaScript errors
    if (error instanceof Error) {
      const jsResult = JS_ERROR_MAP.get(error.name);
      if (jsResult) return jsResult;

      // System errors with codes
      if ("code" in error) {
        const systemResult = SYSTEM_ERROR_MAP.get((error as Error & { code: string }).code);
        if (systemResult) return systemResult;
      }

      // Custom/App errors
      if (error instanceof CustomError) {
        return {
          category:
            error.category in ErrorCategory
              ? (error.category as ErrorCategory)
              : ErrorCategory.UNKNOWN,
          context: `App Error: ${(error.category as string) || "Unknown"}`,
        };
      }
    }

    // Playwright errors
    if (this.isPlaywrightError(error)) {
      return this.analyzePlaywrightError(error);
    }

    // HTTP errors
    const httpResult = this.analyzeHttpError(error);
    if (httpResult.category !== ErrorCategory.UNKNOWN) {
      return httpResult;
    }

    // Timeout check
    if (this.isTimeoutError(error)) {
      return { category: ErrorCategory.TIMEOUT, context: "Timeout Error" };
    }

    // Message pattern analysis
    const messageResult = this.analyzeErrorMessage(error);
    if (messageResult.category !== ErrorCategory.UNKNOWN) {
      return messageResult;
    }

    // Fallback
    return {
      category: ErrorCategory.UNKNOWN,
      context: error instanceof Error && error.name ? `${error.name} Error` : "General Error",
    };
  }

  // Updated analyzeErrorMessage method - use centralized pattern matching
  private static analyzeErrorMessage(error: unknown): { category: ErrorCategory; context: string } {
    const errorMessage = this.getErrorMessage(error).toLowerCase();

    // Check cache first
    const cacheKey = generateMatchCacheKey(errorMessage);
    if (MATCH_RESULT_CACHE.has(cacheKey)) {
      return MATCH_RESULT_CACHE.get(cacheKey)!;
    }

    // Use prioritized pattern groups for message analysis
    for (const patternGroup of PRIORITIZED_PATTERN_GROUPS) {
      for (const pattern of patternGroup.patterns) {
        const cachedPattern = getCachedPattern(pattern.source);
        if (cachedPattern.test(errorMessage)) {
          const result = {
            category: patternGroup.category as ErrorCategory,
            context: patternGroup.context,
          };

          // Cache the result
          if (MATCH_RESULT_CACHE.size >= MAX_MATCH_CACHE_SIZE) {
            const firstKey = MATCH_RESULT_CACHE.keys().next().value;
            if (firstKey !== undefined) {
              MATCH_RESULT_CACHE.delete(firstKey);
            }
          }
          MATCH_RESULT_CACHE.set(cacheKey, result);

          return result;
        }
      }
    }

    return { category: ErrorCategory.UNKNOWN, context: "General Error" };
  }

  private static analyzeHttpError(error: unknown): { category: ErrorCategory; context: string } {
    if (!error || typeof error !== "object") {
      return { category: ErrorCategory.UNKNOWN, context: "General Error" };
    }

    const errorObj = error as Record<string, unknown>;
    const status = this.extractHttpStatus(errorObj);

    if (typeof status === "number") {
      const mapping = HTTP_STATUS_MAP.get(status);
      if (mapping) return mapping;

      return status >= 400 && status < 500
        ? { category: ErrorCategory.HTTP_CLIENT, context: `Client Error (${status})` }
        : { category: ErrorCategory.HTTP_SERVER, context: `Server Error (${status})` };
    }

    // Check for specific error types in message
    const errorMessage = this.getErrorMessage(error).toLowerCase();
    return this.categorizeErrorMessage(errorMessage);
  }

  // New helper method to extract HTTP status
  private static extractHttpStatus(errorObj: Record<string, unknown>): number | undefined {
    // Check for response.status first
    if (
      "response" in errorObj &&
      errorObj.response &&
      typeof errorObj.response === "object" &&
      errorObj.response !== null
    ) {
      const response = errorObj.response as Record<string, unknown>;
      if ("status" in response && typeof response.status === "number") {
        return response.status;
      }
    }

    // Check for direct status property
    if ("status" in errorObj && typeof errorObj.status === "number") {
      return errorObj.status;
    }

    // Check for statusCode property
    if ("statusCode" in errorObj && typeof errorObj.statusCode === "number") {
      return errorObj.statusCode;
    }

    return undefined;
  }

  private static categorizeErrorMessage(errorMessage: string): {
    category: ErrorCategory;
    context: string;
  } {
    if (errorMessage.includes("cors") || errorMessage.includes("cross-origin")) {
      return { category: ErrorCategory.CORS, context: "CORS Error" };
    }
    if (errorMessage.includes("token expired") || errorMessage.includes("jwt expired")) {
      return { category: ErrorCategory.TOKEN_EXPIRED, context: "Token Expired Error" };
    }
    if (errorMessage.includes("api version") || errorMessage.includes("version not supported")) {
      return { category: ErrorCategory.API_VERSION_ERROR, context: "API Version Error" };
    }
    return { category: ErrorCategory.UNKNOWN, context: "General Error" };
  }
}
