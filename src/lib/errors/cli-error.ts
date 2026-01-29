/**
 * Custom error classes for better error handling and user-friendly messages
 */

export class CLIError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly suggestions: string[] = [],
  ) {
    super(message);
    this.name = 'CLIError';
  }
}

export class NetworkError extends CLIError {
  constructor(
    message: string,
    public readonly url?: string,
    public readonly statusCode?: number,
  ) {
    super(
      message,
      'NETWORK_ERROR',
      [
        'Check your internet connection',
        'Verify the API is accessible',
        'Try again in a few moments',
      ],
    );
    this.name = 'NetworkError';
  }
}

export class NotFoundError extends CLIError {
  constructor(resourceType: string, identifier: string) {
    super(
      `${resourceType} not found: ${identifier}`,
      'NOT_FOUND',
      [
        'Verify the identifier is correct',
        'Try searching for the user first',
      ],
    );
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends CLIError {
  constructor(message: string, public readonly field?: string) {
    super(
      message,
      'VALIDATION_ERROR',
      ['Check your input and try again'],
    );
    this.name = 'ValidationError';
  }
}

export class APIError extends CLIError {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly response?: any,
  ) {
    super(
      message,
      'API_ERROR',
      [
        'The API returned an error',
        'Try again or contact support if the issue persists',
      ],
    );
    this.name = 'APIError';
  }
}
