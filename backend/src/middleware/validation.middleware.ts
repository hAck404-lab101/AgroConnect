import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { createError } from './error.middleware';

export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(createError(errors.array()[0].msg, 400));
  }
  next();
};
