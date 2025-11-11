import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users, User, NewUser } from '../db/schema';
import { errorHandler, httpErrorCodes } from '../utils/error';

export const createUser = async (userData: NewUser): Promise<User> => {
  try {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  } catch (err: any) {
    throw errorHandler(httpErrorCodes.INTERNAL_SERVER, err.message);
  }
};

export const getUserByEmail = async (email: string): Promise<User | undefined> => {
  try {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  } catch (err: any) {
    throw errorHandler(httpErrorCodes.INTERNAL_SERVER, err.message);
  }
};

export const getUserById = async (id: number): Promise<User | undefined> => {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  } catch (err: any) {
    throw errorHandler(httpErrorCodes.INTERNAL_SERVER, err.message);
  }
};

export const updateUser = async (
  email: string,
  updates: Partial<NewUser>
): Promise<User> => {
  try {
    const [updatedUser] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.email, email))
      .returning();
    return updatedUser;
  } catch (err: any) {
    throw errorHandler(httpErrorCodes.INTERNAL_SERVER, err.message);
  }
};
