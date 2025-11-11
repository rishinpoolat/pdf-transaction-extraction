import { Request, Response, NextFunction } from 'express';
import { findToken } from '../services/token.services';
import { getUserByEmail } from '../services/user.services';
import { errorHandler, httpErrorCodes } from '../utils/error';
import { verifyToken } from '../utils/jwt';
import { errorMessages } from '../utils/constants';
import { User } from '../db/schema';

// Extend Express Request type to include user and token
declare global {
  namespace Express {
    interface Request {
      user?: User;
      token?: string;
    }
  }
}

export const isAuthenticated = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authToken = req.get('Authorization');
    const token = authToken?.split('Bearer ')[1];

    if (!token) {
      return next(
        errorHandler(
          httpErrorCodes.UNAUTHORIZED,
          errorMessages.TOKEN_NOT_FOUND
        )
      );
    }

    // Check if token is blacklisted
    try {
      await findToken(token);
    } catch (error) {
      return next(error);
    }

    // Verify token
    let decodedToken;
    try {
      decodedToken = verifyToken(token);
    } catch (err) {
      return next(
        errorHandler(
          httpErrorCodes.UNAUTHORIZED,
          errorMessages.INVALID_TOKEN
        )
      );
    }

    // Get user from database
    const user = await getUserByEmail(decodedToken.email);
    if (!user) {
      return next(
        errorHandler(
          httpErrorCodes.UNAUTHORIZED,
          errorMessages.USER_NOT_FOUND
        )
      );
    }

    // Attach user and token to request
    req.token = token;
    req.user = user;

    next();
  } catch (err) {
    return next(
      errorHandler(
        httpErrorCodes.INTERNAL_SERVER,
        errorMessages.SOMETHING_WENT_WRONG
      )
    );
  }
};
