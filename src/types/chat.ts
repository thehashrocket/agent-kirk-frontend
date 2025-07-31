// Message UI Status Constants
export const MESSAGE_STATUS = {
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  ERROR: 'ERROR',
} as const;

// API Status Constants - Aligned with Prisma QueryStatus enum
export const API_STATUS = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const;

export type MessageStatus = typeof MESSAGE_STATUS[keyof typeof MESSAGE_STATUS];
export type APIStatus = typeof API_STATUS[keyof typeof API_STATUS];

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
  timestampUpdatedAt: string;
  status?: MessageStatus;
  rating?: -1 | 0 | 1;
}

export interface QueryRequest {
  content: string;
  conversationId?: string;
  gaAccountId?: string;
  gaPropertyId?: string;
  gaPropertyIds?: string[];
  sproutSocialAccountIds?: string[];
  emailClientIds?: string[];
}

export interface QueryResponse {
  userQuery: {
    id: string;
    content: string;
    createdAt: string;
  };
  assistantResponse: {
    id: string;
    content: string;
    createdAt: string;
    status: APIStatus;
  };
}

/**
 * Helper function to convert API status to UI status
 * @param apiStatus - The API status to convert
 * @returns The corresponding UI status
 */
export function apiStatusToMessageStatus(apiStatus: APIStatus): MessageStatus {
  const statusMap: Record<APIStatus, MessageStatus> = {
    [API_STATUS.COMPLETED]: MESSAGE_STATUS.COMPLETED,
    [API_STATUS.FAILED]: MESSAGE_STATUS.ERROR,
    [API_STATUS.IN_PROGRESS]: MESSAGE_STATUS.PROCESSING,
    [API_STATUS.PENDING]: MESSAGE_STATUS.PROCESSING
  };
  return statusMap[apiStatus];
} 