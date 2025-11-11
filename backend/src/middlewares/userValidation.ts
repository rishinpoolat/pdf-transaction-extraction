import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { getUserByEmail } from '../services/user.services';
import { httpErrorCodes, errorHandler } from '../utils/error';

export const validateSignup = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;
    const user = await getUserByEmail(email);

    if (user) {
      return next(
        errorHandler(
          httpErrorCodes.VALIDATION,
          'Email is already in use'
        )
      );
    }

    next();
  } catch (err: any) {
    next(errorHandler(httpErrorCodes.INTERNAL_SERVER, err.message));
  }
};

export const validateLogin = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;
    const user = await getUserByEmail(email);

    if (!user) {
      return next(
        errorHandler(httpErrorCodes.UNAUTHORIZED, 'Invalid credentials')
      );
    }

    if (!user.password) {
      return next(
        errorHandler(
          httpErrorCodes.UNAUTHORIZED,
          'Please reset your password'
        )
      );
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return next(
        errorHandler(httpErrorCodes.UNAUTHORIZED, 'Invalid credentials')
      );
    }

    next();
  } catch (err: any) {
    next(errorHandler(httpErrorCodes.INTERNAL_SERVER, err.message));
  }
};
