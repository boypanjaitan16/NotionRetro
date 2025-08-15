import { Request, Response, NextFunction } from 'express';

// Middleware to handle method override for forms
export function methodOverride(req: Request, _res: Response, next: NextFunction) {
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    const method = req.body._method;
    delete req.body._method;
    req.method = method.toUpperCase();
  }
  
  // Also check query parameters
  if (req.query && typeof req.query === 'object' && '_method' in req.query) {
    const method = req.query['_method'] as string;
    delete req.query['_method'];
    req.method = method.toUpperCase();
  }
  
  next();
}
