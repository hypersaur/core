/**
 * Middleware function type
 */
import { RequestContext } from './request.ts';

export type MiddlewareFunction = (
  request: Request, 
  context: RequestContext,
  next: () => Promise<Response>
) => Promise<Response>; 