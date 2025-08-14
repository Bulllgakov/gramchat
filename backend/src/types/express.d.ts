import { User, Bot } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: User & {
        bot?: Bot;
      };
      bot?: Bot;
      bots?: Bot[];
    }
  }
}