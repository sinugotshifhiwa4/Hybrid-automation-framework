/**
 * ErrorPatterns - Centralized Error Pattern Repository
 * 
 * A static utility class that provides a comprehensive collection of error pattern definitions
 * for web application error detection and categorization. This class serves as a centralized
 * registry for identifying and classifying various types of errors that can occur in browser
 * automation, web testing, and application monitoring scenarios.
 * 
 * @example
 * ```typescript
 * // Access browser error patterns
 * const browserPatterns = ErrorPatterns.BROWSER_PATTERNS;
 * 
 * // Check if an error message matches browser patterns
 * const errorMessage = "browser has been closed unexpectedly";
 * const isMatch = browserPatterns.patterns.some(pattern => pattern.test(errorMessage));
 * ```
 * 
 * ## Pattern Structure
 * Each error pattern follows the `ErrorPatternGroup` interface:
 * - `category`: Classification identifier for the error type
 * - `context`: Human-readable description of the error context
 * - `patterns`: Array of RegExp objects for matching error messages
 * 
 * ## Pattern Categories
 * The class organizes error patterns into logical groups:
 * - **Browser Errors**: Browser crashes, disconnections, and launch failures
 * - **Element Errors**: DOM element not found, interaction failures
 * - **Network Errors**: API failures, timeouts, connectivity issues
 * - **Page Errors**: Navigation, loading, and rendering problems
 * - **Authentication Errors**: Login failures, session timeouts
 * - **Validation Errors**: Form validation and data integrity issues
 * 
 * ## Usage Pattern
 * This class is designed for:
 * - Error message normalization and standardization
 * - Automated error categorization in testing frameworks
 * - Error monitoring and alerting systems
 * - Debugging and diagnostic tools
 * 
 * ## Implementation Notes
 * - All properties are `static readonly` for immutability and direct access
 * - Regular expressions use case-insensitive matching (`/i` flag)
 * - Patterns are designed to be flexible while maintaining specificity
 * - No instance methods - purely a data repository
 * 
 * @since 1.0.0
 * @readonly All properties are immutable
 */

import { ErrorPatternGroup } from "../../config/coreTypes/errors/error-handler.types";

export class ErrorPatterns {
  // Browser and Page Errors
  static readonly BROWSER_PATTERNS: ErrorPatternGroup = {
    category: "BROWSER_ERROR",
    context: "Browser Error",
    patterns: [
      /\bbrowser\s+(?:closed|crashed|disconnected|has\s+been\s+closed)\b/i,
      /\b(?:chromium|firefox|webkit)\s+(?:error|crashed|failed)\b/i,
      /\bbrowser\s+context\s+(?:closed|invalid|lost)\b/i,
      /\bbrowser\s+(?:process|instance)\s+(?:terminated|killed)\b/i,
      /\bbrowser\s+(?:launch|startup)\s+failed\b/i,
    ],
  };

  static readonly PAGE_PATTERNS: ErrorPatternGroup = {
    category: "PAGE_ERROR",
    context: "Page Error",
    patterns: [
      /\bpage\s+(?:closed|crashed|has\s+been\s+closed)\b/i,
      /\bpage\.goto\s+failed\b/i,
      /\btarget\s+page\s+(?:closed|crashed|destroyed)\b/i,
      /\bpage\s+navigation\s+failed\b/i,
      /\bpage\s+(?:not\s+found|unavailable|unresponsive)\b/i,
      /\bpage\s+(?:load|loading)\s+(?:failed|error|timeout)\b/i,
    ],
  };

  // Frame and IFrame Errors
  static readonly FRAME_PATTERNS: ErrorPatternGroup = {
    category: "FRAME_ERROR",
    context: "Frame Error",
    patterns: [
      /\bframe\s+(?:detached|not\s+found|destroyed|invalid)\b/i,
      /\bframe\.locator\s+failed\b/i,
      /\bframe\s+(?:access|loading|content)\s+(?:error|denied|failed)\b/i,
      /\bcross\s+frame\s+(?:error|access\s+denied|violation)\b/i,
      /\bframe\s+(?:navigation|switch)\s+(?:failed|error)\b/i,
    ],
  };

  static readonly IFRAME_PATTERNS: ErrorPatternGroup = {
    category: "IFRAME_ERROR",
    context: "IFrame Error",
    patterns: [
      /\biframe\s+(?:error|not\s+accessible|not\s+found|blocked)\b/i,
      /\biframe\s+(?:security|sandbox)\s+(?:error|violation|restriction)\b/i,
      /\biframe\s+(?:load|loading)\s+(?:failed|error|timeout)\b/i,
      /\biframe\s+(?:communication|interaction)\s+(?:failed|error)\b/i,
      /\biframe\s+(?:content|document)\s+(?:not\s+available|access\s+denied)\b/i,
    ],
  };

  static readonly FRAME_TIMEOUT_PATTERNS: ErrorPatternGroup = {
    category: "FRAME_TIMEOUT",
    context: "Frame Timeout Error",
    patterns: [
      /\bframe\s+(?:load|loading)\s+timeout\b/i,
      /\biframe\s+(?:load|loading)\s+timeout\b/i,
      /\bframe\s+(?:ready|available)\s+timeout\b/i,
      /\bwait\s+for\s+frame\s+timeout\b/i,
      /\bframe\s+(?:attach|detach)\s+timeout\b/i,
    ],
  };

  // Element and Interaction Errors
  static readonly ELEMENT_PATTERNS: ErrorPatternGroup = {
    category: "ELEMENT",
    context: "Element Interaction Error",
    patterns: [
      /\belement\s+(?:not\s+visible|not\s+attached|not\s+interactable|hidden)\b/i,
      /\belement\s+is\s+(?:not\s+attached|hidden|disabled|readonly)\b/i,
      /\bno\s+such\s+element\b/i,
      /\belement\s+(?:not\s+found|missing|unavailable)\b/i,
      /\belement\s+(?:stale|detached|destroyed)\b/i,
    ],
  };

  static readonly LOCATOR_PATTERNS: ErrorPatternGroup = {
    category: "LOCATOR",
    context: "Locator Error",
    patterns: [
      /\blocator\.(?:fill|click|type|clear|hover)\s+failed\b/i,
      /\blocator\s+(?:not\s+found|timed\s+out|invalid|empty)\b/i,
      /\bwaiting\s+for\s+locator\b/i,
      /\blocator\s+(?:timeout|error|exception)\b/i,
      /\blocator\s+(?:resolved\s+to\s+(?:zero|multiple)|ambiguous)\b/i,
    ],
  };

  static readonly SELECTOR_PATTERNS: ErrorPatternGroup = {
    category: "SELECTOR",
    context: "Selector Error",
    patterns: [
      /\binvalid\s+selector\b/i,
      /\bselector\s+resolved\s+to\b/i,
      /\bmalformed\s+selector\b/i,
      /\bcss\s+selector\s+(?:error|invalid|syntax\s+error)\b/i,
      /\bxpath\s+(?:error|invalid|syntax\s+error)\b/i,
      /\bselector\s+(?:not\s+found|empty|null)\b/i,
    ],
  };

  static readonly ELEMENT_STATE_PATTERNS: ErrorPatternGroup = {
    category: "ELEMENT_STATE_ERROR",
    context: "Element State Error",
    patterns: [
      /\belement\s+(?:state|condition)\s+(?:invalid|unexpected|error|mismatch)\b/i,
      /\belement\s+(?:not\s+in\s+expected\s+state|state\s+mismatch)\b/i,
      /\belement\s+(?:disabled|hidden|readonly)\s+(?:state|error)\b/i,
      /\belement\s+(?:enabled|visible|editable)\s+(?:check|validation)\s+failed\b/i,
      /\belement\s+(?:not\s+clickable|not\s+selectable|not\s+editable)\b/i,
    ],
  };

  // Interaction Errors
  static readonly KEYBOARD_PATTERNS: ErrorPatternGroup = {
    category: "KEYBOARD_ERROR",
    context: "Keyboard Error",
    patterns: [
      /\bkeyboard\s+(?:error|failed|not\s+working|unavailable)\b/i,
      /\bkey\s+(?:press|down|up)\s+(?:failed|error|timeout)\b/i,
      /\btype\s+(?:failed|error|timeout)\b/i,
      /\binput\s+method\s+(?:error|failed|not\s+supported)\b/i,
      /\bkeyboard\s+(?:input|events)\s+(?:blocked|failed)\b/i,
    ],
  };

  static readonly MOUSE_PATTERNS: ErrorPatternGroup = {
    category: "MOUSE_ERROR",
    context: "Mouse Error",
    patterns: [
      /\bmouse\s+(?:error|failed|not\s+working|unavailable)\b/i,
      /\bclick\s+(?:failed|error|not\s+working|intercepted)\b/i,
      /\bmouse\s+(?:move|hover|drag)\s+(?:failed|error|timeout)\b/i,
      /\bpointer\s+(?:events|error|blocked)\b/i,
      /\bmouse\s+(?:button|wheel)\s+(?:error|failed)\b/i,
    ],
  };

  static readonly DRAG_DROP_PATTERNS: ErrorPatternGroup = {
    category: "DRAG_DROP_ERROR",
    context: "Drag and Drop Error",
    patterns: [
      /\bdrag\s+(?:and\s+)?drop\s+(?:failed|error|timeout)\b/i,
      /\bdragstart\s+(?:failed|error|blocked)\b/i,
      /\bdrop\s+(?:failed|error|not\s+allowed|rejected)\b/i,
      /\bdraggable\s+(?:error|not\s+supported|disabled)\b/i,
      /\bdrag\s+(?:operation|gesture)\s+(?:failed|cancelled)\b/i,
    ],
  };

  static readonly HOVER_PATTERNS: ErrorPatternGroup = {
    category: "HOVER_ERROR",
    context: "Hover Error",
    patterns: [
      /\bhover\s+(?:failed|error|not\s+working|timeout)\b/i,
      /\bmouseover\s+(?:failed|error|blocked)\b/i,
      /\bmouseenter\s+(?:failed|error|blocked)\b/i,
      /\bhover\s+(?:state|effect)\s+(?:failed|error|not\s+triggered)\b/i,
      /\bhover\s+(?:action|event)\s+(?:cancelled|interrupted)\b/i,
    ],
  };

  static readonly GESTURE_PATTERNS: ErrorPatternGroup = {
    category: "GESTURE_ERROR",
    context: "Gesture Error",
    patterns: [
      /\btouch\s+(?:gesture|event)\s+(?:failed|error|not\s+supported)\b/i,
      /\bswipe\s+(?:failed|error|not\s+supported|timeout)\b/i,
      /\bpinch\s+(?:zoom|gesture)\s+(?:failed|error|not\s+supported)\b/i,
      /\bmulti\s+touch\s+(?:failed|error|not\s+supported)\b/i,
      /\btouch\s+(?:screen|input)\s+(?:error|unavailable)\b/i,
    ],
  };

  // Wait and State Conditions
  static readonly WAIT_CONDITION_PATTERNS: ErrorPatternGroup = {
    category: "WAIT_CONDITION_ERROR",
    context: "Wait Condition Error",
    patterns: [
      /\bwait\s+(?:for|until)\s+(?:condition|state)\s+(?:failed|timeout|never\s+met)\b/i,
      /\bwait\s+for\s+(?:element|text|attribute)\s+(?:failed|timeout)\b/i,
      /\bexpected\s+condition\s+(?:not\s+met|failed|timeout|never\s+satisfied)\b/i,
      /\bwait\s+condition\s+(?:never|not)\s+(?:satisfied|met|fulfilled)\b/i,
      /\bwait\s+(?:for\s+)?(?:visible|hidden|enabled|disabled)\s+(?:failed|timeout)\b/i,
    ],
  };

  // Tab and Window Management
  static readonly TAB_PATTERNS: ErrorPatternGroup = {
    category: "TAB_ERROR",
    context: "Tab Error",
    patterns: [
      /\btab\s+(?:switch|change|focus)\s+(?:failed|error|timeout)\b/i,
      /\btab\s+(?:not\s+found|closed|invalid|destroyed)\b/i,
      /\btab\s+(?:creation|opening)\s+(?:failed|error|blocked)\b/i,
      /\bmultiple\s+tabs\s+(?:error|issue|conflict)\b/i,
      /\btab\s+(?:handle|reference)\s+(?:invalid|lost|stale)\b/i,
    ],
  };

  static readonly WINDOW_PATTERNS: ErrorPatternGroup = {
    category: "WINDOW_ERROR",
    context: "Window Error",
    patterns: [
      /\bwindow\s+(?:switch|focus|resize)\s+(?:failed|error|timeout)\b/i,
      /\bwindow\s+(?:not\s+found|closed|invalid|destroyed)\b/i,
      /\bpopup\s+(?:window|blocked|error|failed)\b/i,
      /\bwindow\s+(?:handle|reference)\s+(?:invalid|lost|stale)\b/i,
      /\bmultiple\s+windows\s+(?:error|conflict)\b/i,
    ],
  };

  static readonly CONTEXT_PATTERNS: ErrorPatternGroup = {
    category: "CONTEXT_ERROR",
    context: "Context Error",
    patterns: [
      /\bbrowser\s+context\s+(?:error|invalid|closed|destroyed)\b/i,
      /\bcontext\s+(?:switch|creation|management)\s+(?:failed|error)\b/i,
      /\bisolated\s+context\s+(?:error|failed|not\s+available)\b/i,
      /\bcontext\s+(?:not\s+found|expired|invalid|corrupted)\b/i,
      /\bcontext\s+(?:isolation|security)\s+(?:error|violation)\b/i,
    ],
  };

  // Scroll and Viewport
  static readonly SCROLL_PATTERNS: ErrorPatternGroup = {
    category: "SCROLL_ERROR",
    context: "Scroll Error",
    patterns: [
      /\bscroll\s+(?:into\s+view\s+)?(?:failed|error|not\s+working|timeout)\b/i,
      /\bscroll\s+(?:to\s+)?(?:element|position)\s+(?:failed|error|impossible)\b/i,
      /\bscrollable\s+(?:area|container)\s+(?:not\s+found|error|unavailable)\b/i,
      /\bscroll\s+(?:behavior|animation)\s+(?:failed|error|interrupted)\b/i,
      /\bscroll\s+(?:position|offset)\s+(?:invalid|error)\b/i,
    ],
  };

  static readonly VIEWPORT_PATTERNS: ErrorPatternGroup = {
    category: "VIEWPORT_ERROR",
    context: "Viewport Error",
    patterns: [
      /\bviewport\s+(?:size|dimensions|resize)\s+(?:failed|error|invalid)\b/i,
      /\bviewport\s+(?:not\s+set|invalid|error|mismatch)\b/i,
      /\bscreen\s+resolution\s+(?:error|not\s+supported|mismatch)\b/i,
      /\bdevice\s+viewport\s+(?:error|mismatch|not\s+supported)\b/i,
      /\bviewport\s+(?:configuration|settings)\s+(?:failed|invalid)\b/i,
    ],
  };

  // Cookie and Session Management
  static readonly COOKIE_PATTERNS: ErrorPatternGroup = {
    category: "COOKIE_ERROR",
    context: "Cookie Error",
    patterns: [
      /\bcookie\s+(?:failed|error|invalid|expired|blocked)\b/i,
      /\bset\s+cookie\s+(?:failed|error|rejected)\b/i,
      /\bcookie\s+(?:not\s+found|missing|unavailable)\b/i,
      /\bcookie\s+(?:security|samesite|httponly)\s+(?:error|violation)\b/i,
      /\bcookie\s+(?:domain|path)\s+(?:mismatch|error)\b/i,
    ],
  };

  static readonly SESSION_PATTERNS: ErrorPatternGroup = {
    category: "SESSION_ERROR",
    context: "Session Error",
    patterns: [
      /\bsession\s+(?:expired|invalid|not\s+found|timeout|destroyed)\b/i,
      /\bsession\s+(?:failed|error|corrupted)\b/i,
      /\bsession\s+(?:storage|management)\s+(?:error|failed)\b/i,
      /\buser\s+session\s+(?:terminated|invalid|expired)\b/i,
      /\bsession\s+(?:restore|recovery)\s+(?:failed|error)\b/i,
    ],
  };

  static readonly STORAGE_PATTERNS: ErrorPatternGroup = {
    category: "STORAGE_ERROR",
    context: "Storage Error",
    patterns: [
      /\b(?:localStorage|sessionStorage|indexedDB)\s+(?:error|failed|not\s+supported)\b/i,
      /\bstorage\s+(?:quota|limit)\s+(?:exceeded|full|error)\b/i,
      /\bweb\s+storage\s+(?:error|unavailable|disabled)\b/i,
      /\bstorage\s+(?:access|permission)\s+(?:denied|blocked)\b/i,
      /\bstorage\s+(?:corruption|integrity)\s+(?:error|check\s+failed)\b/i,
    ],
  };

  // File Operations
  static readonly SCREENSHOT_PATTERNS: ErrorPatternGroup = {
    category: "SCREENSHOT_ERROR",
    context: "Screenshot Error",
    patterns: [
      /\bscreenshot\s+(?:failed|timeout|error|capture\s+failed)\b/i,
      /\bpage\.screenshot\s+(?:failed|error|timeout)\b/i,
      /\bimage\s+capture\s+(?:failed|error|timeout)\b/i,
      /\bscreenshot\s+(?:save|write)\s+(?:failed|error)\b/i,
      /\bvisual\s+(?:capture|recording)\s+(?:failed|error)\b/i,
    ],
  };

  static readonly DOWNLOAD_PATTERNS: ErrorPatternGroup = {
    category: "DOWNLOAD_ERROR",
    context: "Download Error",
    patterns: [
      /\bdownload\s+(?:failed|timeout|error|cancelled)\b/i,
      /\bwaitForDownload\s+(?:failed|timeout|error)\b/i,
      /\bfile\s+download\s+(?:failed|interrupted|blocked)\b/i,
      /\bdownload\s+(?:path|location)\s+(?:invalid|error|not\s+accessible)\b/i,
      /\bdownload\s+(?:permission|security)\s+(?:error|denied)\b/i,
    ],
  };

  static readonly UPLOAD_PATTERNS: ErrorPatternGroup = {
    category: "UPLOAD_ERROR",
    context: "Upload Error",
    patterns: [
      /\bupload\s+(?:failed|timeout|error|rejected)\b/i,
      /\bsetInputFiles\s+(?:failed|error|timeout)\b/i,
      /\bfile\s+upload\s+(?:failed|error|blocked|too\s+large)\b/i,
      /\bupload\s+(?:path|file)\s+(?:invalid|not\s+found|error)\b/i,
      /\bfile\s+(?:selection|input)\s+(?:failed|error)\b/i,
    ],
  };

  // Network and API
  static readonly NETWORK_PATTERNS: ErrorPatternGroup = {
    category: "NETWORK",
    context: "Network Error",
    patterns: [
      /\bnetwork\s+(?:error|failure|timeout|unavailable)\b/i,
      /\bdns\s+(?:error|failure|resolution\s+failed|lookup\s+failed)\b/i,
      /\bhost\s+(?:unreachable|not\s+found|unavailable)\b/i,
      /\bconnection\s+(?:refused|reset|failed|timeout|lost)\b/i,
      /\bnetwork\s+(?:connectivity|connection)\s+(?:lost|error)\b/i,
    ],
  };

  static readonly HTTP_CLIENT_PATTERNS: ErrorPatternGroup = {
    category: "HTTP_CLIENT",
    context: "HTTP Client Error",
    patterns: [
      /\b(?:400|401|403|404|409|422|429)\b/,
      /\bclient\s+error\b/i,
      /\bbad\s+request\b/i,
      /\bunauthorized\b/i,
      /\bforbidden\b/i,
      /\bnot\s+found\b/i,
      /\bconflict\b/i,
      /\btoo\s+many\s+requests\b/i,
    ],
  };

  static readonly HTTP_SERVER_PATTERNS: ErrorPatternGroup = {
    category: "HTTP_SERVER",
    context: "HTTP Server Error",
    patterns: [
      /\b(?:500|502|503|504)\b/,
      /\bserver\s+error\b/i,
      /\binternal\s+server\s+error\b/i,
      /\bservice\s+unavailable\b/i,
      /\bgateway\s+(?:timeout|error)\b/i,
      /\bbad\s+gateway\b/i,
    ],
  };

  static readonly CORS_PATTERNS: ErrorPatternGroup = {
    category: "CORS",
    context: "CORS Error",
    patterns: [
      /\bcors\s+(?:error|policy|violation)\b/i,
      /\bcross-origin\s+(?:request|error|blocked)\b/i,
      /\baccess-control-allow-origin\b/i,
      /\bcors\s+(?:preflight|header)\s+(?:failed|error)\b/i,
      /\borigin\s+(?:not\s+allowed|blocked|rejected)\b/i,
    ],
  };

  static readonly INTERCEPT_PATTERNS: ErrorPatternGroup = {
    category: "INTERCEPT",
    context: "Network Interception Error",
    patterns: [
      /\bpage\.route\s+(?:failed|error|timeout)\b/i,
      /\brequest\s+interception\s+(?:failed|error|blocked)\b/i,
      /\bmock\s+response\s+(?:failed|error|invalid)\b/i,
      /\bnetwork\s+(?:mock|stub)\s+(?:failed|error)\b/i,
      /\broute\s+(?:handler|interceptor)\s+(?:failed|error)\b/i,
    ],
  };

  // Authentication and Authorization
  static readonly AUTHENTICATION_PATTERNS: ErrorPatternGroup = {
    category: "AUTHENTICATION",
    context: "Authentication Error",
    patterns: [
      /\bauthentication\s+(?:failed|error|required|invalid)\b/i,
      /\blogin\s+(?:failed|error|required|invalid)\b/i,
      /\binvalid\s+(?:credentials|username|password)\b/i,
      /\bauth\s+(?:token|session)\s+(?:invalid|expired|missing)\b/i,
      /\b(?:signin|sign-in)\s+(?:failed|error|required)\b/i,
    ],
  };

  static readonly AUTHORIZATION_PATTERNS: ErrorPatternGroup = {
    category: "AUTHORIZATION",
    context: "Authorization Error",
    patterns: [
      /\bauthorization\s+(?:failed|error|required|denied)\b/i,
      /\baccess\s+(?:denied|forbidden|restricted)\b/i,
      /\bpermission\s+(?:denied|required|insufficient)\b/i,
      /\bunauthorized\s+(?:access|operation|request)\b/i,
      /\bprivileges?\s+(?:insufficient|required|missing)\b/i,
    ],
  };

  static readonly TOKEN_EXPIRED_PATTERNS: ErrorPatternGroup = {
    category: "TOKEN_EXPIRED",
    context: "Token Expired Error",
    patterns: [
      /\btoken\s+(?:expired|invalid|missing|malformed)\b/i,
      /\bjwt\s+(?:expired|invalid|malformed|signature\s+verification\s+failed)\b/i,
      /\baccess\s+token\s+(?:expired|invalid|revoked)\b/i,
      /\brefresh\s+token\s+(?:expired|invalid|missing)\b/i,
      /\bbearer\s+token\s+(?:invalid|expired|missing)\b/i,
    ],
  };

  // Timeout Errors
  static readonly TIMEOUT_PATTERNS: ErrorPatternGroup = {
    category: "TIMEOUT",
    context: "Timeout Error",
    patterns: [
      /\btimeout\s+(?:exceeded|error|reached)\b/i,
      /\btimed\s+out\b/i,
      /\bwait\s+timeout\b/i,
      /\bnavigation\s+timeout\b/i,
      /\blocator\s+timeout\b/i,
      /\bexpect\s+timeout\b/i,
      /\b\d+ms\s+timeout\b/i,
      /\boperation\s+(?:timed\s+out|timeout)\b/i,
    ],
  };

  // Test and Assertion Errors
  static readonly TEST_PATTERNS: ErrorPatternGroup = {
    category: "TEST",
    context: "Test Error",
    patterns: [
      /\btest\s+(?:failed|error|timeout|assertion)\b/i,
      /\bassertion\s+(?:failed|error|timeout)\b/i,
      /\bexpected\s+.*\s+but\s+(?:got|received|was)\b/i,
      /\bexpect.*(?:toBe|toEqual|toMatch|toHave|toContain).*failed\b/i,
      /\btest\s+(?:suite|case)\s+(?:failed|error|timeout)\b/i,
      /\bmatcher\s+(?:failed|error|not\s+found)\b/i,
      /\bplaywright\s+(?:test|assertion)\s+(?:failed|error)\b/i,
    ],
  };

  static readonly FIXTURE_PATTERNS: ErrorPatternGroup = {
    category: "FIXTURE",
    context: "Test Fixture Error",
    patterns: [
      /\bfixture\s+(?:failed|error|timeout|not\s+found)\b/i,
      /\b(?:before|after)\s+(?:each|all)\s+(?:failed|error|timeout)\b/i,
      /\bsetup\s+(?:failed|error|timeout)\b/i,
      /\bteardown\s+(?:failed|error|timeout)\b/i,
      /\btest\s+(?:data|fixture)\s+(?:failed|error|missing)\b/i,
    ],
  };

  // CSS and Style Errors
  static readonly CSS_PATTERNS: ErrorPatternGroup = {
    category: "CSS_ERROR",
    context: "CSS Error",
    patterns: [
      /\bcss\s+(?:selector|rule|property)\s+(?:error|invalid|syntax\s+error)\b/i,
      /\bcss\s+(?:parsing|syntax)\s+error\b/i,
      /\bstylesheet\s+(?:loading|error|not\s+found|failed\s+to\s+load)\b/i,
      /\bcss\s+(?:import|load)\s+(?:failed|error)\b/i,
      /\bcss\s+(?:media|query)\s+(?:error|invalid)\b/i,
    ],
  };

  static readonly STYLE_PATTERNS: ErrorPatternGroup = {
    category: "STYLE_ERROR",
    context: "Style Error",
    patterns: [
      /\bstyle\s+(?:property|attribute)\s+(?:error|invalid|not\s+found)\b/i,
      /\bcomputed\s+style\s+(?:error|failed|unavailable)\b/i,
      /\binline\s+style\s+(?:error|invalid|parsing\s+failed)\b/i,
      /\bstyle\s+(?:inheritance|cascade)\s+(?:error|issue|conflict)\b/i,
      /\bstyle\s+(?:application|computation)\s+(?:failed|error)\b/i,
    ],
  };

  // Text and Content Verification
  static readonly TEXT_VERIFICATION_PATTERNS: ErrorPatternGroup = {
    category: "TEXT_VERIFICATION_ERROR",
    context: "Text Verification Error",
    patterns: [
      /\btext\s+(?:verification|validation|check)\s+(?:failed|error|mismatch)\b/i,
      /\btext\s+(?:content|value)\s+(?:mismatch|incorrect|error|unexpected)\b/i,
      /\bexpected\s+text\s+(?:not\s+found|different|error|missing)\b/i,
      /\btext\s+(?:assertion|comparison)\s+(?:failed|error|timeout)\b/i,
      /\btext\s+(?:match|pattern)\s+(?:failed|error|not\s+found)\b/i,
    ],
  };

  static readonly CONTENT_MISMATCH_PATTERNS: ErrorPatternGroup = {
    category: "CONTENT_MISMATCH_ERROR",
    context: "Content Mismatch Error",
    patterns: [
      /\bcontent\s+(?:mismatch|different|unexpected|changed)\b/i,
      /\bpage\s+content\s+(?:changed|incorrect|error|unexpected)\b/i,
      /\bexpected\s+content\s+(?:not\s+found|missing|different)\b/i,
      /\bcontent\s+(?:verification|validation)\s+(?:failed|error|mismatch)\b/i,
      /\bcontent\s+(?:comparison|check)\s+(?:failed|error)\b/i,
    ],
  };

  // JavaScript Error Types
  static readonly TYPE_ERROR_PATTERNS: ErrorPatternGroup = {
    category: "TYPE_ERROR",
    context: "Type Error",
    patterns: [
      /\bTypeError\b/,
      /\bcannot\s+read\s+propert(?:y|ies)\s+of\s+(?:null|undefined)\b/i,
      /\bis\s+not\s+a\s+function\b/i,
      /\bundefined\s+is\s+not\s+an?\s+(?:object|function)\b/i,
      /\bcannot\s+set\s+propert(?:y|ies)\s+of\s+(?:null|undefined)\b/i,
      /\bcannot\s+access\s+.*\s+before\s+initialization\b/i,
      /\bcannot\s+convert\s+.*\s+to\s+(?:object|string|number)\b/i,
      /\binvalid\s+assignment\s+to\s+const\b/i,
    ],
  };

  static readonly REFERENCE_ERROR_PATTERNS: ErrorPatternGroup = {
    category: "REFERENCE_ERROR",
    context: "Reference Error",
    patterns: [
      /\bReferenceError\b/,
      /\bis\s+not\s+defined\b/i,
      /\bundeclared\s+(?:variable|identifier)\b/i,
      /\binvalid\s+left-hand\s+side\s+in\s+assignment\b/i,
      /\bcannot\s+access\s+.*\s+before\s+initialization\b/i,
      /\bidentifier\s+.*\s+has\s+already\s+been\s+declared\b/i,
    ],
  };

  static readonly SYNTAX_ERROR_PATTERNS: ErrorPatternGroup = {
    category: "SYNTAX_ERROR",
    context: "Syntax Error",
    patterns: [
      /\bSyntaxError\b/,
      /\bunexpected\s+(?:token|identifier|end\s+of\s+input)\b/i,
      /\binvalid\s+or\s+unexpected\s+token\b/i,
      /\bmissing\s+(?:\)|;|,)\s+(?:after|before)\b/i,
      /\bunmatched\s+(?:\(|\)|{|}|\[|\])\b/i,
      /\billegal\s+(?:character|token|break\s+statement)\b/i,
      /\bunexpected\s+end\s+of\s+(?:input|file)\b/i,
    ],
  };

  static readonly RANGE_ERROR_PATTERNS: ErrorPatternGroup = {
    category: "RANGE_ERROR",
    context: "Range Error",
    patterns: [
      /\bRangeError\b/,
      /\binvalid\s+(?:array|string)\s+length\b/i,
      /\bmaximum\s+call\s+stack\s+size\s+exceeded\b/i,
      /\bprecision\s+out\s+of\s+range\b/i,
      /\binvalid\s+(?:count|radix|time)\s+value\b/i,
      /\bnumber\s+(?:out\s+of\s+range|too\s+large|too\s+small)\b/i,
    ],
  };

  // File System Errors
  static readonly FILE_NOT_FOUND_PATTERNS: ErrorPatternGroup = {
    category: "FILE_NOT_FOUND",
    context: "File Not Found Error",
    patterns: [
      /\bENOENT\b/,
      /\bfile\s+not\s+found\b/i,
      /\bno\s+such\s+file\s+or\s+directory\b/i,
      /\bcannot\s+find\s+(?:file|path|module)\b/i,
      /\bpath\s+does\s+not\s+exist\b/i,
      /\bresource\s+not\s+found\b/i,
      /\bmissing\s+(?:file|resource|asset)\b/i,
    ],
  };

  static readonly FILE_EXISTS_PATTERNS: ErrorPatternGroup = {
    category: "FILE_EXISTS",
    context: "File Already Exists Error",
    patterns: [
      /\bEEXIST\b/,
      /\bfile\s+(?:already\s+exists|exists)\b/i,
      /\bdirectory\s+(?:already\s+exists|exists)\b/i,
      /\bcannot\s+create\s+.*\s+(?:file|directory)\s+exists\b/i,
      /\bduplicate\s+(?:file|resource)\b/i,
    ],
  };

  static readonly ACCESS_DENIED_PATTERNS: ErrorPatternGroup = {
    category: "ACCESS_DENIED",
    context: "Access Denied Error",
    patterns: [
      /\bEACCES\b/,
      /\bEPERM\b/,
      /\baccess\s+(?:denied|forbidden)\b/i,
      /\bpermission\s+denied\b/i,
      /\binsufficient\s+(?:permissions|privileges)\b/i,
      /\bunauthorized\s+(?:access|operation)\b/i,
      /\bcannot\s+(?:read|write|execute|access)\s+.*\s+permission\b/i,
    ],
  };

  static readonly FILE_TOO_LARGE_PATTERNS: ErrorPatternGroup = {
    category: "FILE_TOO_LARGE",
    context: "File Too Large Error",
    patterns: [
      /\bEFBIG\b/,
      /\bfile\s+(?:too\s+large|size\s+exceeded)\b/i,
      /\bmaximum\s+file\s+size\s+(?:exceeded|reached)\b/i,
      /\bfile\s+size\s+limit\s+(?:exceeded|reached)\b/i,
      /\bbuffer\s+(?:too\s+large|overflow)\b/i,
      /\bmemory\s+limit\s+exceeded\b/i,
    ],
  };

  // Connection and Network Errors
  static readonly CONNECTION_PATTERNS: ErrorPatternGroup = {
    category: "CONNECTION",
    context: "Connection Error",
    patterns: [
      /\bECONNREFUSED\b/,
      /\bECONNRESET\b/,
      /\bconnection\s+(?:refused|reset|failed|lost|dropped)\b/i,
      /\bcannot\s+connect\s+to\s+(?:server|host|database)\b/i,
      /\bconnection\s+(?:timeout|timed\s+out)\b/i,
      /\bsocket\s+(?:error|timeout|connection\s+failed)\b/i,
      /\bpeer\s+(?:reset|closed)\s+connection\b/i,
    ],
  };

  // Security Errors
  static readonly SECURITY_ERROR_PATTERNS: ErrorPatternGroup = {
    category: "SECURITY_ERROR",
    context: "Security Error",
    patterns: [
      /\bsecurity\s+(?:error|violation|policy)\b/i,
      /\bblocked\s+by\s+(?:security|policy|csp)\b/i,
      /\bcontent\s+security\s+policy\b/i,
      /\bmixed\s+content\s+(?:error|blocked)\b/i,
      /\binsecure\s+(?:request|content|connection)\b/i,
      /\bssl\s+(?:error|certificate|handshake)\s+(?:failed|error)\b/i,
      /\bcertificate\s+(?:error|invalid|expired)\b/i,
    ],
  };

  // Mobile and Device Errors
  static readonly MOBILE_DEVICE_PATTERNS: ErrorPatternGroup = {
    category: "MOBILE_DEVICE",
    context: "Mobile Device Error",
    patterns: [
      /\bmobile\s+(?:device|emulation)\s+(?:error|failed|not\s+supported)\b/i,
      /\bdevice\s+(?:orientation|rotation)\s+(?:error|failed)\b/i,
      /\btouch\s+(?:events|gestures)\s+(?:not\s+supported|failed)\b/i,
      /\bmobile\s+viewport\s+(?:error|mismatch|failed)\b/i,
      /\buser\s+agent\s+(?:mobile|device)\s+(?:error|invalid)\b/i,
      /\bdevice\s+(?:metrics|dimensions)\s+(?:error|invalid)\b/i,
      /\bmobile\s+(?:browser|webview)\s+(?:error|not\s+supported)\b/i,
    ],
  };

  // API and Version Errors
  static readonly API_VERSION_ERROR_PATTERNS: ErrorPatternGroup = {
    category: "API_VERSION_ERROR",
    context: "API Version Error",
    patterns: [
      /\bapi\s+version\s+(?:mismatch|not\s+supported|deprecated)\b/i,
      /\bversion\s+(?:not\s+supported|incompatible|outdated)\b/i,
      /\bdeprecated\s+(?:api|endpoint|method)\b/i,
      /\blegacy\s+(?:api|version)\s+(?:error|not\s+supported)\b/i,
      /\bapi\s+(?:compatibility|backward\s+compatibility)\s+(?:error|issue)\b/i,
      /\bschema\s+version\s+(?:mismatch|incompatible)\b/i,
    ],
  };

  // Dialog and Modal Errors
  static readonly DIALOG_PATTERNS: ErrorPatternGroup = {
    category: "DIALOG",
    context: "Dialog Error",
    patterns: [
      /\bdialog\s+(?:not\s+found|error|timeout|handling)\b/i,
      /\balert\s+(?:not\s+handled|error|timeout)\b/i,
      /\bconfirm\s+(?:dialog|not\s+handled|error)\b/i,
      /\bprompt\s+(?:dialog|not\s+handled|error)\b/i,
      /\bmodal\s+(?:dialog|window)\s+(?:error|not\s+found|timeout)\b/i,
      /\bpopup\s+(?:dialog|window)\s+(?:blocked|error|not\s+found)\b/i,
      /\bjavascript\s+(?:alert|dialog)\s+(?:error|not\s+handled)\b/i,
    ],
  };

  // Conflict and Resource Errors
  static readonly CONFLICT_PATTERNS: ErrorPatternGroup = {
    category: "CONFLICT",
    context: "Conflict Error",
    patterns: [
      /\bconflict\s+(?:error|detected|resolution)\b/i,
      /\bresource\s+(?:conflict|locked|busy)\b/i,
      /\bconcurrent\s+(?:modification|access)\s+(?:error|conflict)\b/i,
      /\bversion\s+conflict\b/i,
      /\boptimistic\s+lock\s+(?:error|exception)\b/i,
      /\bdata\s+(?:conflict|collision|race\s+condition)\b/i,
      /\bmutex\s+(?:lock|conflict|timeout)\b/i,
    ],
  };
}
