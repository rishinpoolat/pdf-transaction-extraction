import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { errorHandler, httpErrorCodes } from '../utils/error';

export const bodyValidation = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (err: any) {
      // Zod validation errors
      const errors = err.issues?.map((issue: any) => ({
        field: issue.path.join('.') || 'body',
        message: issue.message,
      })) || [];

      // Pass error to global error handler with detailed validation errors
      next(
        errorHandler(
          httpErrorCodes.VALIDATION,
          'Validation failed',
          errors
        )
      );
    }
  };
};
