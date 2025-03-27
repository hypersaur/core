/**
 * Request context interface for middleware
 */

/**
 * State interface for request context
 */
export interface RequestState {
  user?: { id: string; role: string };
  isAdmin?: boolean;
  requestTime?: string;
  neverReached?: boolean;
  recovered?: boolean;
  errorMessage?: string;
  pluginMiddleware?: boolean;
  language?: string;
  throttleStart?: number;
  [key: string]: unknown;
}

/**
 * Request context interface for middleware
 */
export interface RequestContext {
  params: Record<string, string>;
  state: RequestState;
  route?: {
    path: string;
    method: string;
  };
} 