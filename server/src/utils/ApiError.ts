import { Date } from "mongoose";

interface IApiError {
    statusCode: number;
    message: string;
    errors: any[]; // Adjust the type according to the expected errors array structure
    data: any | null; // Adjust the type according to the expected data structure
    success: boolean;
}

class ApiError extends Error {
    // fix
    statusCode: number;
    data: any | null;
    message: string;
    success: boolean;
    errors: any[];

    constructor(
        statusCode: number,
        message = "Something went wrong",
        errors: any[] = [],
        stack = "",
    ) {
        super(message);
        this.statusCode = statusCode;
        this.data = null;
        this.message = message;
        this.success = false;
        this.errors = errors;

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export { ApiError, IApiError };