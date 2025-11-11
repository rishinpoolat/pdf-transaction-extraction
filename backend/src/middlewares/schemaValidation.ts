import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { errorHandler, httpErrorCodes } from '../utils/error';

export const bodyValidation = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (err: any) {
      const errors = err.errors?.map((e: any) => ({
        path: e.path.join('.'),
        message: e.message,
      }));
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
