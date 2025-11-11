export const httpErrorCodes = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  VALIDATION: 422,
  INTERNAL_SERVER: 500,
} as const;

export interface CustomError extends Error {
  statusCode: number;
  errorDetails?: any;
}

export const errorHandler = (
  statusCode: number,
  message: string,
  errors?: any
): CustomError => {
  const error = new Error(message) as CustomError;
  error.statusCode = statusCode;
  error.message = message;
  error.errorDetails = errors;
  return error;
};
