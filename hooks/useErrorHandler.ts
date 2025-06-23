import { useState, useCallback } from 'react';
import { Alert } from 'react-native';

export interface AppError {
  message: string;
  code?: string;
  details?: any;
  timestamp: Date;
}

export interface ErrorHandlerOptions {
  showAlert?: boolean;
  logError?: boolean;
  fallbackMessage?: string;
}

export const useErrorHandler = () => {
  const [error, setError] = useState<AppError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleError = useCallback((
    error: unknown, 
    options: ErrorHandlerOptions = {}
  ) => {
    const {
      showAlert = true,
      logError = true,
      fallbackMessage = 'An unexpected error occurred. Please try again.'
    } = options;

    let appError: AppError;

    if (error instanceof Error) {
      appError = {
        message: error.message,
        details: error,
        timestamp: new Date(),
      };
    } else if (typeof error === 'string') {
      appError = {
        message: error,
        timestamp: new Date(),
      };
    } else {
      appError = {
        message: fallbackMessage,
        details: error,
        timestamp: new Date(),
      };
    }

    // Log error in development
    if (logError && __DEV__) {
      console.error('Error handled:', appError);
    }

    setError(appError);

    // Show user-friendly alert
    if (showAlert) {
      Alert.alert(
        'Error',
        appError.message,
        [{ text: 'OK', onPress: () => setError(null) }]
      );
    }

    return appError;
  }, []);

  const executeWithErrorHandling = useCallback(async <T>(
    asyncOperation: () => Promise<T>,
    options: ErrorHandlerOptions = {}
  ): Promise<T | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await asyncOperation();
      return result;
    } catch (error) {
      handleError(error, options);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const retry = useCallback(async <T>(
    asyncOperation: () => Promise<T>,
    options: ErrorHandlerOptions = {}
  ): Promise<T | null> => {
    return executeWithErrorHandling(asyncOperation, options);
  }, [executeWithErrorHandling]);

  return {
    error,
    isLoading,
    handleError,
    executeWithErrorHandling,
    clearError,
    retry,
  };
};

// Error types for better error handling
export class NetworkError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class StorageError extends Error {
  constructor(message: string, public operation?: string) {
    super(message);
    this.name = 'StorageError';
  }
}

// Helper functions for common error scenarios
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
};

export const isNetworkError = (error: unknown): boolean => {
  return error instanceof NetworkError || 
         (error instanceof Error && error.message.toLowerCase().includes('network'));
};

export const isValidationError = (error: unknown): boolean => {
  return error instanceof ValidationError;
};

export const isStorageError = (error: unknown): boolean => {
  return error instanceof StorageError;
};