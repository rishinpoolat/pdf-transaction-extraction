import { Request, Response, NextFunction } from 'express';
import { httpErrorCodes, errorHandler } from '../utils/error';
import { getToken } from '../utils/jwt';
import { blacklistToken, findToken } from '../services/token.services';

// Hardcoded credentials
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { username, password } = req.body;

    // Check hardcoded credentials
    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      return next(
        errorHandler(
          httpErrorCodes.UNAUTHORIZED,
          'Invalid credentials'
        )
      );
    }

    // Generate tokens
    const accessToken = getToken(
      { email: 'admin@example.com', userId: 1 },
      process.env.ACCESS_TOKEN_EXPIRY || '15m'
    );

    const refreshToken = getToken(
      { email: 'admin@example.com', userId: 1 },
      process.env.REFRESH_TOKEN_EXPIRY || '7d'
    );

    res.status(200).json({
      message: 'Login successful',
      data: {
        accessToken,
        refreshToken,
      },
    });
  } catch (err: any) {
    next(errorHandler(httpErrorCodes.INTERNAL_SERVER, err.message));
  }
};

export const userDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const user = req.user;

  if (!user) {
    return next(
      errorHandler(
        httpErrorCodes.UNAUTHORIZED,
        'User not found'
      )
    );
  }

  res.status(200).json({
    message: 'User details fetched successfully',
    data: {
      id: 1,
      name: 'Admin',
      email: 'admin@example.com',
    },
  });
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.token;

    if (!token) {
      return next(
        errorHandler(
          httpErrorCodes.UNAUTHORIZED,
          'Token not found'
        )
      );
    }

    const blackListed = await findToken(token).catch(() => null);

    if (!blackListed) {
      await blacklistToken({ token });
    }

    res.status(200).json({
      message: 'Logout successful',
      data: {},
    });
  } catch (error: any) {
    return next(error);
  }
};
