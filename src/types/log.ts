/**
 * @fileoverview Log Type Definitions
 *
 * TypeScript type definitions for log-related data structures
 * used throughout the application, especially in API routes and logging utilities.
 */

/**
 * Log data structure returned from API
 *
 * @interface Log
 * @property {string} [id] - Unique identifier for the log (if present)
 * @property {string} [createdAt] - ISO date string when log was created
 * @property {string} [updatedAt] - ISO date string when log was last updated
 * @property {string} [eventMessage]
 * @property {string} [eventType]
 * @property {string} [errorMessage]
 * @property {string} [errorStackTrace]
 * @property {string} [message]
 * @property {object} [metrics]
 * @property {number} [metrics.cpuUsage]
 * @property {number} [metrics.memoryUsage]
 * @property {number} [metrics.responseTime]
 * @property {number} [metrics.requestSize]
 * @property {number} [metrics.responseSize]
 * @property {string} [nodeName]
 * @property {object} [payload]
 * @property {string} [payload.data]
 * @property {string} [payload.metadata]
 * @property {string} [queryId]
 * @property {object} [sourceReferences]
 * @property {string} [sourceReferences.source]
 * @property {string} [sourceReferences.sourceId]
 * @property {string} [userId]
 * @property {string} [workflowName]
 * @property {string} [environment]
 * @property {string} [serviceName]
 * @property {string} [version]
 * @property {string} [requestId]
 * @property {string} [sessionId]
 * @property {string} [ipAddress]
 * @property {string} [userAgent]
 * @property {number} [duration]
 * @property {number} [memoryUsage]
 * @property {number} [cpuUsage]
 * @property {string} [severity]
 * @property {boolean} [isAuthenticated]
 * @property {object} [permissions]
 * @property {boolean} [permissions.canRead]
 * @property {boolean} [permissions.canWrite]
 * @property {boolean} [permissions.canDelete]
 * @property {boolean} [permissions.canUpdate]
 * @property {string} [modelName]
 * @property {object} [tokenUsage]
 * @property {number} [tokenUsage.inputTokens]
 * @property {number} [tokenUsage.outputTokens]
 * @property {number} [temperature]
 * @property {number} [maxTokens]
 * @property {string} [clientId]
 * @property {string} [pageUrl]
 * @property {string} [componentName]
 * @property {string} [errorCode]
 * @property {string} [errorCategory]
 * @property {number} [retryCount]
 */
export interface Log {
    id?: string;
    createdAt?: string;
    updatedAt?: string;
    eventMessage?: string;
    eventType?: string;
    errorMessage?: string;
    errorStackTrace?: string;
    message?: string;
    metrics?: {
        cpuUsage?: number;
        memoryUsage?: number;
        responseTime?: number;
        requestSize?: number;
        responseSize?: number;
    };
    nodeName?: string;
    payload?: {
        data?: string;
        metadata?: string;
    };
    queryId?: string;
    sourceReferences?: {
        source?: string;
        sourceId?: string;
    };
    userId?: string;
    workflowName?: string;
    environment?: string;
    serviceName?: string;
    version?: string;
    requestId?: string;
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
    duration?: number;
    memoryUsage?: number;
    cpuUsage?: number;
    severity?: string;
    isAuthenticated?: boolean;
    permissions?: {
        canRead?: boolean;
        canWrite?: boolean;
        canDelete?: boolean;
        canUpdate?: boolean;
    };
    modelName?: string;
    tokenUsage?: {
        inputTokens?: number;
        outputTokens?: number;
    };
    temperature?: number;
    maxTokens?: number;
    clientId?: string;
    pageUrl?: string;
    componentName?: string;
    errorCode?: string;
    errorCategory?: string;
    retryCount?: number;
}
