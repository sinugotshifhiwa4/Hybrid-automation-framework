import { ErrorCategory } from '../../config/coreTypes/errors/error-category.enum';
import { ErrorDetails } from '../../config/coreTypes/errors/error-handler.types';
import logger from '../logging/loggerManager';
import ErrorProcessor from './errorProcessor';

export default class ErrorHandler {
  private static loggedErrors = new Set<string>();

  /**
   * Centralized error capture with better error extraction and logging.
   * @param error - The error to log
   * @param source - The source of the error (e.g. function name)
   * @param context - Optional additional context for the error
   * @returns void
   */
  public static captureError(error: unknown, source: string, context?: string): void {
  const startTime = Date.now(); // Start time for performance monitoring
  try {
    const details = ErrorProcessor.createErrorDetails(error, source, context);
    const cacheKey = ErrorProcessor.generateErrorCacheKey(details);

    // Skip if already logged this execution
    if (this.loggedErrors.has(cacheKey)) {
      return;
    }

    this.loggedErrors.add(cacheKey);
    this.logStructuredError(details);
    this.logAdditionalDetails(error, source);
  } catch (loggingError) {
    this.handleLoggingFailure(loggingError, source);
  } finally {
    const duration = Date.now() - startTime; // Calculate duration
    logger.info(`Error capture duration: ${duration}ms`);
  }
}


   public static logAndThrow(message: string, source: string): never {
    this.captureError(new Error(message), source);
    throw new Error(message);
  }

  /**
   * Log structured error details with proper typing
   */
  private static logStructuredError(details: ErrorDetails): void {
    const sanitizedDetails = ErrorProcessor.sanitizeErrorObject(
      details as unknown as Record<string, unknown>,
    );

    // Add severity level based on category
    const logLevel = this.getLogLevel(details.category);
    const logMessage = JSON.stringify(sanitizedDetails, null, 2);

    if (logLevel === 'warn') {
      logger.warn(logMessage);
    } else {
      logger.error(logMessage);
    }
  }

  /**
   * Log additional error details
   */
  private static logAdditionalDetails(error: unknown, source: string): void {
    const extraDetails = ErrorProcessor.extractAdditionalErrorDetails(error);

    if (Object.keys(extraDetails).length > 0) {
      logger.debug(
        JSON.stringify(
          {
            source,
            type: 'Additional Details',
            details: extraDetails,
          },
          null,
          2,
        ),
      );
    }
  }

  /**
   * Handle failures in the error logging process
   */
  private static handleLoggingFailure(loggingError: unknown, source: string): void {
    logger.error(
      JSON.stringify(
        {
          source,
          context: 'Error Handler Failure',
          message: ErrorProcessor.getErrorMessage(loggingError),
          category: ErrorCategory.UNKNOWN,
          timestamp: new Date().toISOString(),
        },
        null,
        2,
      ),
    );
  }

  /**
   * Determine appropriate log level based on error category
   */
  private static getLogLevel(category: ErrorCategory): 'error' | 'warn' {
    const warnCategories = [
      ErrorCategory.VALIDATION,
      ErrorCategory.NOT_FOUND,
      ErrorCategory.HTTP_CLIENT,
      ErrorCategory.RATE_LIMIT,
    ];

    return warnCategories.includes(category) ? 'warn' : 'error';
  }

  /**
   * Public accessor for getErrorMessage to maintain API compatibility
   */
  public static getErrorMessage(error: unknown): string {
    return ErrorProcessor.getErrorMessage(error);
  }

  private static resetCache(): void {
    this.loggedErrors.clear();
  }
}
