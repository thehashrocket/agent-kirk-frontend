import { z } from 'zod';

/**
 * Schema for chat request validation
 */
export const ChatRequestSchema = z.object({
  query: z.string().min(1, 'Query cannot be empty'),
  accountGA4: z.string(),
  propertyGA4: z.string(),
  conversationID: z.string(),
  dateToday: z.string(),
});

/**
 * Type for validated chat request data
 */
export type ChatRequest = z.infer<typeof ChatRequestSchema>;

/**
 * Possible status values for a query
 */
export type QueryStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

/**
 * Response structure for immediate responses
 */
export interface ChatResponse {
  status: QueryStatus;
  queryId: string;
  response?: string;
  error?: string;
  details?: unknown;
}

/**
 * Error response structure
 */
export interface ErrorResponse {
  error: string;
  message?: string;
  details?: unknown;
  queryId?: string;
  status?: QueryStatus;
}

/**
 * Error message constants
 */
export type ErrorMessage = string;

/**
 * Constants for the chat API
 */
export const CHAT_CONSTANTS = {
  IMMEDIATE_TIMEOUT: 3000, // Maximum time to wait for immediate response (3 seconds)
  ERROR_MESSAGES: {
    UNAUTHORIZED: 'Unauthorized' as ErrorMessage,
    INVALID_REQUEST: 'Invalid request data' as ErrorMessage,
    INTERNAL_ERROR: 'Internal server error' as ErrorMessage,
    INVALID_RESPONSE: 'Invalid response from LLM service' as ErrorMessage,
    UNKNOWN_ERROR: 'Unknown error' as ErrorMessage,
  },
} as const; 