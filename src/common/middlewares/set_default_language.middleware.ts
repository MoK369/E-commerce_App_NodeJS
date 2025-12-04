import type { NextFunction, Request, Response } from 'express';

const setDefaultLanguageMiddlware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.log('Default Language Middlware ....');
  req.headers['accept-language'] = req.headers['accept-language'] ?? 'EN';
  return next();
};

export default setDefaultLanguageMiddlware;
