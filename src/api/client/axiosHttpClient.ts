import axios, { AxiosResponse, AxiosRequestConfig } from "axios";
import ApiErrorHandler from "../../utils/errors/apiErrorHandler";
import ErrorHandler from "../../utils/errors/errorHandler";

export class AxiosHttpClient {
  private readonly defaultHeaders: Record<string, string>;

  /**
   * Initializes the HttpClient with default headers and SSL configuration.
   */
  constructor() {
    this.defaultHeaders = {
      "Content-Type": "application/json",
    };
  }

  /**
   * Creates axios configuration with appropriate headers and SSL handling
   */
  private createAxiosConfig(
    authorizationHeader?: string,
    additionalHeaders?: Record<string, string>,
  ): AxiosRequestConfig {
    const headers = { ...this.defaultHeaders };

    if (authorizationHeader) {
      headers["Authorization"] = authorizationHeader.startsWith("Bearer ")
        ? authorizationHeader
        : `Bearer ${authorizationHeader}`;
    }

    if (additionalHeaders) {
      Object.assign(headers, additionalHeaders);
    }

    const config: AxiosRequestConfig = {
      headers,
    };

    return config;
  }

  /**
   * Sends an HTTP request using the specified method, endpoint, payload, and headers.
   * Returns both successful and error responses without throwing.
   *
   * @template T - The expected response type.
   * @param method - The HTTP method to use for the request
   * @param endpoint - The URL endpoint to which the request is sent.
   * @param payload - The optional payload to be included in the request body.
   * @param authorizationHeader - Optional authorization header (bearer token).
   * @returns A promise that resolves with the Axios response (success or error).
   * @throws Will only throw for non-HTTP errors (network issues, timeouts, etc.)
   */
  private async sendRequest<T>(
    method: "get" | "post" | "put" | "patch" | "delete",
    endpoint: string,
    payload?: unknown,
    authorizationHeader?: string,
  ): Promise<AxiosResponse<T>> {
    try {
      const config = this.createAxiosConfig(authorizationHeader);

      switch (method) {
        case "get":
        case "delete":
          return await axios[method]<T>(endpoint, config);
        case "post":
        case "put":
        case "patch":
          return await axios[method]<T>(endpoint, payload, config);
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }
    } catch (error) {
      return this.handleApiResponse(error, method, endpoint);
    }
  }

  // Public HTTP method implementations
  public async get<T>(endpoint: string, authorization?: string): Promise<AxiosResponse<T>> {
    return this.sendRequest<T>("get", endpoint, undefined, authorization);
  }

  public async post<T>(
    endpoint: string,
    payload?: unknown,
    authorization?: string,
  ): Promise<AxiosResponse<T>> {
    return this.sendRequest<T>("post", endpoint, payload, authorization);
  }

  public async put<T>(
    endpoint: string,
    payload?: unknown,
    authorization?: string,
  ): Promise<AxiosResponse<T>> {
    return this.sendRequest<T>("put", endpoint, payload, authorization);
  }

  public async patch<T>(
    endpoint: string,
    payload?: unknown,
    authorization?: string,
  ): Promise<AxiosResponse<T>> {
    return this.sendRequest<T>("patch", endpoint, payload, authorization);
  }

  public async delete<T>(endpoint: string, authorization?: string): Promise<AxiosResponse<T>> {
    return this.sendRequest<T>("delete", endpoint, undefined, authorization);
  }

  /**
   * Handles Axios errors by capturing them with ApiErrorHandler and returning the response,
   * and handles other errors by capturing them with ErrorHandler and rethrowing them.
   *
   * @param error - The error to handle.
   * @param method - The HTTP method used for the request.
   * @param endpoint - The endpoint to which the request was sent.
   *
   * @throws The error if it is not an Axios error.
   */
  private handleApiResponse(error: unknown, method: string, endpoint: string) {
    if (axios.isAxiosError(error) && error.response) {
      ApiErrorHandler.captureError(
        error,
        `${method.toUpperCase()} Request`,
        `Failed to send ${method.toUpperCase()} request to ${endpoint}`,
      );
      return error.response;
    }

    // For other errors, handle them normally
    ErrorHandler.captureError(
      error,
      `${method.toUpperCase()}`,
      `Failed to send ${method.toUpperCase()} request to ${endpoint}`,
    );
    throw error;
  }
}
