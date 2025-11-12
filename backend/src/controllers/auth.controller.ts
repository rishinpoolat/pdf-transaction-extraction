import { Request, Response, NextFunction } from 'express';
import { httpErrorCodes, errorHandler } from '../utils/error';
import { getToken, verifyToken } from '../utils/jwt';
import { blacklistToken, findToken } from '../services/token.services';

// Hardcoded credentials
const HARDCODED_USER = {
  email: 'admin',
  password: 'admin123',
  name: 'Administrator',
  id: 1,
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Check hardcoded credentials
    if (email !== HARDCODED_USER.email || password !== HARDCODED_USER.password) {
      return next(
        errorHandler(
          httpErrorCodes.UNAUTHORIZED,
          'Invalid credentials'
        )
      );
    }

    // Generate tokens
    const accessToken = getToken(
      { email: HARDCODED_USER.email, userId: HARDCODED_USER.id },
      process.env.ACCESS_TOKEN_EXPIRY || '15m'
    );

    const refreshToken = getToken(
      { email: HARDCODED_USER.email, userId: HARDCODED_USER.id },
      process.env.REFRESH_TOKEN_EXPIRY || '7d'
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: HARDCODED_USER.id,
          email: HARDCODED_USER.email,
          name: HARDCODED_USER.name,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (err: any) {
    next(errorHandler(httpErrorCodes.INTERNAL_SERVER, err.message));
  }
};

export const refreshAccessToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return next(
        errorHandler(
          httpErrorCodes.UNAUTHORIZED,
          'Refresh token not provided'
        )
      );
    }

    // Verify refresh token
    const decoded = verifyToken(refreshToken);

    if (!decoded || !decoded.email) {
      return next(
        errorHandler(
          httpErrorCodes.UNAUTHORIZED,
          'Invalid refresh token'
        )
      );
    }

    // Generate new access token
    const newAccessToken = getToken(
      { email: decoded.email, userId: decoded.userId },
      process.env.ACCESS_TOKEN_EXPIRY || '15m'
    );

    res.status(200).json({
      success: true,
      message: 'Access token refreshed successfully',
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (error: any) {
    next(errorHandler(httpErrorCodes.UNAUTHORIZED, 'Invalid or expired refresh token'));
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
    success: true,
    message: 'User details fetched successfully',
    data: {
      user: {
        id: HARDCODED_USER.id,
        name: HARDCODED_USER.name,
        email: HARDCODED_USER.email,
      },
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
      success: true,
      message: 'Logout successful',
      data: {},
    });
  } catch (error: any) {
    return next(error);
  }
};
