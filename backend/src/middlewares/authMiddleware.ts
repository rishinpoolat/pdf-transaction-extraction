import { Request, Response, NextFunction } from 'express';
import { findToken } from '../services/token.services';
import { errorHandler, httpErrorCodes } from '../utils/error';
import { verifyToken } from '../utils/jwt';
import { errorMessages } from '../utils/constants';

// User type for hardcoded admin
interface User {
  id: number;
  email: string;
  name: string;
}

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
    // Try to get token from Authorization header first
    const authToken = req.get('Authorization');
    let token = authToken?.split('Bearer ')[1];

    // For SSE connections, EventSource can't send custom headers,
    // so we also check query parameters
    if (!token && req.query.token) {
      token = req.query.token as string;
    }

    if (!token) {
      return next(
        errorHandler(
          httpErrorCodes.UNAUTHORIZED,
          errorMessages.TOKEN_NOT_FOUND
        )
      );
    }

    // Check if token is blacklisted
    const blacklisted = await findToken(token).catch(() => null);

    if (blacklisted) {
      return next(
        errorHandler(
          httpErrorCodes.UNAUTHORIZED,
          errorMessages.BLACKLIST_TOKEN
        )
      );
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

    // Create user object from decoded token (hardcoded admin)
    const user: User = {
      id: decodedToken.userId || 1,
      email: decodedToken.email || 'admin',
      name: 'Administrator',
    };

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
