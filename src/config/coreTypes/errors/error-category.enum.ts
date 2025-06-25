
export enum ErrorCategory {
  // Database errors (for API testing with DB interactions)
  DATABASE = 'DATABASE_ERROR',
  CONNECTION = 'CONNECTION_ERROR',
  QUERY = 'QUERY_ERROR',
  CONSTRAINT = 'CONSTRAINT_ERROR',
  TRANSACTION = 'TRANSACTION_ERROR',
  
  // API and network errors (critical for both UI and API testing)
  NETWORK = 'NETWORK_ERROR',
  HTTP_CLIENT = 'HTTP_CLIENT_ERROR',         // 4xx errors
  HTTP_SERVER = 'HTTP_SERVER_ERROR',         // 5xx errors
  TIMEOUT = 'TIMEOUT_ERROR',
  RATE_LIMIT = 'RATE_LIMIT_ERROR',
  CORS = 'CORS_ERROR',                       // Common in web testing
  
  // Authentication and authorization (essential for modern apps)
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  AUTHORIZATION = 'AUTHORIZATION_ERROR',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED_ERROR',     // JWT/OAuth scenarios
  
  // Resource errors
  NOT_FOUND = 'NOT_FOUND_ERROR',
  PERMISSION = 'PERMISSION_ERROR',
  CONFLICT = 'CONFLICT_ERROR',
  
  // UI and Browser errors (core Playwright functionality)
  BROWSER_ERROR = 'BROWSER_ERROR',
  PAGE_ERROR = 'PAGE_ERROR',
  FRAME_ERROR = 'FRAME_ERROR',
  ELEMENT = 'ELEMENT_ERROR',
  LOCATOR = 'LOCATOR_NOT_FOUND_ERROR',
  NAVIGATION = 'NAVIGATION_ERROR',
  SELECTOR = 'SELECTOR_ERROR',
  ASSERTION = 'ASSERTION_ERROR',
  SCREENSHOT_ERROR = 'SCREENSHOT_ERROR',
  DOWNLOAD_ERROR = 'DOWNLOAD_ERROR',
  UPLOAD_ERROR = 'UPLOAD_ERROR',
  DIALOG = 'DIALOG_ERROR',                   // Alert/confirm/prompt handling
  INTERCEPT = 'INTERCEPT_ERROR',             // Network interception issues
   // Frame and iframe specific errors (you have getFrameByName method)
  IFRAME_ERROR = 'IFRAME_ERROR',
  FRAME_TIMEOUT = 'FRAME_TIMEOUT_ERROR',
  
  // Cookie and session management (you have cookie methods)
  COOKIE_ERROR = 'COOKIE_ERROR',
  SESSION_ERROR = 'SESSION_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR', // localStorage, sessionStorage
  
  // Keyboard and mouse interaction errors (you have keyboard methods)
  KEYBOARD_ERROR = 'KEYBOARD_ERROR',
  MOUSE_ERROR = 'MOUSE_ERROR',
  GESTURE_ERROR = 'GESTURE_ERROR', // touch gestures, swipes
  
  // Drag and drop specific (you have dragAndDropElement)
  DRAG_DROP_ERROR = 'DRAG_DROP_ERROR',
  
  // Wait condition failures (you have many wait methods)
  WAIT_CONDITION_ERROR = 'WAIT_CONDITION_ERROR',
  ELEMENT_STATE_ERROR = 'ELEMENT_STATE_ERROR',
  
  // Tab and window management (you have tab switching methods)
  TAB_ERROR = 'TAB_ERROR',
  WINDOW_ERROR = 'WINDOW_ERROR',
  CONTEXT_ERROR = 'CONTEXT_ERROR',
  
  // Scroll and viewport errors (you have scroll methods)
  SCROLL_ERROR = 'SCROLL_ERROR',
  VIEWPORT_ERROR = 'VIEWPORT_ERROR',
  
  
  // CSS and styling related (you have getElementStyle)
  CSS_ERROR = 'CSS_ERROR',
  STYLE_ERROR = 'STYLE_ERROR',
  
  // Text verification and content errors
  TEXT_VERIFICATION_ERROR = 'TEXT_VERIFICATION_ERROR',
  CONTENT_MISMATCH_ERROR = 'CONTENT_MISMATCH_ERROR',
  
  // Sanitization and security (you use SanitizationConfig)
  SANITIZATION_ERROR = 'SANITIZATION_ERROR',
  
  // Random data generation errors (you have createRandomString)
  DATA_GENERATION_ERROR = 'DATA_GENERATION_ERROR',
  
  // Hover interaction specific
  HOVER_ERROR = 'HOVER_ERROR',
  
  // Multi-step action failures
  COMPOUND_ACTION_ERROR = 'COMPOUND_ACTION_ERROR', // for hoverAndClickElement type methods
  
  // Input/Output and data handling
  IO = 'IO_ERROR',
  PARSING = 'PARSING_ERROR',
  VALIDATION = 'VALIDATION_ERROR',
  SERIALIZATION = 'SERIALIZATION_ERROR',
  FORMAT_ERROR = 'FORMAT_ERROR',
  ENCODING_ERROR = 'ENCODING_ERROR',
  
  // Test execution and framework
  TEST = 'TEST_ERROR',
  SETUP = 'SETUP_ERROR',
  TEARDOWN = 'TEARDOWN_ERROR',
  FIXTURE = 'FIXTURE_ERROR',
  EXPECTED_FAILURE = 'EXPECTED_FAILURE',
  RETRY_EXHAUSTED = 'RETRY_EXHAUSTED_ERROR', // When all retries fail
  
  // Performance (important for UI testing)
  PERFORMANCE = 'PERFORMANCE_ERROR',
  MEMORY = 'MEMORY_ERROR',
  RESOURCE_LIMIT = 'RESOURCE_LIMIT_ERROR',
  
  // Environment and configuration
  ENVIRONMENT = 'ENVIRONMENT_ERROR',
  DEPENDENCY = 'DEPENDENCY_ERROR',
  CONFIGURATION = 'CONFIGURATION_ERROR',
  
  // JavaScript Runtime errors (common in browser automation)
  TYPE_ERROR = 'TYPE_ERROR',
  REFERENCE_ERROR = 'REFERENCE_ERROR',
  SYNTAX_ERROR = 'SYNTAX_ERROR',
  RANGE_ERROR = 'RANGE_ERROR',
  
  // File system (for downloads, uploads, screenshots, reports)
  FILE_NOT_FOUND = 'FILE_NOT_FOUND_ERROR',
  FILE_EXISTS = 'FILE_EXISTS_ERROR',
  ACCESS_DENIED = 'ACCESS_DENIED_ERROR',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE_ERROR',
  
  // Security (for HTTPS, CSP, etc.)
  SECURITY_ERROR = 'SECURITY_ERROR',
  
  // Business logic and application state
  BUSINESS_RULE = 'BUSINESS_RULE_ERROR',
  
  // External services (APIs, webhooks, third-party integrations)
  THIRD_PARTY_SERVICE = 'THIRD_PARTY_SERVICE_ERROR',
  API_VERSION_ERROR = 'API_VERSION_ERROR',
  WEBHOOK_ERROR = 'WEBHOOK_ERROR',
  
  // Mobile-specific (if using Playwright for mobile)
  MOBILE_DEVICE = 'MOBILE_DEVICE_ERROR',
  MOBILE_CONTEXT = 'MOBILE_CONTEXT_ERROR',
  
  // Fallback
  UNKNOWN = 'UNKNOWN_ERROR',
}