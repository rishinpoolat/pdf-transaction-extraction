import jwt from 'jsonwebtoken';
import { errorMessages } from './constants';
import { errorHandler, httpErrorCodes } from './error';

const secret = process.env.SECRET!;

interface TokenPayload {
  email: string;
  userId?: number;
}

export function getToken(payload: TokenPayload, expiresIn: string): string {
  try {
    const token = jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
    return token;
  } catch (err) {
    throw errorHandler(
      httpErrorCodes.BAD_REQUEST,
      errorMessages.TOKEN_SIGN_FAILED
    );
  }
}

export function verifyToken(token: string): TokenPayload {
  try {
    const decodedToken = jwt.verify(token, secret) as TokenPayload;
    return decodedToken;
  } catch (error) {
    throw errorHandler(
      httpErrorCodes.BAD_REQUEST,
      errorMessages.TOKEN_VERIFY_FAILED
    );
  }
}
