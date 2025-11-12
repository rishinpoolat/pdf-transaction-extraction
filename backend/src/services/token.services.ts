import { eq } from 'drizzle-orm';
import { db } from '../db';
import { blacklist, NewBlacklistToken } from '../db/schema';
import { errorHandler, httpErrorCodes } from '../utils/error';
import { errorMessages } from '../utils/constants';
import { getToken } from '../utils/jwt';

// User type for hardcoded admin
interface User {
  id: number;
  email: string;
  name: string;
}

export const findToken = async (token: string): Promise<void> => {
  try {
    const [blacklistedToken] = await db
      .select()
      .from(blacklist)
      .where(eq(blacklist.token, token));

    if (blacklistedToken) {
      throw errorHandler(
        httpErrorCodes.UNAUTHORIZED,
        errorMessages.BLACKLIST_TOKEN
      );
    }
  } catch (err: any) {
    throw errorHandler(err.statusCode || httpErrorCodes.INTERNAL_SERVER, err.message);
  }
};

export const blacklistToken = async (tokenData: NewBlacklistToken): Promise<void> => {
  try {
    await db.insert(blacklist).values(tokenData);
  } catch (err: any) {
    throw errorHandler(httpErrorCodes.BAD_REQUEST, err.message);
  }
};

export const getTokens = async (user: User): Promise<{ accessToken: string; refreshToken: string }> => {
  const payload = { email: user.email, userId: user.id };
  const accessToken = getToken(payload, process.env.ACCESS_TOKEN_EXPIRY || '15m');
  const refreshToken = getToken(payload, process.env.REFRESH_TOKEN_EXPIRY || '7d');
  return { accessToken, refreshToken };
};
