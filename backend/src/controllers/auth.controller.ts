import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { httpErrorCodes, errorHandler } from '../utils/error';
import {
  createUser,
  getUserByEmail,
  updateUser,
} from '../services/user.services';
import { getToken } from '../utils/jwt';
import {
  blacklistToken,
  findToken,
  getTokens,
} from '../services/token.services';
import {
  errorMessages,
  successMessages,
} from '../utils/constants';
import {
  sendEmail,
  otpEmailTemplate,
  resetPasswordEmailTemplate,
} from '../utils/email';
import {
  generateOTP,
  generateToken,
  verifyOtp,
} from '../services/otp.services';

export const signupUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, name, password } = req.body;
    const user = await getUserByEmail(email);

    if (!user) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await createUser({
        email,
        name,
        password: hashedPassword,
      });

      // Generate OTP
      const secret = generateOTP();
      const otp = generateToken(secret);

      // Send OTP email
      await sendEmail({
        email,
        subject: 'Verify Your Email - OTP',
        message: otpEmailTemplate(otp),
      });

      // Save OTP secret to user
      await updateUser(email, { otp: secret });

      res.status(200).json({
        message: successMessages.OTP_SENT,
        data: { message: 'OTP sent successfully to your email' },
      });
    }
  } catch (err: any) {
    next(errorHandler(httpErrorCodes.INTERNAL_SERVER, err.message));
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;
    const user = await getUserByEmail(email);

    if (!user) {
      return next(
        errorHandler(
          httpErrorCodes.UNAUTHORIZED,
          'Invalid credentials'
        )
      );
    }

    if (user.isVerified === false) {
      return next(
        errorHandler(
          httpErrorCodes.UNAUTHORIZED,
          errorMessages.NOT_VERIFIED
        )
      );
    }

    const { accessToken, refreshToken } = await getTokens(user);

    res.status(200).json({
      message: successMessages.SIGN_IN,
      data: {
        accessToken,
        refreshToken,
      },
    });
  } catch (err: any) {
    next(errorHandler(httpErrorCodes.INTERNAL_SERVER, err.message));
  }
};

export const verifyMfa = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { otp, email } = req.body;
    const user = await getUserByEmail(email);

    if (!user) {
      return next(
        errorHandler(
          httpErrorCodes.NOT_FOUND,
          errorMessages.USER_NOT_FOUND
        )
      );
    }

    if (!user.otp) {
      return next(
        errorHandler(httpErrorCodes.UNAUTHORIZED, 'No OTP found for this user')
      );
    }

    const secret = user.otp;
    const isValid = verifyOtp(secret, otp);

    if (!isValid) {
      return next(
        errorHandler(httpErrorCodes.UNAUTHORIZED, 'Invalid or expired OTP')
      );
    }

    // Mark user as verified and clear OTP
    await updateUser(email, { isVerified: true, otp: null });

    const { accessToken, refreshToken } = await getTokens(user);

    res.status(200).json({
      message: successMessages.OTP_VERIFIED,
      data: {
        accessToken,
        refreshToken,
      },
    });
  } catch (err: any) {
    next(errorHandler(httpErrorCodes.INTERNAL_SERVER, err.message));
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;
    const user = await getUserByEmail(email);

    if (!user) {
      return next(
        errorHandler(httpErrorCodes.NOT_FOUND, 'User not found')
      );
    }

    const token = getToken(
      { email: user.email },
      process.env.RESET_TOKEN_EXPIRY || '1h'
    );

    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;

    await sendEmail({
      email,
      subject: 'Reset Your Password',
      message: resetPasswordEmailTemplate(resetLink, user.name),
    });

    res.status(200).json({
      message: successMessages.RESET_LINK_SENT,
      data: { message: `Password reset link sent to ${email}` },
    });
  } catch (err: any) {
    next(errorHandler(httpErrorCodes.INTERNAL_SERVER, err.message));
  }
};

export const getResetPassword = async (
  _req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  res.status(200).json({
    message: 'Valid token',
    data: {},
  });
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { password } = req.body;
    const user = req.user;

    if (!user?.email) {
      return next(
        errorHandler(httpErrorCodes.UNAUTHORIZED, 'Invalid user')
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await updateUser(user.email, { password: hashedPassword });

    res.status(200).json({
      message: successMessages.PASSWORD_RESET,
      data: {},
    });
  } catch (err: any) {
    next(errorHandler(httpErrorCodes.INTERNAL_SERVER, err.message));
  }
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
          errorMessages.TOKEN_NOT_FOUND
        )
      );
    }

    const blackListed = await findToken(token).catch(() => null);

    if (!blackListed) {
      await blacklistToken({ token });
    }

    res.status(200).json({
      message: successMessages.LOG_OUT,
      data: {},
    });
  } catch (error: any) {
    return next(error);
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
        errorMessages.USER_NOT_FOUND
      )
    );
  }

  res.status(200).json({
    message: 'User details fetched successfully',
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      isVerified: user.isVerified,
    },
  });
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

    const user = req.user;

    if (!user) {
      return next(
        errorHandler(
          httpErrorCodes.UNAUTHORIZED,
          errorMessages.USER_NOT_FOUND
        )
      );
    }

    const tokens = await getTokens(user);

    res.status(200).json({
      message: 'Access token refreshed successfully',
      data: {
        accessToken: tokens.accessToken,
      },
    });
  } catch (error: any) {
    return next(error);
  }
};
