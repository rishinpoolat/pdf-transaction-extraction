import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { errorHandler, httpErrorCodes } from '../utils/error';
import { errorMessages } from '../utils/constants';

export const tokenValidation = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.params.token || req.body.token;

    if (!token) {
      return next(
        errorHandler(
          httpErrorCodes.UNAUTHORIZED,
          errorMessages.TOKEN_NOT_FOUND
        )
      );
    }

    try {
      const decodedToken = verifyToken(token);
      req.user = decodedToken as any;
      next();
    } catch (err) {
      return next(
        errorHandler(
          httpErrorCodes.UNAUTHORIZED,
          errorMessages.INVALID_TOKEN
        )
      );
    }
  } catch (err) {
    return next(
      errorHandler(
        httpErrorCodes.INTERNAL_SERVER,
        errorMessages.SOMETHING_WENT_WRONG
      )
    );
  }
};
