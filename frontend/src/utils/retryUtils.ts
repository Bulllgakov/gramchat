export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: any) => boolean;
}

const defaultOptions: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  shouldRetry: (error) => {
    // Retry on network errors and 5xx server errors
    if (!error.response) return true; // Network error
    if (error.response.status >= 500 && error.response.status < 600) return true;
    if (error.response.status === 429) return true; // Rate limit
    return false;
  }
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  const opts = { ...defaultOptions, ...options };
  let lastError: any;
  let delay = opts.initialDelay;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Check if we should retry
      if (attempt === opts.maxRetries || !opts.shouldRetry(error)) {
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Calculate next delay with exponential backoff
      delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelay);
    }
  }
  
  throw lastError;
}

// Специальная версия для критических API вызовов
export async function withCriticalRetry<T>(
  fn: () => Promise<T>
): Promise<T> {
  return withRetry(fn, {
    maxRetries: 5,
    initialDelay: 2000,
    shouldRetry: (error) => {
      // Более агрессивная стратегия для критических вызовов
      if (!error.response) return true;
      if (error.response.status >= 500) return true;
      if (error.response.status === 429) return true;
      if (error.response.status === 408) return true; // Timeout
      return false;
    }
  });
}