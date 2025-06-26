// import { ErrorCategory } from "../../config/coreTypes/errors/error-category.enum";
// import { ErrorPatterns } from "./errorPatterns";

// // Cache for compiled regex patterns and match results
// export const PATTERN_CACHE = new Map<string, RegExp>();
// export const MATCH_RESULT_CACHE = new Map<string, { category: ErrorCategory; context: string }>();

// // Optimized pattern groups ordered by frequency/priority
// export const PRIORITIZED_PATTERN_GROUPS = [
//   // Most common patterns first
//   ErrorPatterns.TIMEOUT_PATTERNS,
//   ErrorPatterns.ELEMENT_PATTERNS,
//   ErrorPatterns.LOCATOR_PATTERNS,
//   ErrorPatterns.PAGE_PATTERNS,
//   ErrorPatterns.NETWORK_PATTERNS,

//   // Browser-specific patterns
//   ErrorPatterns.BROWSER_PATTERNS,
//   ErrorPatterns.FRAME_PATTERNS,
//   ErrorPatterns.IFRAME_PATTERNS,

//   // Interaction patterns
//   ErrorPatterns.SELECTOR_PATTERNS,
//   ErrorPatterns.ELEMENT_STATE_PATTERNS,
//   ErrorPatterns.KEYBOARD_PATTERNS,
//   ErrorPatterns.MOUSE_PATTERNS,

//   // Less frequent patterns
//   ErrorPatterns.SCREENSHOT_PATTERNS,
//   ErrorPatterns.DOWNLOAD_PATTERNS,
//   ErrorPatterns.UPLOAD_PATTERNS,
//   ErrorPatterns.COOKIE_PATTERNS,
//   ErrorPatterns.STORAGE_PATTERNS,
//   ErrorPatterns.DRAG_DROP_PATTERNS,
//   ErrorPatterns.HOVER_PATTERNS,
//   ErrorPatterns.GESTURE_PATTERNS,
//   ErrorPatterns.WAIT_CONDITION_PATTERNS,
//   ErrorPatterns.TAB_PATTERNS,
//   ErrorPatterns.WINDOW_PATTERNS,
//   ErrorPatterns.CONTEXT_PATTERNS,
//   ErrorPatterns.SCROLL_PATTERNS,
//   ErrorPatterns.VIEWPORT_PATTERNS,
//   ErrorPatterns.TEXT_VERIFICATION_PATTERNS,
//   ErrorPatterns.CONTENT_MISMATCH_PATTERNS,
//   ErrorPatterns.DIALOG_PATTERNS,
//   ErrorPatterns.HTTP_CLIENT_PATTERNS,
//   ErrorPatterns.HTTP_SERVER_PATTERNS,
//   ErrorPatterns.CORS_PATTERNS,
//   ErrorPatterns.INTERCEPT_PATTERNS,
//   ErrorPatterns.AUTHENTICATION_PATTERNS,
//   ErrorPatterns.AUTHORIZATION_PATTERNS,
//   ErrorPatterns.TOKEN_EXPIRED_PATTERNS,
//   ErrorPatterns.CSS_PATTERNS,
//   ErrorPatterns.STYLE_PATTERNS,
//   ErrorPatterns.SECURITY_ERROR_PATTERNS,
//   ErrorPatterns.MOBILE_DEVICE_PATTERNS,
//   ErrorPatterns.TYPE_ERROR_PATTERNS,
//   ErrorPatterns.REFERENCE_ERROR_PATTERNS,
//   ErrorPatterns.SYNTAX_ERROR_PATTERNS,
//   ErrorPatterns.RANGE_ERROR_PATTERNS,
//   ErrorPatterns.FILE_NOT_FOUND_PATTERNS,
//   ErrorPatterns.FILE_EXISTS_PATTERNS,
//   ErrorPatterns.ACCESS_DENIED_PATTERNS,
//   ErrorPatterns.FILE_TOO_LARGE_PATTERNS,
//   ErrorPatterns.CONNECTION_PATTERNS,
//   ErrorPatterns.CONFLICT_PATTERNS,
//   ErrorPatterns.API_VERSION_ERROR_PATTERNS,
//   ErrorPatterns.FRAME_TIMEOUT_PATTERNS,
//   ErrorPatterns.TEST_PATTERNS,
//   ErrorPatterns.FIXTURE_PATTERNS,
//   ErrorPatterns.SESSION_PATTERNS,
// ];

// // Pre-compiled system error mappings
// export const SYSTEM_ERROR_MAP = new Map([
//   // File system errors
//   ["ENOENT", { category: ErrorCategory.FILE_NOT_FOUND, context: "File Not Found Error" }],
//   ["EEXIST", { category: ErrorCategory.FILE_EXISTS, context: "File Already Exists Error" }],
//   ["EACCES", { category: ErrorCategory.ACCESS_DENIED, context: "File Access Denied Error" }],
//   ["EFBIG", { category: ErrorCategory.FILE_TOO_LARGE, context: "File Too Large Error" }],

//   // Network errors
//   ["ECONNREFUSED", { category: ErrorCategory.CONNECTION, context: "Connection Refused Error" }],
//   ["ECONNRESET", { category: ErrorCategory.CONNECTION, context: "Connection Reset Error" }],
//   ["ETIMEDOUT", { category: ErrorCategory.TIMEOUT, context: "Connection Timeout Error" }],
//   ["EHOSTUNREACH", { category: ErrorCategory.NETWORK, context: "Host Unreachable Error" }],
//   ["ENETUNREACH", { category: ErrorCategory.NETWORK, context: "Network Unreachable Error" }],

//   // Security
//   ["EPERM", { category: ErrorCategory.SECURITY_ERROR, context: "Permission Denied Error" }],
// ]);

// // JavaScript error type mappings
// export const JS_ERROR_MAP = new Map([
//   ["TypeError", { category: ErrorCategory.TYPE_ERROR, context: "Type Error" }],
//   ["ReferenceError", { category: ErrorCategory.REFERENCE_ERROR, context: "Reference Error" }],
//   ["SyntaxError", { category: ErrorCategory.SYNTAX_ERROR, context: "Syntax Error" }],
//   ["RangeError", { category: ErrorCategory.RANGE_ERROR, context: "Range Error" }],
// ]);

// // HTTP status code mappings
// export const HTTP_STATUS_MAP = new Map([
//   [401, { category: ErrorCategory.AUTHENTICATION, context: "Authentication Error (401)" }],
//   [403, { category: ErrorCategory.AUTHORIZATION, context: "Authorization Error (403)" }],
//   [404, { category: ErrorCategory.NOT_FOUND, context: "Not Found Error (404)" }],
//   [409, { category: ErrorCategory.CONFLICT, context: "Conflict Error (409)" }],
//   [429, { category: ErrorCategory.RATE_LIMIT, context: "Rate Limit Error (429)" }],
// ]);

// // Single compiled regex for ANSI escape sequences
// export const ANSI_REGEX = /\x1b\[\d+(?:;\d+)*m|\x1b\??[0-9;]*[A-Za-z]/g;

// // Message property lookup order for error objects
// export const MESSAGE_PROPS = ["message", "error", "description", "detail"] as const;

// // Cache size limits to prevent memory leaks
// export const MAX_PATTERN_CACHE_SIZE = 100;
// export const MAX_MATCH_CACHE_SIZE = 500;

// /**
//  * Get or compile regex pattern with caching
//  */
// export function getCachedPattern(patternSource: string): RegExp {
//   if (PATTERN_CACHE.has(patternSource)) {
//     return PATTERN_CACHE.get(patternSource)!;
//   }

//   // Prevent cache overflow
//   if (PATTERN_CACHE.size >= MAX_PATTERN_CACHE_SIZE) {
//     const firstKey = PATTERN_CACHE.keys().next().value;
//     if (firstKey !== undefined) {
//       PATTERN_CACHE.delete(firstKey);
//     }
//   }

//   const compiledPattern = new RegExp(patternSource, "i");
//   PATTERN_CACHE.set(patternSource, compiledPattern);
//   return compiledPattern;
// }

// /**
//  * Generate cache key for error message matching
//  */
// export function generateMatchCacheKey(errorMessage: string): string {
//   // Use first 50 chars + length for balance of uniqueness vs collision
//   return `${errorMessage.substring(0, 50)}_${errorMessage.length}`;
// }

// /**
//  * Clear caches when they get too large (optional utility method)
//  */
// export function clearCaches(): void {
//   PATTERN_CACHE.clear();
//   MATCH_RESULT_CACHE.clear();
// }

// /**
//  * Get cache statistics (for monitoring)
//  */
// export function getCacheStats(): { patternCacheSize: number; matchCacheSize: number } {
//   return {
//     patternCacheSize: PATTERN_CACHE.size,
//     matchCacheSize: MATCH_RESULT_CACHE.size,
//   };
// }


import { ErrorCategory } from "../../config/coreTypes/errors/error-category.enum";
import { ErrorPatterns } from "./errorPatterns";

// Cache for compiled regex patterns and match results
export const PATTERN_CACHE = new Map<string, RegExp>();
export const MATCH_RESULT_CACHE = new Map<string, { category: ErrorCategory; context: string }>();

// Cache size limits to prevent memory leaks
export const MAX_PATTERN_CACHE_SIZE = 100;
export const MAX_MATCH_CACHE_SIZE = 500;

/**
 * Get or compile regex pattern with caching - CRITICAL PATH METHOD
 * Used for every pattern matching operation
 */
export function getCachedPattern(patternSource: string): RegExp {
  if (PATTERN_CACHE.has(patternSource)) {
    return PATTERN_CACHE.get(patternSource)!;
  }

  // Prevent cache overflow
  if (PATTERN_CACHE.size >= MAX_PATTERN_CACHE_SIZE) {
    const firstKey = PATTERN_CACHE.keys().next().value;
    if (firstKey !== undefined) {
      PATTERN_CACHE.delete(firstKey);
    }
  }

  const compiledPattern = new RegExp(patternSource, "i");
  PATTERN_CACHE.set(patternSource, compiledPattern);
  return compiledPattern;
}

/**
 * Generate cache key for error message matching - HIGH FREQUENCY METHOD
 * Called for every error message processed
 */
export function generateMatchCacheKey(errorMessage: string): string {
  // Use first 50 chars + length for balance of uniqueness vs collision
  return `${errorMessage.substring(0, 50)}_${errorMessage.length}`;
}

// Single compiled regex for ANSI escape sequences - frequently used
export const ANSI_REGEX = /\x1b\[\d+(?:;\d+)*m|\x1b\??[0-9;]*[A-Za-z]/g;

// Message property lookup order for error objects - commonly accessed
export const MESSAGE_PROPS = ["message", "error", "description", "detail"] as const;

// Pre-compiled system error mappings - fast O(1) lookups
export const SYSTEM_ERROR_MAP = new Map([
  // File system errors (common in automation)
  ["ENOENT", { category: ErrorCategory.FILE_NOT_FOUND, context: "File Not Found Error" }],
  ["EEXIST", { category: ErrorCategory.FILE_EXISTS, context: "File Already Exists Error" }],
  ["EACCES", { category: ErrorCategory.ACCESS_DENIED, context: "File Access Denied Error" }],
  ["EFBIG", { category: ErrorCategory.FILE_TOO_LARGE, context: "File Too Large Error" }],

  // Network errors (very common in web automation)
  ["ECONNREFUSED", { category: ErrorCategory.CONNECTION, context: "Connection Refused Error" }],
  ["ECONNRESET", { category: ErrorCategory.CONNECTION, context: "Connection Reset Error" }],
  ["ETIMEDOUT", { category: ErrorCategory.TIMEOUT, context: "Connection Timeout Error" }],
  ["EHOSTUNREACH", { category: ErrorCategory.NETWORK, context: "Host Unreachable Error" }],
  ["ENETUNREACH", { category: ErrorCategory.NETWORK, context: "Network Unreachable Error" }],

  // Security (moderate frequency)
  ["EPERM", { category: ErrorCategory.SECURITY_ERROR, context: "Permission Denied Error" }],
]);

// JavaScript error type mappings - moderate frequency
export const JS_ERROR_MAP = new Map([
  ["TypeError", { category: ErrorCategory.TYPE_ERROR, context: "Type Error" }],
  ["ReferenceError", { category: ErrorCategory.REFERENCE_ERROR, context: "Reference Error" }],
  ["SyntaxError", { category: ErrorCategory.SYNTAX_ERROR, context: "Syntax Error" }],
  ["RangeError", { category: ErrorCategory.RANGE_ERROR, context: "Range Error" }],
]);

// HTTP status code mappings - moderate frequency
export const HTTP_STATUS_MAP = new Map([
  [401, { category: ErrorCategory.AUTHENTICATION, context: "Authentication Error (401)" }],
  [403, { category: ErrorCategory.AUTHORIZATION, context: "Authorization Error (403)" }],
  [404, { category: ErrorCategory.NOT_FOUND, context: "Not Found Error (404)" }],
  [409, { category: ErrorCategory.CONFLICT, context: "Conflict Error (409)" }],
  [429, { category: ErrorCategory.RATE_LIMIT, context: "Rate Limit Error (429)" }],
]);

// Optimized pattern groups ordered by frequency/priority
export const PRIORITIZED_PATTERN_GROUPS = [
  // TIER 1: Most critical/frequent patterns (checked first)
  ErrorPatterns.TIMEOUT_PATTERNS,        // Most common in automation
  ErrorPatterns.ELEMENT_PATTERNS,        // Core UI interaction errors
  ErrorPatterns.LOCATOR_PATTERNS,        // Element finding issues
  ErrorPatterns.NETWORK_PATTERNS,        // Network connectivity issues

  // TIER 2: Common browser/page patterns
  ErrorPatterns.PAGE_PATTERNS,           // Page loading/navigation
  ErrorPatterns.BROWSER_PATTERNS,        // Browser-specific issues
  ErrorPatterns.SELECTOR_PATTERNS,       // CSS/XPath selector issues

  // TIER 3: Interaction patterns
  ErrorPatterns.ELEMENT_STATE_PATTERNS,  // Element state validation
  ErrorPatterns.FRAME_PATTERNS,          // Frame/iframe handling
  ErrorPatterns.IFRAME_PATTERNS,         // Specific iframe issues
  ErrorPatterns.KEYBOARD_PATTERNS,       // Keyboard interactions
  ErrorPatterns.MOUSE_PATTERNS,          // Mouse/click interactions

  // TIER 4: Specialized interaction patterns
  ErrorPatterns.DRAG_DROP_PATTERNS,      // Drag and drop operations
  ErrorPatterns.HOVER_PATTERNS,          // Hover interactions
  ErrorPatterns.GESTURE_PATTERNS,        // Touch/gesture operations
  ErrorPatterns.SCROLL_PATTERNS,         // Scrolling operations

  // TIER 5: Content and verification patterns
  ErrorPatterns.TEXT_VERIFICATION_PATTERNS,    // Text content validation
  ErrorPatterns.CONTENT_MISMATCH_PATTERNS,     // Content comparison
  ErrorPatterns.SCREENSHOT_PATTERNS,           // Screenshot operations

  // TIER 6: File and media operations
  ErrorPatterns.DOWNLOAD_PATTERNS,       // File downloads
  ErrorPatterns.UPLOAD_PATTERNS,         // File uploads

  // TIER 7: Browser state and context
  ErrorPatterns.COOKIE_PATTERNS,         // Cookie operations
  ErrorPatterns.STORAGE_PATTERNS,        // Local/session storage
  ErrorPatterns.TAB_PATTERNS,           // Tab management
  ErrorPatterns.WINDOW_PATTERNS,        // Window operations
  ErrorPatterns.CONTEXT_PATTERNS,       // Browser context
  ErrorPatterns.VIEWPORT_PATTERNS,      // Viewport operations

  // TIER 8: Wait and timing patterns
  ErrorPatterns.WAIT_CONDITION_PATTERNS, // Wait conditions
  ErrorPatterns.FRAME_TIMEOUT_PATTERNS,  // Frame-specific timeouts

  // TIER 9: Dialog and UI components
  ErrorPatterns.DIALOG_PATTERNS,         // Modal dialogs

  // TIER 10: HTTP and network details
  ErrorPatterns.HTTP_CLIENT_PATTERNS,    // HTTP client errors
  ErrorPatterns.HTTP_SERVER_PATTERNS,    // HTTP server errors
  ErrorPatterns.CORS_PATTERNS,          // CORS issues
  ErrorPatterns.INTERCEPT_PATTERNS,     // Request/response interception

  // TIER 11: Security and authentication
  ErrorPatterns.AUTHENTICATION_PATTERNS,  // Auth failures
  ErrorPatterns.AUTHORIZATION_PATTERNS,   // Permission issues
  ErrorPatterns.TOKEN_EXPIRED_PATTERNS,   // Token expiration
  ErrorPatterns.SECURITY_ERROR_PATTERNS,  // General security

  // TIER 12: Styling and presentation
  ErrorPatterns.CSS_PATTERNS,            // CSS-related errors
  ErrorPatterns.STYLE_PATTERNS,          // Style computation

  // TIER 13: Device and platform specific
  ErrorPatterns.MOBILE_DEVICE_PATTERNS,  // Mobile-specific issues

  // TIER 14: Programming errors (usually caught in development)
  ErrorPatterns.TYPE_ERROR_PATTERNS,     // Type-related errors
  ErrorPatterns.REFERENCE_ERROR_PATTERNS, // Reference errors
  ErrorPatterns.SYNTAX_ERROR_PATTERNS,   // Syntax errors
  ErrorPatterns.RANGE_ERROR_PATTERNS,    // Range errors

  // TIER 15: File system operations
  ErrorPatterns.FILE_NOT_FOUND_PATTERNS, // File not found
  ErrorPatterns.FILE_EXISTS_PATTERNS,    // File already exists
  ErrorPatterns.ACCESS_DENIED_PATTERNS,  // File access denied
  ErrorPatterns.FILE_TOO_LARGE_PATTERNS, // File size issues

  // TIER 16: Connection and API issues
  ErrorPatterns.CONNECTION_PATTERNS,     // Connection problems
  ErrorPatterns.CONFLICT_PATTERNS,       // Resource conflicts
  ErrorPatterns.API_VERSION_ERROR_PATTERNS, // API version mismatches

  // TIER 17: Testing framework specific (lowest priority)
  ErrorPatterns.TEST_PATTERNS,           // Test framework errors
  ErrorPatterns.FIXTURE_PATTERNS,        // Test fixture issues
  ErrorPatterns.SESSION_PATTERNS,        // Session management
];

/**
 * Get cache statistics - LOW PRIORITY UTILITY
 * Used for monitoring and debugging, not in critical path
 */
export function getCacheStats(): { patternCacheSize: number; matchCacheSize: number } {
  return {
    patternCacheSize: PATTERN_CACHE.size,
    matchCacheSize: MATCH_RESULT_CACHE.size,
  };
}

/**
 * Clear caches when they get too large - LOW PRIORITY MAINTENANCE
 * Optional utility method for cache management
 */
export function clearCaches(): void {
  PATTERN_CACHE.clear();
  MATCH_RESULT_CACHE.clear();
}