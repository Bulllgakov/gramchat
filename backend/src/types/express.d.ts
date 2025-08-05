import { User, Shop } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: User & {
        shop?: Shop;
      };
      shop?: Shop;
    }
  }
}