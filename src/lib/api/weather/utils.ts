import { NextResponse } from "next/server";

/**
 * Standard API response types
 */
export type ApiErrorResponse = {
    error: string;
    details?: unknown;
    code?: string;
};

export type ApiSuccessResponse<T> = {
    success: boolean;
    data: T;
    message?: string;
};

/**
 * Creates a standardized success response
 * @param data Response data
 * @param status HTTP status code (defaults to 200)
 * @param message Optional success message
 * @returns NextResponse with the data wrapped in a standard format
 */
export function createSuccessResponse<T>(
    data: T,
    status: number = 200,
    message: string = 'Success'
): NextResponse<ApiSuccessResponse<T>> {
    const response: ApiSuccessResponse<T> = {
        success: true,
        data,
        message
    };

    return NextResponse.json(response, { status });
}

/**
 * Creates a standardized error response
 * @param message Error message
 * @param status HTTP status code
 * @param details Optional additional error details
 * @param code Optional error code for client-side error handling
 * @returns NextResponse with standardized error format
 */
export function createErrorResponse(
    message: string,
    status: number,
    details?: unknown,
    code?: string
): NextResponse<ApiErrorResponse> {
    const response: ApiErrorResponse = {
        error: message,
    };

    if (details) {
        response.details = details;
    }

    if (code) {
        response.code = code;
    }

    return NextResponse.json(response, { status });
}

/**
 * Common error responses
 */
export const ApiErrors = {
    /**
     * 401 Unauthorized - Authentication required
     */
    unauthorized: (message: string = "Unauthorized: Authentication required") =>
        NextResponse.json({
            success: false,
            message: message || 'Unauthorized'
        }, { status: 401 }),

    /**
     * 403 Forbidden - Insufficient permissions
     */
    forbidden: (message: string = "Forbidden: Insufficient permissions") =>
        createErrorResponse(message, 403),

    /**
     * 404 Not Found - Resource not found
     */
    notFound: (message: string = "Not found") =>
        NextResponse.json({
            success: false,
            message
        }, { status: 404 }),

    /**
     * 400 Bad Request - Validation failed
     */
    validationFailed: (message: string = "Validation failed") =>
        createErrorResponse(message, 400),

    /**
     * 400 Bad Request - Generic bad request
     */
    badRequest: (message: string = "Bad request") =>
        NextResponse.json({
            success: false,
            message
        }, { status: 400 }),

    /**
     * 500 Internal Server Error - Unexpected error
     */
    serverError: (message: string = "Internal server error") =>
        NextResponse.json({
            success: false,
            message
        }, { status: 500 }),

    /**
     * 409 Conflict - Resource conflict
     */
    conflict: (message: string = "Resource conflict", code?: string) =>
        createErrorResponse(message, 409, undefined, code),

    /**
     * 429 Too Many Requests - Rate limit exceeded
     */
    tooManyRequests: (message: string = "Rate limit exceeded", code?: string) =>
        createErrorResponse(message, 429, undefined, code),

    /**
     * 422 Unprocessable Entity - Request could not be processed
     */
    unprocessableEntity: (message: string = "Request could not be processed", details?: unknown, code?: string) =>
        createErrorResponse(message, 422, details, code),

    /**
     * 405 Method Not Allowed - HTTP method not allowed
     */
    methodNotAllowed: (message: string = "Method not allowed", code?: string) =>
        createErrorResponse(message, 405, undefined, code),

    /**
     * Custom error - Create a custom error response
     */
    custom: (message: string, status: number, details?: unknown, code?: string) =>
        createErrorResponse(message, status, details, code),
};