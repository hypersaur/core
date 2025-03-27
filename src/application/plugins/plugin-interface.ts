/**
 * Plugin system interfaces
 */

import { MiddlewareFunction } from '../../infrastructure/http/middleware.ts';

/**
 * Hook function type
 */
export type HookFunction = (...args: any[]) => any;

/**
 * Plugin interface
 */
export interface Plugin {
  name: string;
  version?: string;
  initialize?: (app: any) => void;
  hooks?: Record<string, HookFunction>;
  middlewares?: MiddlewareFunction[];
}

/**
 * Available hook types
 */
export enum HookType {
  BEFORE_RESOURCE_CREATE = 'beforeResourceCreate',
  AFTER_RESOURCE_CREATE = 'afterResourceCreate',
  BEFORE_ROUTE_HANDLE = 'beforeRouteHandle',
  AFTER_ROUTE_HANDLE = 'afterRouteHandle',
  BEFORE_ERROR_HANDLE = 'beforeErrorHandle',
  AFTER_ERROR_HANDLE = 'afterErrorHandle',
  BEFORE_RESPONSE_SEND = 'beforeResponseSend'
} 