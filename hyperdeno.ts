/**
 * HyperDeno - A HATEOAS Framework for Deno
 * 
 * This consolidated library implements a HATEOAS (Hypermedia as the Engine of Application State)
 * framework for building hypermedia-driven APIs using Deno. It provides a clean API for creating
 * resources with hypermedia controls, proper state transitions, and RESTful routing.
 * 
 * @license MIT
 */

//#region Error Handling

/**
 * Error details interface
 */
export interface ErrorDetails {
  [key: string]: unknown;
}

/**
 * Standardized error response interface
 */
export interface ErrorResponse {
  error: {
    message: string;
    status: number;
    code: string;
    details?: ErrorDetails;
  };
}

/**
 * Base API error class
 */
export class ApiError extends Error {
  status: number;
  code: string;
  details: ErrorDetails | null;

  constructor(message: string, status: number = 500, code: string = 'INTERNAL_ERROR', details: ErrorDetails | null = null) {
    super(message);
    
    this.name = this.constructor.name;
    this.status = status;
    this.code = code;
    this.details = details;
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  toJSON(): ErrorResponse {
    return {
      error: {
        message: this.message,
        status: this.status,
        code: this.code,
        ...(this.details ? { details: this.details } : {})
      }
    };
  }
}

/**
 * Error for resource not found (404)
 */
export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found', code: string = 'NOT_FOUND', details: ErrorDetails | null = null) {
    super(message, 404, code, details);
  }
}

/**
 * Error for validation and invalid input (400)
 */
export class ValidationError extends ApiError {
  constructor(message: string = 'Validation failed', code: string = 'VALIDATION_ERROR', details: ErrorDetails | null = null) {
    super(message, 400, code, details);
  }
}

/**
 * Error for authentication and authorization (401)
 */
export class AuthError extends ApiError {
  constructor(message: string = 'Authentication failed', code: string = 'AUTH_ERROR', details: ErrorDetails | null = null) {
    super(message, 401, code, details);
  }
}

/**
 * Error for server and internal issues (500)
 */
export class ServerError extends ApiError {
  constructor(message: string = 'Internal server error', code: string = 'SERVER_ERROR', details: ErrorDetails | null = null) {
    super(message, 500, code, details);
  }
}

/**
 * Error for invalid state transitions
 */
export class StateTransitionError extends ValidationError {
  constructor(message: string = 'Invalid state transition', details: ErrorDetails | null = null) {
    super(message, 'STATE_TRANSITION_ERROR', details);
  }
}

/**
 * Error for invalid arguments
 */
export class InvalidArgumentError extends ValidationError {
  constructor(message: string = 'Invalid argument', details: ErrorDetails | null = null) {
    super(message, 'INVALID_ARGUMENT', details);
  }
}

/**
 * Error for content negotiation
 */
export class ContentNegotiationError extends ApiError {
  constructor(message: string = 'Content negotiation failed', code: string = 'CONTENT_NEGOTIATION_FAILED', details: ErrorDetails | null = null) {
    super(message, 406, code, details);
  }
}

/**
 * Create a Response from an Error
 */
export function createErrorResponse(error: Error): Response {
  const status = error instanceof ApiError ? error.status : 500;
  const body = error instanceof ApiError 
    ? error.toJSON() 
    : new ServerError(error.message).toJSON();
  
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

/**
 * Standard error responses for common scenarios
 */
export const Errors = {
  notFound: (message?: string, details?: ErrorDetails): ErrorResponse => 
    new NotFoundError(message, 'RESOURCE_NOT_FOUND', details || null).toJSON(),
  
  badRequest: (message?: string, details?: ErrorDetails): ErrorResponse =>
    new ValidationError(message, 'BAD_REQUEST', details || null).toJSON(),
  
  unauthorized: (message?: string, details?: ErrorDetails): ErrorResponse =>
    new AuthError(message, 'UNAUTHORIZED', details || null).toJSON(),
  
  forbidden: (message?: string, details?: ErrorDetails): ErrorResponse =>
    new AuthError(message, 'FORBIDDEN', details || null).toJSON(),
  
  conflict: (message?: string, details?: ErrorDetails): ErrorResponse =>
    new ServerError(message, 'CONFLICT', details || null).toJSON(),
  
  internalServerError: (message?: string, details?: ErrorDetails): ErrorResponse =>
    new ServerError(message || 'Internal server error', 'INTERNAL_SERVER_ERROR', details || null).toJSON()
};

//#endregion

//#region Middleware System

/**
 * Request context interface for middleware
 */
export interface RequestContext {
  params: Record<string, string>;
  state: Record<string, unknown>;
  route?: {
    path: string;
    method: string;
  };
}

/**
 * Middleware function type
 */
export type MiddlewareFunction = (
  request: Request, 
  context: RequestContext,
  next: () => Promise<Response>
) => Promise<Response>;

/**
 * Middleware chain class
 */
export class MiddlewareChain {
  private middlewares: MiddlewareFunction[] = [];
  
  /**
   * Add middleware to the chain
   */
  use(middleware: MiddlewareFunction): MiddlewareChain {
    this.middlewares.push(middleware);
    return this;
  }
  
  /**
   * Execute middleware chain
   */
  async execute(request: Request, context: RequestContext, finalHandler: () => Promise<Response>): Promise<Response> {
    let index = 0;
    
    const next = async (): Promise<Response> => {
      if (index >= this.middlewares.length) {
        return await finalHandler();
      }
      
      const middleware = this.middlewares[index++];
      return await middleware(request, context, next);
    };
    
    return await next();
  }
}

//#endregion

//#region Plugin System

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
 * Hook function type
 */
export type HookFunction = (...args: any[]) => any;

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

/**
 * Plugin manager class
 */
export class PluginManager {
  private plugins: Plugin[] = [];
  
  /**
   * Register a plugin
   */
  registerPlugin(plugin: Plugin): PluginManager {
    // Validate plugin
    if (!plugin.name) {
      throw new InvalidArgumentError('Plugin must have a name');
    }
    
    // Check for duplicates
    if (this.plugins.some(p => p.name === plugin.name)) {
      throw new InvalidArgumentError(`Plugin "${plugin.name}" is already registered`);
    }
    
    this.plugins.push(plugin);
    return this;
  }
  
  /**
   * Get all registered plugins
   */
  getPlugins(): Plugin[] {
    return [...this.plugins];
  }
  
  /**
   * Execute a hook
   */
  executeHook(hookName: string, ...args: any[]): any[] {
    return this.plugins
      .filter(plugin => plugin.hooks && hookName in plugin.hooks)
      .map(plugin => plugin.hooks![hookName](...args));
  }
  
  /**
   * Get all middleware from plugins
   */
  getMiddlewares(): MiddlewareFunction[] {
    return this.plugins
      .filter(plugin => plugin.middlewares && plugin.middlewares.length > 0)
      .flatMap(plugin => plugin.middlewares!);
  }
  
  /**
   * Initialize all plugins
   */
  initializePlugins(app: any): void {
    for (const plugin of this.plugins) {
      if (plugin.initialize) {
        plugin.initialize(app);
      }
    }
  }
}

//#endregion

//#region HAL-Forms Support

/**
 * HAL-Forms property options interface
 */
export interface HalFormPropertyOptions {
  inline?: Array<{ value: string; prompt: string }>;
  link?: {
    href: string;
    type?: string;
  };
}

/**
 * HAL-Forms property definition interface
 */
export interface HalFormProperty {
  name: string;
  type?: 'text' | 'number' | 'date' | 'datetime' | 'file' | 'hidden' | 'bool';
  required?: boolean;
  value?: unknown;
  prompt?: string;
  readOnly?: boolean;
  regex?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  options?: HalFormPropertyOptions;
  suggest?: boolean;
}

/**
 * HAL-Forms template definition interface
 */
export interface HalFormTemplate {
  method: string;
  target?: string;
  title?: string;
  contentType?: string;
  properties: HalFormProperty[];
}

/**
 * HAL-Forms Manager class
 */
export class HalFormsManager {
  private templates = new Map<string, HalFormTemplate>();
  
  /**
   * Add a template definition
   */
  addTemplate(key: string, template: HalFormTemplate): HalFormsManager {
    if (!key || typeof key !== 'string') {
      throw new InvalidArgumentError('Template key must be a non-empty string');
    }
    
    // Validate template
    if (!template.method) {
      throw new InvalidArgumentError('Template method is required');
    }
    
    if (!Array.isArray(template.properties)) {
      throw new InvalidArgumentError('Template properties must be an array');
    }
    
    this.templates.set(key, template);
    return this;
  }
  
  /**
   * Remove a template
   */
  removeTemplate(key: string): HalFormsManager {
    this.templates.delete(key);
    return this;
  }
  
  /**
   * Get a template by key
   */
  getTemplate(key: string): HalFormTemplate | undefined {
    return this.templates.get(key);
  }
  
  /**
   * Get all templates
   */
  getTemplates(): Record<string, HalFormTemplate> {
    return Object.fromEntries(this.templates.entries());
  }
  
  /**
   * Check if a template exists
   */
  hasTemplate(key: string): boolean {
    return this.templates.has(key);
  }
  
  /**
   * Clone the templates manager
   */
  clone(): HalFormsManager {
    const cloned = new HalFormsManager();
    
    this.templates.forEach((template, key) => {
      cloned.templates.set(key, JSON.parse(JSON.stringify(template)));
    });
    
    return cloned;
  }
}

//#endregion

//#region Link Management

/**
 * Link interface
 */
export interface Link {
  href: string;
  method?: string;
  rel: string;
  templated?: boolean;
  title?: string;
  type?: string;
  hreflang?: string;
  attrs?: Record<string, unknown>;
}

/**
 * Type for link that can be a single link or array
 */
export type LinkObject = Link | Link[];

/**
 * Options for links
 */
export interface LinkOptions {
  templated?: boolean;
  title?: string;
  type?: string;
  hreflang?: string;
  attrs?: Record<string, unknown>;
}

/**
 * Standard link relations
 */
export const STANDARD_RELS = {
  SELF: 'self',
  NEXT: 'next',
  PREV: 'prev',
  FIRST: 'first',
  LAST: 'last',
  COLLECTION: 'collection',
  ITEM: 'item',
  CREATE: 'create',
  EDIT: 'edit',
  DELETE: 'delete',
  UP: 'up',
} as const;

/**
 * Link Manager class
 */
export class LinkManager {
  private links = new Map<string, LinkObject>();
  
  constructor(initialLinks: Record<string, LinkObject> = {}) {
    if (initialLinks && typeof initialLinks === 'object') {
      Object.entries(initialLinks).forEach(([rel, link]) => {
        this.links.set(rel, link);
      });
    }
  }
  
  addLink(rel: string, href: string, method: string = 'GET', options: LinkOptions = {}): LinkManager {
    if (typeof rel !== 'string' || !rel) {
      throw new InvalidArgumentError('Link relation must be a non-empty string');
    }
    
    if (typeof href !== 'string' || !href) {
      throw new InvalidArgumentError('Link href must be a non-empty string');
    }
    
    const link: Link = {
      rel,
      href,
      method,
      ...options
    };
    
    const existing = this.links.get(rel);
    
    if (existing) {
      if (Array.isArray(existing)) {
        existing.push(link);
      } else {
        this.links.set(rel, [existing, link]);
      }
    } else {
      this.links.set(rel, link);
    }
    
    return this;
  }
  
  removeLink(rel: string): LinkManager {
    this.links.delete(rel);
    return this;
  }
  
  hasLink(rel: string): boolean {
    return this.links.has(rel);
  }
  
  getLink(rel: string): LinkObject | undefined {
    return this.links.get(rel);
  }
  
  getLinks(): Record<string, LinkObject> {
    return Object.fromEntries(this.links.entries());
  }
  
  setLinks(links: Record<string, LinkObject>): LinkManager {
    this.links.clear();
    
    Object.entries(links).forEach(([rel, link]) => {
      this.links.set(rel, link);
    });
    
    return this;
  }
  
  clearLinks(): LinkManager {
    this.links.clear();
    return this;
  }
  
  getLinkRelations(): string[] {
    return Array.from(this.links.keys());
  }
  
  setSelfLink(href: string, method: string = 'GET'): LinkManager {
    return this.addLink('self', href, method);
  }
  
  static createLinkBuilder(baseUrl: string): (path: string, rel: string, method?: string, options?: LinkOptions) => Link {
    return (path: string, rel: string, method: string = 'GET', options: LinkOptions = {}): Link => {
      const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
      const normalizedPath = path.startsWith('/') ? path : `/${path}`;
      const href = `${normalizedBase}${normalizedPath}`;
      
      return {
        rel,
        href,
        method,
        ...options
      };
    };
  }
  
  clone(): LinkManager {
    const clonedLinks: Record<string, LinkObject> = {};
    
    this.links.forEach((linkOrLinks, rel) => {
      if (Array.isArray(linkOrLinks)) {
        clonedLinks[rel] = linkOrLinks.map(link => ({ ...link }));
      } else {
        clonedLinks[rel] = { ...linkOrLinks };
      }
    });
    
    return new LinkManager(clonedLinks);
  }
}

//#endregion

//#region State Management

/**
 * State transition interface
 */
export interface StateTransition {
  from: string;
  to: string;
  name: string;
  href: string;
  method: string;
  conditions?: Record<string, unknown>;
}

/**
 * Resource State class
 */
export class ResourceState {
  private currentState = '';
  private transitions: StateTransition[] = [];
  
  constructor(initialState: string = '') {
    this.currentState = initialState;
  }
  
  setState(state: string): string {
    if (typeof state !== 'string') {
      throw new InvalidArgumentError('State must be a string');
    }
    
    this.currentState = state;
    return this.currentState;
  }
  
  getState(): string {
    return this.currentState;
  }
  
  addTransition(from: string, to: string, name: string, href: string, method: string = 'POST', conditions?: Record<string, unknown>): StateTransition {
    if (typeof from !== 'string' || !from) {
      throw new InvalidArgumentError('"from" state must be a non-empty string');
    }
    
    if (typeof to !== 'string' || !to) {
      throw new InvalidArgumentError('"to" state must be a non-empty string');
    }
    
    if (typeof name !== 'string' || !name) {
      throw new InvalidArgumentError('Transition name must be a non-empty string');
    }
    
    if (typeof href !== 'string' || !href) {
      throw new InvalidArgumentError('Transition href must be a non-empty string');
    }
    
    const transition: StateTransition = {
      from,
      to,
      name,
      href,
      method,
      conditions
    };
    
    this.transitions.push(transition);
    return transition;
  }
  
  getTransitions(): StateTransition[] {
    return [...this.transitions];
  }
  
  getAvailableTransitions(state: string, properties: Record<string, unknown> = {}): StateTransition[] {
    return this.transitions.filter(transition => {
      if (transition.from !== state) {
        return false;
      }
      
      if (transition.conditions) {
        return Object.entries(transition.conditions).every(([key, condition]) => {
          if (typeof condition === 'object' && condition !== null && 'exists' in condition) {
            const exists = (condition as { exists: boolean }).exists;
            return exists ? key in properties : !(key in properties);
          }
          return properties[key] === condition;
        });
      }
      
      return true;
    });
  }
  
  applyTransition(name: string, state: string, properties: Record<string, unknown> = {}): string {
    const availableTransitions = this.getAvailableTransitions(state, properties);
    const transition = availableTransitions.find(t => t.name === name);
    
    if (!transition) {
      throw new StateTransitionError(`No transition found with name '${name}'`);
    }
    
    return transition.to;
  }
  
  clone(): ResourceState {
    const clone = new ResourceState(this.currentState);
    
    this.transitions.forEach(transition => {
      clone.addTransition(
        transition.from,
        transition.to,
        transition.name,
        transition.href,
        transition.method,
        transition.conditions ? { ...transition.conditions } : undefined
      );
    });
    
    return clone;
  }
}

//#endregion

//#region Resource Implementation

/**
 * Resource options interface
 */
export interface ResourceOptions {
  type?: string;
  id?: string;
  properties?: Record<string, unknown>;
  initialState?: string;
}

/**
 * Resource class implementing HATEOAS principles
 */
export class Resource {
  private type = '';
  private id = '';
  private properties: Record<string, unknown> = {};
  private linkManager: LinkManager;
  private stateManager: ResourceState;
  private formsManager: HalFormsManager;
  private embedded: Record<string, Resource[]> = {};

  constructor(options: ResourceOptions = {}) {
    this.type = options.type || '';
    this.id = options.id || '';
    this.properties = options.properties || {};
    this.linkManager = new LinkManager();
    this.stateManager = new ResourceState(options.initialState || 'draft');
    this.formsManager = new HalFormsManager();
  }

  getType(): string {
    return this.type;
  }

  setType(type: string): Resource {
    this.type = type;
    return this;
  }

  getId(): string {
    return this.id;
  }

  setId(id: string): Resource {
    this.id = id;
    return this;
  }

  setProperty(key: string, value: unknown): Resource {
    if (!key || typeof key !== 'string') {
      throw new InvalidArgumentError('Property key must be a string');
    }

    // Handle nested properties
    if (key.includes('.')) {
      const parts = key.split('.');
      let current = this.properties;
      const lastPart = parts.pop()!;

      for (const part of parts) {
        if (!(part in current)) {
          current[part] = {};
        }
        if (typeof current[part] !== 'object') {
          current[part] = {};
        }
        current = current[part] as Record<string, unknown>;
      }
      
      current[lastPart] = value;
      return this;
    }

    this.properties[key] = value;
    return this;
  }

  getProperty(key: string): unknown {
    if (!key || typeof key !== 'string') {
      throw new InvalidArgumentError('Property key must be a non-empty string');
    }

    // Handle nested properties
    if (key.includes('.')) {
      const parts = key.split('.');
      let current = this.properties;

      for (const part of parts) {
        if (!(part in current) || typeof current[part] !== 'object') {
          return undefined;
        }
        current = current[part] as Record<string, unknown>;
      }

      return current;
    }

    return this.properties[key];
  }

  getProperties(): Record<string, unknown> {
    return { ...this.properties };
  }

  addLink(rel: string, href: string, method: string = 'GET', options: LinkOptions = {}): Resource {
    this.linkManager.addLink(rel, href, method, options);
    return this;
  }

  addTemplatedLink(rel: string, template: string, method: string = 'GET', options: LinkOptions = {}): Resource {
    this.linkManager.addLink(rel, template, method, { ...options, templated: true });
    return this;
  }

  getLink(rel: string): LinkObject | undefined {
    return this.linkManager.getLink(rel);
  }

  getSelfLink(): string | undefined {
    const selfLink = this.linkManager.getLink('self');
    if (!selfLink) return undefined;
    
    return Array.isArray(selfLink) 
      ? selfLink[0]?.href 
      : selfLink.href;
  }

  getLinks(): Record<string, LinkObject> {
    return this.linkManager.getLinks();
  }

  hasLink(rel: string): boolean {
    return this.linkManager.hasLink(rel);
  }

  removeLink(rel: string): Resource {
    this.linkManager.removeLink(rel);
    return this;
  }

  embed(rel: string, resource: Resource | Resource[]): Resource {
    if (!rel || typeof rel !== 'string') {
      throw new InvalidArgumentError('Relation must be a non-empty string');
    }

    if (Array.isArray(resource)) {
      this.embedded[rel] = resource;
    } else {
      this.embedded[rel] = [resource];
    }

    return this;
  }

  getEmbedded(rel?: string): Record<string, Resource[]> | Resource[] | undefined {
    if (rel) {
      return this.embedded[rel];
    }
    return this.embedded;
  }

  hasEmbedded(rel: string): boolean {
    return rel in this.embedded;
  }

  getState(): string {
    return this.stateManager.getState();
  }

  setState(state: string): Resource {
    this.stateManager.setState(state);
    return this;
  }

  addTransition(from: string, to: string, name: string, href: string, method: string = 'POST', conditions?: Record<string, unknown>): Resource {
    this.stateManager.addTransition(from, to, name, href, method, conditions);
    this.addLink(name, href, method);
    return this;
  }

  applyTransition(name: string): Resource {
    const currentState = this.stateManager.getState();
    const newState = this.stateManager.applyTransition(name, currentState, this.properties);
    this.stateManager.setState(newState);
    return this;
  }

  getAvailableTransitions(): StateTransition[] {
    return this.stateManager.getAvailableTransitions(this.stateManager.getState(), this.properties);
  }

  addTemplate(key: string, template: HalFormTemplate): Resource {
    this.formsManager.addTemplate(key, template);
    return this;
  }

  addAction(
    key: string, 
    method: string, 
    properties: HalFormProperty[], 
    target?: string,
    title?: string
  ): Resource {
    const selfLink = this.getSelfLink();
    this.formsManager.addTemplate(key, {
      method,
      target: target || selfLink,
      title,
      properties
    });
    return this;
  }

  getTemplate(key: string): HalFormTemplate | undefined {
    return this.formsManager.getTemplate(key);
  }

  getTemplates(): Record<string, HalFormTemplate> {
    return this.formsManager.getTemplates();
  }

  removeTemplate(key: string): Resource {
    this.formsManager.removeTemplate(key);
    return this;
  }

  hasTemplate(key: string): boolean {
    return this.formsManager.hasTemplate(key);
  }

  toJSON(): Record<string, unknown> {
    const json: Record<string, unknown> = {
      type: this.type,
      id: this.id,
      properties: this.properties,
      links: this.linkManager.getLinks(),
      state: this.stateManager.getState()
    };

    // Add templates if any exist
    const templates = this.formsManager.getTemplates();
    if (Object.keys(templates).length > 0) {
      json._templates = templates;
    }

    if (Object.keys(this.embedded).length > 0) {
      json.embedded = Object.fromEntries(
        Object.entries(this.embedded).map(([rel, resources]) => [
          rel,
          resources.map(resource => resource.toJSON())
        ])
      );
    }

    return json;
  }
}

//#endregion

//#region Collection Implementation

/**
 * Pagination info interface
 */
export interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
}

/**
 * Collection options interface
 */
export interface CollectionOptions {
  type?: string;
  id?: string;
  properties?: Record<string, unknown>;
  items?: Resource[];
  pagination?: PaginationInfo;
}

/**
 * Collection class for HATEOAS resources
 */
export class Collection {
  private items: Resource[] = [];
  private pagination: PaginationInfo | null = null;
  private resource: Resource;
  private collectionName: string = 'items';
  
  constructor(options: CollectionOptions = {}) {
    this.resource = new Resource({
      type: options.type || 'collection',
      id: options.id,
      properties: options.properties
    });
    
    if (options.items && Array.isArray(options.items)) {
      this.addItems(options.items);
    }

    if (options.pagination) {
      this.setPagination(options.pagination);
    }
  }

  getType(): string {
    return this.resource.getType();
  }

  setType(type: string): Collection {
    this.resource.setType(type);
    return this;
  }

  getId(): string {
    return this.resource.getId();
  }

  setId(id: string): Collection {
    this.resource.setId(id);
    return this;
  }

  setProperty(key: string, value: unknown): Collection {
    this.resource.setProperty(key, value);
    return this;
  }

  getProperty(key: string): unknown {
    return this.resource.getProperty(key);
  }

  getProperties(): Record<string, unknown> {
    return this.resource.getProperties();
  }

  addItem(item: Resource): Collection {
    if (!(item instanceof Resource)) {
      throw new InvalidArgumentError('Collection items must be Resource instances');
    }
    this.items.push(item);
    return this;
  }

  addItems(items: Resource[]): Collection {
    if (!Array.isArray(items)) {
      throw new InvalidArgumentError('Items must be an array');
    }
    
    items.forEach(item => {
      if (!(item instanceof Resource)) {
        throw new InvalidArgumentError('Collection items must be Resource instances');
      }
      this.items.push(item);
    });
    
    return this;
  }

  getItems(): Resource[] {
    return [...this.items];
  }

  getCount(): number {
    return this.items.length;
  }

  sort(compareFn: (a: Resource, b: Resource) => number): Collection {
    this.items.sort(compareFn);
    return this;
  }

  filter(predicate: (item: Resource) => boolean): Resource[] {
    return this.items.filter(predicate);
  }

  setPagination(pagination: PaginationInfo): Collection {
    this.pagination = pagination;
    return this;
  }

  getPagination(): PaginationInfo | null {
    return this.pagination;
  }

  setPage(page: number): Collection {
    if (!this.pagination) {
      this.pagination = { page, pageSize: 10, total: this.items.length };
    } else {
      this.pagination.page = page;
    }
    return this;
  }

  setPageSize(pageSize: number): Collection {
    if (!this.pagination) {
      this.pagination = { page: 1, pageSize, total: this.items.length };
    } else {
      this.pagination.pageSize = pageSize;
    }
    return this;
  }

  setTotal(total: number): Collection {
    if (!this.pagination) {
      this.pagination = { page: 1, pageSize: 10, total };
    } else {
      this.pagination.total = total;
    }
    return this;
  }

  addLink(rel: string, href: string, method: string = 'GET', options: LinkOptions = {}): Collection {
    this.resource.addLink(rel, href, method, options);
    return this;
  }

  getLink(rel: string): LinkObject | undefined {
    return this.resource.getLink(rel);
  }

  getLinks(): Record<string, LinkObject> {
    return this.resource.getLinks();
  }

  addPaginationLinks(baseUrl: string): Collection {
    if (!this.pagination) return this;

    const { page, pageSize, total } = this.pagination;
    const totalPages = Math.ceil(total / pageSize);
    
    // Remove any existing pagination links
    this.resource.removeLink('first');
    this.resource.removeLink('prev');
    this.resource.removeLink('next');
    this.resource.removeLink('last');
    
    // Add new pagination links
    this.resource.addLink('first', `${baseUrl}?page=1&pageSize=${pageSize}`);
    
    if (page > 1) {
      this.resource.addLink('prev', `${baseUrl}?page=${page - 1}&pageSize=${pageSize}`);
    }
    
    if (page < totalPages) {
      this.resource.addLink('next', `${baseUrl}?page=${page + 1}&pageSize=${pageSize}`);
    }
    
    this.resource.addLink('last', `${baseUrl}?page=${totalPages}&pageSize=${pageSize}`);
    
    return this;
  }

  setCollectionName(name: string): Collection {
    this.collectionName = name;
    return this;
  }

  getCollectionName(): string {
    return this.collectionName;
  }

  toJSON(): Record<string, unknown> {
    const json = this.resource.toJSON();
    
    // Add items as embedded resources
    json.embedded = {
      [this.collectionName]: this.items.map(item => item.toJSON())
    };
    
    if (this.pagination) {
      json.pagination = this.pagination;
    }
    
    return json;
  }
}

//#endregion

//#region Validation

/**
 * Validation rule interface
 */
export interface ValidationRule {
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  validate?: (value: unknown) => boolean | string;
}

/**
 * Validation schema interface
 */
export interface ValidationSchema {
  [key: string]: ValidationRule;
}

/**
 * Validate data against a schema
 */
export function validate(data: Record<string, unknown>, schema: ValidationSchema): Record<string, unknown> {
  const errors: Record<string, string> = {};
  let hasErrors = false;
  
  // Check each field against the schema
  for (const [field, rule] of Object.entries(schema)) {
    const value = data[field];
    
    // Required field check
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors[field] = `${field} is required`;
      hasErrors = true;
      continue;
    }
    
    // Skip validation if field is not required and not provided
    if ((value === undefined || value === null || value === '') && !rule.required) {
      continue;
    }
    
    // Type validation
    if (rule.type) {
      let isValidType = true;
      
      switch (rule.type) {
        case 'string':
          isValidType = typeof value === 'string';
          break;
        case 'number':
          isValidType = typeof value === 'number' || 
                      (typeof value === 'string' && !isNaN(parseFloat(value)));
          break;
        case 'boolean':
          isValidType = typeof value === 'boolean' || 
                      value === 'true' || 
                      value === 'false' || 
                      value === 1 || 
                      value === 0 || 
                      value === '1' || 
                      value === '0';
          break;
        case 'array':
          isValidType = Array.isArray(value);
          break;
        case 'object':
          isValidType = typeof value === 'object' && 
                      value !== null && 
                      !Array.isArray(value);
          break;
      }
      
      if (!isValidType) {
        errors[field] = `${field} must be a ${rule.type}`;
        hasErrors = true;
        continue;
      }
    }
    
    // Validate minimum/maximum for numbers
    if (rule.type === 'number' && (typeof value === 'number' || typeof value === 'string')) {
      const numValue = typeof value === 'number' ? value : parseFloat(value);
      
      if (rule.min !== undefined && numValue < rule.min) {
        errors[field] = `${field} must be at least ${rule.min}`;
        hasErrors = true;
      }
      
      if (rule.max !== undefined && numValue > rule.max) {
        errors[field] = `${field} must be at most ${rule.max}`;
        hasErrors = true;
      }
    }
    
    // Validate string length
    if (rule.type === 'string' && typeof value === 'string') {
      if (rule.minLength !== undefined && value.length < rule.minLength) {
        errors[field] = `${field} must be at least ${rule.minLength} characters`;
        hasErrors = true;
      }
      
      if (rule.maxLength !== undefined && value.length > rule.maxLength) {
        errors[field] = `${field} must be at most ${rule.maxLength} characters`;
        hasErrors = true;
      }
      
      // Validate pattern
      if (rule.pattern && !new RegExp(rule.pattern).test(value)) {
        errors[field] = `${field} format is invalid`;
        hasErrors = true;
      }
    }
    
    // Custom validation function
    if (rule.validate && typeof rule.validate === 'function') {
      const result = rule.validate(value);
      if (result !== true) {
        errors[field] = typeof result === 'string' ? result : `${field} is invalid`;
        hasErrors = true;
      }
    }
  }
  
  // Throw validation error if there are any errors
  if (hasErrors) {
    throw new ValidationError('Validation failed', 'VALIDATION_ERROR', { errors });
  }
  
  return data;
}

/**
 * Validate request body against a schema
 */
export async function validateBody(request: Request, schema: ValidationSchema): Promise<Record<string, unknown>> {
  const contentType = request.headers.get('Content-Type');
  
  // Parse request body based on content type
  let body: Record<string, unknown>;
  
  if (!contentType || contentType.includes('application/json')) {
    try {
      body = await request.json() as Record<string, unknown>;
    } catch (err) {
      throw new ValidationError('Invalid JSON in request body');
    }
  } else if (contentType.includes('application/x-www-form-urlencoded')) {
    const formData = await request.formData();
    body = Object.fromEntries(formData.entries());
  } else {
    throw new ValidationError(`Unsupported content type: ${contentType}`);
  }
  
  // Validate against schema
  return validate(body, schema);
}

//#endregion

//#region Resource Renderer Interface

/**
 * Resource renderer interface
 */
export interface ResourceRenderer {
  mediaType: string;
  canRender(resource: Resource | Collection): boolean;
  render(resource: Resource | Collection, options?: any): Response;
}

/**
 * JSON renderer implementation
 */
export class JsonRenderer implements ResourceRenderer {
  mediaType = MEDIA_TYPES.JSON;
  
  canRender(_resource: Resource | Collection): boolean {
    return true; // Can render any resource or collection
  }
  
  render(resource: Resource | Collection, options: ResponseOptions = {}): Response {
    const json = resource.toJSON();
    return createJsonResponse(json, options);
  }
}

/**
 * HAL+JSON renderer implementation
 */
export class HalRenderer implements ResourceRenderer {
  mediaType = MEDIA_TYPES.HAL_JSON;
  
  canRender(_resource: Resource | Collection): boolean {
    return true; // Can render any resource or collection
  }
  
  render(resource: Resource | Collection, options: ResponseOptions = {}): Response {
    const json = resource.toJSON();
    
    // Convert to HAL format
    const halJson = this.toHalFormat(json);
    
    const headers = {
      'Content-Type': MEDIA_TYPES.HAL_JSON,
      ...options.headers
    };
    
    return new Response(JSON.stringify(halJson), {
      status: options.status || 200,
      headers
    });
  }
  
  private toHalFormat(json: any): any {
    // Simple transformation to HAL format
    const halJson = { ...json };
    
    // Rename links property to _links
    if (halJson.links) {
      halJson._links = halJson.links;
      delete halJson.links;
    }
    
    // Rename embedded property to _embedded
    if (halJson.embedded) {
      halJson._embedded = halJson.embedded;
      delete halJson.embedded;
    }
    
    return halJson;
  }
}

/**
 * Plain text renderer implementation
 */
export class TextRenderer implements ResourceRenderer {
  mediaType = MEDIA_TYPES.TEXT;
  
  canRender(_resource: Resource | Collection): boolean {
    return true; // Can render any resource or collection as text
  }
  
  render(resource: Resource | Collection, options: ResponseOptions = {}): Response {
    const json = resource.toJSON();
    const text = this.formatAsText(json);
    
    const headers = {
      'Content-Type': 'text/plain',
      ...options.headers
    };
    
    return new Response(text, {
      status: options.status || 200,
      headers
    });
  }
  
  private formatAsText(json: any, level: number = 0): string {
    const indent = '  '.repeat(level);
    let result = '';
    
    if (json.type) {
      result += `${indent}Type: ${json.type}\n`;
    }
    
    if (json.id) {
      result += `${indent}ID: ${json.id}\n`;
    }
    
    if (json.properties) {
      result += `${indent}Properties:\n`;
      for (const [key, value] of Object.entries(json.properties)) {
        result += `${indent}  ${key}: ${JSON.stringify(value)}\n`;
      }
    }
    
    if (json.links) {
      result += `${indent}Links:\n`;
      for (const [rel, link] of Object.entries(json.links)) {
        if (Array.isArray(link)) {
          for (const l of link) {
            result += `${indent}  ${rel}: ${l.href} (${l.method || 'GET'})\n`;
          }
        } else {
          result += `${indent}  ${rel}: ${(link as any).href} (${(link as any).method || 'GET'})\n`;
        }
      }
    }
    
    if (json.embedded) {
      result += `${indent}Embedded Resources:\n`;
      for (const [rel, resources] of Object.entries(json.embedded)) {
        result += `${indent}  ${rel}:\n`;
        if (Array.isArray(resources)) {
          for (const resource of resources) {
            result += this.formatAsText(resource, level + 2);
          }
        }
      }
    }
    
    return result;
  }
}

/**
 * Renderer registry for managing renderers
 */
export class RendererRegistry {
  private renderers: ResourceRenderer[] = [];
  private defaultRenderer: ResourceRenderer;
  
  constructor() {
    // Set up default renderers
    this.defaultRenderer = new JsonRenderer();
    this.register(this.defaultRenderer);
    this.register(new HalRenderer());
    this.register(new TextRenderer());
  }
  
  /**
   * Register a renderer
   */
  register(renderer: ResourceRenderer): RendererRegistry {
    // Check if we already have a renderer for this media type
    const existingIndex = this.renderers.findIndex(r => r.mediaType === renderer.mediaType);
    
    if (existingIndex >= 0) {
      // Replace existing renderer
      this.renderers[existingIndex] = renderer;
    } else {
      // Add new renderer
      this.renderers.push(renderer);
    }
    
    return this;
  }
  
  /**
   * Get a renderer by media type
   */
  getRenderer(mediaType: string): ResourceRenderer | undefined {
    return this.renderers.find(r => r.mediaType === mediaType);
  }
  
  /**
   * Find a suitable renderer for a resource and media type
   */
  findRendererForResource(resource: Resource | Collection, mediaType: string): ResourceRenderer | undefined {
    return this.renderers.find(r => 
      r.mediaType === mediaType && r.canRender(resource)
    );
  }
  
  /**
   * Render a resource with appropriate renderer based on content negotiation
   */
  render(resource: Resource | Collection, request: Request, options: ResponseOptions = {}): Response {
    try {
      // Get available media types
      const availableMediaTypes = this.renderers.map(r => r.mediaType);
      
      // Negotiate content type
      const mediaType = negotiateContentType(request, availableMediaTypes as MediaType[]);
      
      // Find renderer
      const renderer = this.findRendererForResource(resource, mediaType);
      
      if (renderer) {
        return renderer.render(resource, options);
      }
      
      // Fallback to default renderer
      return this.defaultRenderer.render(resource, options);
    } catch (err) {
      // Fallback to default renderer on content negotiation error
      if (err instanceof ContentNegotiationError) {
        return this.defaultRenderer.render(resource, options);
      }
      throw err;
    }
  }
  
  /**
   * Get all registered media types
   */
  getMediaTypes(): string[] {
    return this.renderers.map(r => r.mediaType);
  }
  
  /**
   * Set default renderer
   */
  setDefaultRenderer(mediaType: string): boolean {
    const renderer = this.getRenderer(mediaType);
    if (renderer) {
      this.defaultRenderer = renderer;
      return true;
    }
    return false;
  }
}

//#endregion

//#region Event System

/**
 * Event handler function type
 */
export type EventHandler<T = any> = (data: T) => void;

/**
 * Event emitter class for framework events
 */
export class EventEmitter {
  private events: Record<string, EventHandler[]> = {};
  
  /**
   * Register an event handler
   */
  on<T = any>(event: string, handler: EventHandler<T>): EventEmitter {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(handler as EventHandler);
    return this;
  }
  
  /**
   * Remove an event handler
   */
  off<T = any>(event: string, handler: EventHandler<T>): EventEmitter {
    if (!this.events[event]) {
      return this;
    }
    
    this.events[event] = this.events[event].filter(h => h !== handler);
    return this;
  }
  
  /**
   * Emit an event
   */
  emit<T = any>(event: string, data: T): EventEmitter {
    const handlers = this.events[event] || [];
    handlers.forEach(handler => handler(data));
    return this;
  }
  
  /**
   * Remove all event handlers
   */
  removeAllListeners(event?: string): EventEmitter {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
    return this;
  }
  
  /**
   * Get all registered events
   */
  getEventNames(): string[] {
    return Object.keys(this.events);
  }
  
  /**
   * Get handlers for an event
   */
  getHandlers(event: string): EventHandler[] {
    return [...(this.events[event] || [])];
  }
  
  /**
   * Register a one-time event handler
   */
  once<T = any>(event: string, handler: EventHandler<T>): EventEmitter {
    const onceHandler: EventHandler = (data) => {
      this.off(event, onceHandler);
      (handler as EventHandler)(data);
    };
    
    return this.on(event, onceHandler);
  }
}

/**
 * Framework event names
 */
export enum FrameworkEvent {
  REQUEST_START = 'request:start',
  REQUEST_END = 'request:end',
  RESOURCE_CREATED = 'resource:created',
  RESOURCE_UPDATED = 'resource:updated',
  RESOURCE_DELETED = 'resource:deleted',
  ERROR = 'error',
  SERVER_START = 'server:start',
  SERVER_STOP = 'server:stop',
}

//#endregion

//#region Configuration System

/**
 * Framework configuration interface
 */
export interface FrameworkConfig {
  port?: number;
  hostname?: string;
  plugins?: Plugin[];
  middlewares?: MiddlewareFunction[];
  renderers?: ResourceRenderer[];
  defaultMediaType?: string;
  eventHandlers?: Record<string, EventHandler[]>;
  errorHandling?: {
    detailed?: boolean;
    handlers?: Record<string, (error: Error) => Response>;
  };
}

/**
 * Configuration manager class
 */
export class ConfigurationManager {
  private config: FrameworkConfig;
  
  constructor(initialConfig: FrameworkConfig = {}) {
    // Set default configuration
    this.config = {
      port: 3000,
      hostname: '0.0.0.0',
      plugins: [],
      middlewares: [],
      renderers: [],
      defaultMediaType: MEDIA_TYPES.JSON,
      eventHandlers: {},
      errorHandling: {
        detailed: false,
        handlers: {}
      },
      ...initialConfig
    };
  }
  
  /**
   * Get the current configuration
   */
  getConfig(): FrameworkConfig {
    return { ...this.config };
  }
  
  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<FrameworkConfig>): ConfigurationManager {
    this.config = {
      ...this.config,
      ...newConfig,
      errorHandling: {
        ...this.config.errorHandling,
        ...(newConfig.errorHandling || {})
      }
    };
    return this;
  }
  
  /**
   * Get a specific configuration value
   */
  get<K extends keyof FrameworkConfig>(key: K): FrameworkConfig[K] {
    return this.config[key];
  }
  
  /**
   * Set a specific configuration value
   */
  set<K extends keyof FrameworkConfig>(key: K, value: FrameworkConfig[K]): ConfigurationManager {
    this.config[key] = value;
    return this;
  }
  
  /**
   * Apply configuration to a server
   */
  applyToServer(server: Server): void {
    // Apply plugins
    if (this.config.plugins) {
      for (const plugin of this.config.plugins) {
        server.registerPlugin(plugin);
      }
    }
    
    // Apply middlewares
    if (this.config.middlewares) {
      for (const middleware of this.config.middlewares) {
        server.use(middleware);
      }
    }
    
    // Apply renderers
    if (this.config.renderers && server.getRendererRegistry) {
      const rendererRegistry = server.getRendererRegistry();
      for (const renderer of this.config.renderers) {
        rendererRegistry.register(renderer);
      }
      
      // Set default media type if specified
      if (this.config.defaultMediaType) {
        rendererRegistry.setDefaultRenderer(this.config.defaultMediaType);
      }
    }
    
    // Apply event handlers
    if (this.config.eventHandlers && server.getEventEmitter) {
      const eventEmitter = server.getEventEmitter();
      for (const [event, handlers] of Object.entries(this.config.eventHandlers)) {
        for (const handler of handlers) {
          eventEmitter.on(event, handler);
        }
      }
    }
  }
}

//#endregion

/**
 * Schema field definition interface
 */
export interface SchemaField {
  type: string;
  required?: boolean;
  default?: unknown;
  validate?: (value: unknown) => boolean;
}

/**
 * Resource schema definition interface
 */
export interface ResourceSchema {
  fields: Record<string, SchemaField>;
}

/**
 * Resource route handlers interface
 */
export interface ResourceRoutes {
  base: string;
  list?: (req: Request) => Promise<unknown[]>;
  get?: (req: Request, id: string) => Promise<unknown>;
  create?: (req: Request, data: unknown) => Promise<unknown>;
  update?: (req: Request, id: string, data: unknown) => Promise<unknown>;
  delete?: (req: Request, id: string) => Promise<void>;
}

/**
 * Resource definition options interface
 */
export interface ResourceDefinition {
  schema: ResourceSchema;
  routes: ResourceRoutes;
  transform?: (data: unknown) => unknown;
}

/**
 * Resource definitions registry
 */
class ResourceRegistry {
  private definitions = new Map<string, ResourceDefinition>();

  /**
   * Define a new resource type
   */
  define(type: string, definition: ResourceDefinition): void {
    if (!type || typeof type !== "string") {
      throw new InvalidArgumentError("Resource type must be a non-empty string");
    }

    if (!definition.schema || !definition.routes) {
      throw new InvalidArgumentError("Resource definition must include schema and routes");
    }

    this.definitions.set(type, definition);
  }

  /**
   * Get a resource definition
   */
  get(type: string): ResourceDefinition | undefined {
    return this.definitions.get(type);
  }

  /**
   * Get all resource definitions
   */
  getAll(): Map<string, ResourceDefinition> {
    return new Map(this.definitions);
  }

  /**
   * Validate data against a schema
   */
  validateSchema(data: unknown, schema: ResourceSchema): boolean {
    if (!data || typeof data !== "object") {
      return false;
    }

    for (const [field, definition] of Object.entries(schema.fields)) {
      const value = (data as Record<string, unknown>)[field];
      
      // Check required fields
      if (definition.required && value === undefined) {
        return false;
      }

      // Skip validation for optional undefined fields
      if (value === undefined) {
        continue;
      }

      // Type validation
      switch (definition.type) {
        case "string":
          if (typeof value !== "string") return false;
          break;
        case "number":
          if (typeof value !== "number") return false;
          break;
        case "boolean":
          if (typeof value !== "boolean") return false;
          break;
        case "array":
          if (!Array.isArray(value)) return false;
          break;
        case "object":
          if (typeof value !== "object" || value === null) return false;
          break;
        default:
          // Custom type validation
          if (definition.validate && !definition.validate(value)) {
            return false;
          }
      }
    }

    return true;
  }

  /**
   * Transform data according to schema defaults
   */
  transformData(data: unknown, schema: ResourceSchema): unknown {
    if (!data || typeof data !== "object") {
      return data;
    }

    const result = { ...(data as Record<string, unknown>) };

    for (const [field, definition] of Object.entries(schema.fields)) {
      if (result[field] === undefined && definition.default !== undefined) {
        result[field] = definition.default;
      }
    }

    return result;
  }

  /**
   * Register routes for all resource definitions
   */
  registerRoutes(router: Router): void {
    for (const [type, definition] of this.definitions.entries()) {
      this.registerResourceRoutes(router, type, definition);
    }
  }

  /**
   * Register routes for a specific resource definition
   */
  private registerResourceRoutes(router: Router, type: string, definition: ResourceDefinition): void {
    const { routes, schema, transform } = definition;

    // List route
    if (routes.list) {
      const listHandler = routes.list;
      router.get(routes.base, async (req: Request) => {
        const items = await listHandler(req);
        const collection = createCollection({
          type,
          items: items.map(item => createResource({
            type,
            properties: transform ? transform(item) as Record<string, unknown> : item as Record<string, unknown>
          })),
          collectionName: type
        });
        return createJsonResponse(collection);
      });
    }

    // Get route
    if (routes.get) {
      const getHandler = routes.get;
      router.get(`${routes.base}/:id`, async (req: Request, params: Record<string, string>) => {
        const item = await getHandler(req, params.id);
        const resource = createResource({
          type,
          id: params.id,
          properties: transform ? transform(item) as Record<string, unknown> : item as Record<string, unknown>
        });
        return createJsonResponse(resource);
      });
    }

    // Create route
    if (routes.create) {
      const createHandler = routes.create;
      router.post(routes.base, async (req: Request) => {
        const data = await req.json();
        
        if (!this.validateSchema(data, schema)) {
          throw new ValidationError("Invalid resource data");
        }

        const transformedData = this.transformData(data, schema);
        const item = await createHandler(req, transformedData);
        
        const resource = createResource({
          type,
          properties: transform ? transform(item) as Record<string, unknown> : item as Record<string, unknown>
        });
        return createJsonResponse(resource, { status: 201 });
      });
    }

    // Update route
    if (routes.update) {
      const updateHandler = routes.update;
      router.put(`${routes.base}/:id`, async (req: Request, params: Record<string, string>) => {
        const data = await req.json();
        
        if (!this.validateSchema(data, schema)) {
          throw new ValidationError("Invalid resource data");
        }

        const transformedData = this.transformData(data, schema);
        const item = await updateHandler(req, params.id, transformedData);
        
        const resource = createResource({
          type,
          id: params.id,
          properties: transform ? transform(item) as Record<string, unknown> : item as Record<string, unknown>
        });
        return createJsonResponse(resource);
      });
    }

    // Delete route
    if (routes.delete) {
      const deleteHandler = routes.delete;
      router.delete(`${routes.base}/:id`, async (req: Request, params: Record<string, string>) => {
        await deleteHandler(req, params.id);
        return createJsonResponse(null, { status: 204 });
      });
    }
  }
}

/**
 * Global resource registry instance
 */
export const resourceRegistry = new ResourceRegistry();

/**
 * Define a new resource type
 */
export function defineResource(type: string, definition: ResourceDefinition): void {
  resourceRegistry.define(type, definition);
}

/**
 * Get a resource definition
 */
export function getResourceDefinition(type: string): ResourceDefinition | undefined {
  return resourceRegistry.get(type);
}

/**
 * Register routes for all defined resources
 */
export function registerResourceRoutes(router: Router): void {
  resourceRegistry.registerRoutes(router);
}

//#endregion

//#region HTTP Components

/**
 * Supported HTTP methods
 */
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
  HEAD: 'HEAD',
  OPTIONS: 'OPTIONS'
} as const;

export type HttpMethod = typeof HTTP_METHODS[keyof typeof HTTP_METHODS];

/**
 * Route handler type definition
 */
export type RouteHandler = (request: Request, params: Record<string, string>) => Promise<Response> | Response;

/**
 * Resource handlers interface for RESTful endpoints
 */
export interface ResourceHandlers {
  list?: RouteHandler;
  get?: RouteHandler;
  create?: RouteHandler;
  update?: RouteHandler;
  patch?: RouteHandler;
  delete?: RouteHandler;
}

/**
 * Route interface for internal use
 */
interface Route {
  method: HttpMethod | '*';
  path: RegExp;
  handler: RouteHandler;
  originalPath?: string; // For debugging and introspection
}

/**
 * Response options interface
 */
export interface ResponseOptions {
  status?: number;
  headers?: Record<string, string>;
}

/**
 * Create a response with appropriate headers
 */
export function createResponse(data: unknown, options: ResponseOptions = {}): Response {
  const defaultOptions: ResponseOptions = {
    status: 200,
    headers: {}
  };
  
  const finalOptions: ResponseOptions = { 
    ...defaultOptions, 
    ...options,
    headers: { ...defaultOptions.headers, ...options.headers } 
  };
  
  // Handle null/undefined for 204 No Content
  if (data === null || data === undefined) {
    return new Response(null, {
      status: finalOptions.status || 204,
      headers: finalOptions.headers
    });
  }
  
  // Handle Resource/Collection objects
  if (data instanceof Resource || data instanceof Collection) {
    // Mark as a resource for the renderer middleware
    const headers = {
      'Content-Type': 'application/json',
      'X-Original-Type': 'resource',
      ...finalOptions.headers
    };
    
    return new Response(JSON.stringify(data.toJSON()), {
      status: finalOptions.status || 200,
      headers
    });
  }
  
  // Handle different data types
  if (typeof data === 'object') {
    return createJsonResponse(data, finalOptions);
  }
  
  if (typeof data === 'string') {
    return new Response(data, {
      status: finalOptions.status || 200,
      headers: {
        'Content-Type': 'text/plain',
        ...finalOptions.headers
      }
    });
  }
  
  // For other types, convert to string
  return new Response(String(data), {
    status: finalOptions.status || 200,
    headers: {
      'Content-Type': 'text/plain',
      ...finalOptions.headers
    }
  });
}

/**
 * Create a JSON response
 */
export function createJsonResponse(data: unknown, options: ResponseOptions = {}): Response {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  return new Response(JSON.stringify(data), {
    status: options.status || 200,
    headers
  });
}

/**
 * Router class for handling API requests
 */
export class Router {
  private routes: Route[] = [];
  private notFoundHandler: RouteHandler | null = null;
  private errorHandler: ((error: Error) => Response) | null = null;
  private middlewareChain: MiddlewareChain = new MiddlewareChain();
  private pluginManager: PluginManager;
  
  constructor(pluginManager: PluginManager = new PluginManager()) {
    // Set default not found handler
    this.notFoundHandler = (req) => {
      return createErrorResponse(new NotFoundError(`Route not found: ${req.method} ${req.url}`));
    };
    
    // Set default error handler
    this.errorHandler = (err) => {
      return createErrorResponse(err);
    };
    
    this.pluginManager = pluginManager;
    
    // Add plugin middlewares
    const pluginMiddlewares = this.pluginManager.getMiddlewares();
    for (const middleware of pluginMiddlewares) {
      this.use(middleware);
    }
  }
  
  private pathToRegex(path: string): RegExp {
    const pattern = path
      .replace(/\/$/, '')  // Remove trailing slash
      .replace(/:[a-zA-Z]+/g, match => {
        const paramName = match.slice(1);
        return `(?<${paramName}>[^/]+)`;
      })
      .replace(/\*/g, '.*'); // Convert * to wildcard
    return new RegExp(`^${pattern}/?$`);
  }
  
  private extractParams(pattern: RegExp, path: string): Record<string, string> {
    const match = path.match(pattern);
    if (!match?.groups) {
      return {};
    }
    return match.groups;
  }
  
  /**
   * Add middleware to the router
   */
  use(middleware: MiddlewareFunction): Router {
    this.middlewareChain.use(middleware);
    return this;
  }
  
  route(method: HttpMethod | '*', path: string | RegExp, handler: RouteHandler): this {
    if (!method || !path || !handler) {
      throw new Error('Method, path, and handler are required');
    }
    
    if (typeof handler !== 'function') {
      throw new Error('Handler must be a function');
    }
    
    // Convert path string to RegExp if it's not already
    const pathPattern = typeof path === 'string'
      ? this.pathToRegex(path)
      : path;
    
    this.routes.push({
      method,
      path: pathPattern,
      handler,
      originalPath: typeof path === 'string' ? path : undefined
    });
    
    return this;
  }
  
  get(path: string | RegExp, handler: RouteHandler): this {
    return this.route(HTTP_METHODS.GET, path, handler);
  }
  
  post(path: string | RegExp, handler: RouteHandler): this {
    return this.route(HTTP_METHODS.POST, path, handler);
  }
  
  put(path: string | RegExp, handler: RouteHandler): this {
    return this.route(HTTP_METHODS.PUT, path, handler);
  }
  
  patch(path: string | RegExp, handler: RouteHandler): this {
    return this.route(HTTP_METHODS.PATCH, path, handler);
  }
  
  delete(path: string | RegExp, handler: RouteHandler): this {
    return this.route(HTTP_METHODS.DELETE, path, handler);
  }
  
  options(path: string | RegExp, handler: RouteHandler): this {
    return this.route(HTTP_METHODS.OPTIONS, path, handler);
  }
  
  head(path: string | RegExp, handler: RouteHandler): this {
    return this.route(HTTP_METHODS.HEAD, path, handler);
  }
  
  all(path: string | RegExp, handler: RouteHandler): this {
    return this.route('*', path, handler);
  }
  
  setNotFoundHandler(handler: RouteHandler): this {
    this.notFoundHandler = handler;
    return this;
  }
  
  setErrorHandler(handler: (error: Error) => Response): this {
    this.errorHandler = handler;
    return this;
  }
  
  resource(basePath: string, handlers: ResourceHandlers): this {
    // List all resources
    if (handlers.list) {
      this.get(basePath, handlers.list);
    }
    
    // Get a single resource
    if (handlers.get) {
      this.get(`${basePath}/:id`, handlers.get);
    }
    
    // Create a new resource
    if (handlers.create) {
      this.post(basePath, handlers.create);
    }
    
    // Update a resource
    if (handlers.update) {
      this.put(`${basePath}/:id`, handlers.update);
    }
    
    // Partially update a resource
    if (handlers.patch) {
      this.patch(`${basePath}/:id`, handlers.patch);
    }
    
    // Delete a resource
    if (handlers.delete) {
      this.delete(`${basePath}/:id`, handlers.delete);
    }
    
    return this;
  }
  
  async handle(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      const path = url.pathname;
      
      // Execute before route hook
      this.pluginManager.executeHook(HookType.BEFORE_ROUTE_HANDLE, request, path);
      
      // Find matching route
      let matchedRoute: Route | undefined;
      let params: Record<string, string> = {};
      
      for (const route of this.routes) {
        if (route.method === '*' || route.method === request.method) {
          const match = path.match(route.path);
          if (match) {
            matchedRoute = route;
            params = this.extractParams(route.path, path);
            break;
          }
        }
      }
      
      // Create request context
      const context: RequestContext = { 
        params, 
        state: {},
        route: matchedRoute ? {
          path: matchedRoute.originalPath || path,
          method: request.method
        } : undefined
      };
      
      // Define final handler based on whether we found a matching route
      const finalHandler = async (): Promise<Response> => {
        if (matchedRoute) {
          const response = await matchedRoute.handler(request, params);
          
          // Execute after route hook
          this.pluginManager.executeHook(HookType.AFTER_ROUTE_HANDLE, request, response);
          
          return response;
        }
        
        // No matching route found
        if (this.notFoundHandler) {
          return await this.notFoundHandler(request, {});
        }
        
        throw new NotFoundError(`Route not found: ${request.method} ${request.url}`);
      };
      
      // Run middleware chain
      const response = await this.middlewareChain.execute(request, context, finalHandler);
      
      // Execute before response hook
      this.pluginManager.executeHook(HookType.BEFORE_RESPONSE_SEND, response);
      
      return response;
    } catch (error) {
      // Execute before error hook
      this.pluginManager.executeHook(HookType.BEFORE_ERROR_HANDLE, error);
      
      if (this.errorHandler) {
        const response = this.errorHandler(error as Error);
        
        // Execute after error hook
        this.pluginManager.executeHook(HookType.AFTER_ERROR_HANDLE, error, response);
        
        return response;
      }
      
      return createErrorResponse(error as Error);
    }
  }
}

//#endregion

//#region Content Type Negotiation

/**
 * Standard media types
 */
export const MEDIA_TYPES = {
  JSON: 'application/json',
  HAL_JSON: 'application/hal+json',
  JSON_API: 'application/vnd.api+json',
  HTML: 'text/html',
  XML: 'application/xml',
  TEXT: 'text/plain'
} as const;

export type MediaType = typeof MEDIA_TYPES[keyof typeof MEDIA_TYPES];

/**
 * Format to media type mapping
 */
export const FORMAT_MAP = {
  'json': MEDIA_TYPES.JSON,
  'hal': MEDIA_TYPES.HAL_JSON,
  'jsonapi': MEDIA_TYPES.JSON_API,
  'html': MEDIA_TYPES.HTML,
  'xml': MEDIA_TYPES.XML,
  'text': MEDIA_TYPES.TEXT
} as const;

export type Format = keyof typeof FORMAT_MAP;

/**
 * Content type preference with quality
 */
interface ContentTypePreference {
  type: string;
  quality: number;
}

/**
 * Parse Accept header to get content type preferences
 */
export function parseAcceptHeader(acceptHeader: string | null): ContentTypePreference[] {
  if (!acceptHeader) {
    return [{ type: '*/*', quality: 1.0 }];
  }
  
  return acceptHeader
    .split(',')
    .map(part => {
      const [typeAndSubtype, ...params] = part.trim().split(';');
      let quality = 1.0;
      
      // Parse quality factor
      for (const param of params) {
        const [key, value] = param.trim().split('=');
        if (key === 'q') {
          quality = parseFloat(value) || 1.0;
        }
      }
      
      return {
        type: typeAndSubtype.trim(),
        quality
      };
    })
    .sort((a, b) => b.quality - a.quality);
}

/**
 * Get the best matching media type
 */
export function getBestMatch(acceptHeader: string | null, available: MediaType[]): MediaType | null {
  const accepted = parseAcceptHeader(acceptHeader);
  
  // Check for direct matches
  for (const { type } of accepted) {
    if (available.includes(type as MediaType)) {
      return type as MediaType;
    }
    
    // Handle wildcards
    if (type === '*/*') {
      return available[0]; // Return first available
    }
    
    // Handle type wildcards (e.g., text/*)
    if (type.endsWith('/*')) {
      const mainType = type.split('/')[0];
      
      for (const availableType of available) {
        if (availableType.startsWith(mainType + '/')) {
          return availableType;
        }
      }
    }
  }
  
  return null;
}

/**
 * Get media type from format query parameter
 */
export function getMediaTypeFromFormat(format: string): MediaType | null {
  return FORMAT_MAP[format.toLowerCase() as Format] || null;
}

/**
 * Negotiate content type based on Accept header and format parameter
 */
export function negotiateContentType(request: Request, available: MediaType[]): MediaType {
  // Check for format query parameter
  const url = new URL(request.url);
  const formatParam = url.searchParams.get('format');
  
  if (formatParam) {
    const mediaType = getMediaTypeFromFormat(formatParam);
    if (mediaType && available.includes(mediaType)) {
      return mediaType;
    }
    
    if (mediaType) {
      throw new ContentNegotiationError(
        `Requested format '${formatParam}' is not supported by this endpoint`,
        'FORMAT_NOT_SUPPORTED',
        { requested: formatParam, available: Object.keys(FORMAT_MAP) }
      );
    }
  }
  
  // Check Accept header
  const acceptHeader = request.headers.get('Accept') || '*/*';
  const mediaType = getBestMatch(acceptHeader, available);
  
  if (mediaType) {
    return mediaType;
  }
  
  // No acceptable media type
  throw new ContentNegotiationError(
    'None of the available media types are acceptable',
    'NOT_ACCEPTABLE',
    { 
      requested: acceptHeader, 
      available 
    }
  );
}

//#endregion

//#region Server Interface

/**
 * Server interface
 */
export interface ServerOptions {
  port?: number;
  hostname?: string;
  onListen?: (params: { port: number; hostname: string }) => void;
  plugins?: Plugin[];
  middlewares?: MiddlewareFunction[];
  renderers?: ResourceRenderer[];
  defaultMediaType?: string;
  eventHandlers?: Record<string, EventHandler[]>;
  config?: Partial<FrameworkConfig>;
}

/**
 * Server implementation
 */
export class Server {
  private router: Router;
  private options: ServerOptions;
  private abortController: AbortController | null = null;
  private pluginManager: PluginManager;
  private rendererRegistry: RendererRegistry;
  private eventEmitter: EventEmitter;
  private configManager: ConfigurationManager;
  
  constructor(options: ServerOptions = {}) {
    // Initialize event emitter
    this.eventEmitter = new EventEmitter();
    
    // Initialize renderer registry
    this.rendererRegistry = new RendererRegistry();
    
    // Initialize plugin manager
    this.pluginManager = new PluginManager();
    
    // Initialize configuration manager
    this.configManager = new ConfigurationManager(options.config);
    
    // Register plugins if provided
    if (options.plugins) {
      for (const plugin of options.plugins) {
        this.pluginManager.registerPlugin(plugin);
      }
    }
    
    // Create router with plugin manager
    this.router = new Router(this.pluginManager);
    
    // Add middlewares if provided
    if (options.middlewares) {
      for (const middleware of options.middlewares) {
        this.router.use(middleware);
      }
    }
    
    // Register renderers if provided
    if (options.renderers) {
      for (const renderer of options.renderers) {
        this.rendererRegistry.register(renderer);
      }
    }
    
    // Set default media type if provided
    if (options.defaultMediaType) {
      this.rendererRegistry.setDefaultRenderer(options.defaultMediaType);
    }
    
    // Register event handlers if provided
    if (options.eventHandlers) {
      for (const [event, handlers] of Object.entries(options.eventHandlers)) {
        for (const handler of handlers) {
          this.eventEmitter.on(event, handler);
        }
      }
    }
    
    this.options = {
      port: 3000,
      hostname: '0.0.0.0',
      ...options
    };
    
    // Add renderer middleware
    this.router.use(async (request, context, next) => {
      // Get response from next middleware or route handler
      const response = await next();
      
      // If the original response body is a Resource or Collection,
      // render it using the renderer registry
      if (response instanceof Response && 
          response.headers.get('X-Original-Type') === 'resource') {
        try {
          // Extract the original resource from response
          const originalBody = await response.json();
          const resource = this.recreateResource(originalBody);
          
          // Render with appropriate format based on Accept header
          return this.rendererRegistry.render(resource, request);
        } catch (err) {
          console.error('Error rendering resource:', err);
          // Return original response if rendering fails
          return response;
        }
      }
      
      return response;
    });
    
    // Initialize plugins with server context
    this.pluginManager.initializePlugins(this);
  }
  
  /**
   * Helper to recreate a Resource or Collection from plain object
   */
  private recreateResource(data: any): Resource | Collection {
    if (data.embedded && data.embedded[data.collectionName || 'items']) {
      // This is likely a collection
      const collection = new Collection({
        type: data.type,
        id: data.id,
        properties: data.properties,
        items: data.embedded[data.collectionName || 'items'].map((item: any) => 
          this.recreateResource(item)
        )
      });
      
      // Add links
      if (data.links) {
        for (const [rel, link] of Object.entries(data.links)) {
          if (Array.isArray(link)) {
            for (const l of link) {
              collection.addLink(rel, l.href, l.method);
            }
          } else {
            const l = link as any;
            collection.addLink(rel, l.href, l.method);
          }
        }
      }
      
      // Set collection name
      if (data.collectionName) {
        collection.setCollectionName(data.collectionName);
      }
      
      return collection;
    } else {
      // This is a resource
      const resource = new Resource({
        type: data.type,
        id: data.id,
        properties: data.properties
      });
      
      // Add links
      if (data.links) {
        for (const [rel, link] of Object.entries(data.links)) {
          if (Array.isArray(link)) {
            for (const l of link) {
              resource.addLink(rel, l.href, l.method);
            }
          } else {
            const l = link as any;
            resource.addLink(rel, l.href, l.method);
          }
        }
      }
      
      // Add embedded resources
      if (data.embedded) {
        for (const [rel, items] of Object.entries(data.embedded)) {
          if (Array.isArray(items)) {
            resource.embed(rel, items.map((item: any) => 
              this.recreateResource(item) as Resource
            ));
          }
        }
      }
      
      return resource;
    }
  }
  
  getRouter(): Router {
    return this.router;
  }
  
  getPluginManager(): PluginManager {
    return this.pluginManager;
  }
  
  getRendererRegistry(): RendererRegistry {
    return this.rendererRegistry;
  }
  
  getEventEmitter(): EventEmitter {
    return this.eventEmitter;
  }
  
  getConfigManager(): ConfigurationManager {
    return this.configManager;
  }
  
  /**
   * Register a plugin
   */
  registerPlugin(plugin: Plugin): Server {
    this.pluginManager.registerPlugin(plugin);
    plugin.initialize?.(this);
    return this;
  }
  
  /**
   * Register a renderer
   */
  registerRenderer(renderer: ResourceRenderer): Server {
    this.rendererRegistry.register(renderer);
    return this;
  }
  
  /**
   * Register an event handler
   */
  on(event: string, handler: EventHandler): Server {
    this.eventEmitter.on(event, handler);
    return this;
  }
  
  /**
   * Add middleware
   */
  use(middleware: MiddlewareFunction): Server {
    this.router.use(middleware);
    return this;
  }
  
  /**
   * Update configuration
   */
  configure(config: Partial<FrameworkConfig>): Server {
    this.configManager.updateConfig(config);
    this.configManager.applyToServer(this);
    return this;
  }
  
  async start(): Promise<void> {
    const { port, hostname, onListen } = this.options;
    this.abortController = new AbortController();
    
    // Emit server start event
    this.eventEmitter.emit(FrameworkEvent.SERVER_START, { port, hostname });
    
    await Deno.serve({
      port,
      hostname,
      signal: this.abortController.signal,
      onListen: onListen ? () => {
        onListen({ port: port!, hostname: hostname! });
      } : undefined
    }, async (request) => {
      // Emit request start event
      this.eventEmitter.emit(FrameworkEvent.REQUEST_START, { request });
      
      try {
        const response = await this.router.handle(request);
        
        // Emit request end event
        this.eventEmitter.emit(FrameworkEvent.REQUEST_END, { request, response });
        
        return response;
      } catch (error) {
        // Emit error event
        this.eventEmitter.emit(FrameworkEvent.ERROR, { request, error });
        
        if (this.router['errorHandler']) {
          return this.router['errorHandler'](error as Error);
        }
        
        return createErrorResponse(error as Error);
      }
    }).finished;
  }
  
  stop(): void {
    if (this.abortController) {
      // Emit server stop event
      this.eventEmitter.emit(FrameworkEvent.SERVER_STOP, {});
      
      this.abortController.abort();
      this.abortController = null;
    }
  }
}

//#endregion

//#region Convenience Factory Functions

/**
 * Create a resource with simplified API
 */
export function createResource(options: {
  type?: string;
  id?: string;
  properties?: Record<string, unknown>;
  links?: Record<string, string>;
  state?: string;
} = {}): Resource {
  const resource = new Resource({
    type: options.type,
    id: options.id,
    properties: options.properties
  });

  // Add links if provided
  if (options.links) {
    Object.entries(options.links).forEach(([rel, href]) => {
      resource.addLink(rel, href);
    });
  }

  // Set state if provided
  if (options.state) {
    resource.setState(options.state);
  }

  return resource;
}

/**
 * Create a collection with simplified API
 */
export function createCollection(options: {
  type?: string;
  id?: string;
  properties?: Record<string, unknown>;
  items?: Resource[];
  links?: Record<string, string>;
  pagination?: PaginationInfo;
  collectionName?: string;
} = {}): Collection {
  const collection = new Collection({
    type: options.type,
    id: options.id,
    properties: options.properties,
    items: options.items,
    pagination: options.pagination
  });

  // Add links if provided
  if (options.links) {
    Object.entries(options.links).forEach(([rel, href]) => {
      collection.addLink(rel, href);
    });
  }

  // Set collection name if provided
  if (options.collectionName) {
    collection.setCollectionName(options.collectionName);
  }

  return collection;
}

/**
 * Create a new application
 */
export function createApp(options: ServerOptions = {}): {
  router: Router;
  server: Server;
  start: () => Promise<void>;
  stop: () => void;
  defineResource: (type: string, definition: ResourceDefinition) => void;
  registerResources: () => void;
  use: (middleware: MiddlewareFunction) => void;
  registerPlugin: (plugin: Plugin) => void;
  registerRenderer: (renderer: ResourceRenderer) => void;
  on: (event: string, handler: EventHandler) => void;
  configure: (config: Partial<FrameworkConfig>) => void;
} {
  const server = new Server(options);
  const router = server.getRouter();
  
  return {
    router,
    server,
    start: () => server.start(),
    stop: () => server.stop(),
    defineResource: (type: string, definition: ResourceDefinition) => {
      defineResource(type, definition);
    },
    registerResources: () => {
      registerResourceRoutes(router);
    },
    use: (middleware: MiddlewareFunction) => {
      server.use(middleware);
    },
    registerPlugin: (plugin: Plugin) => {
      server.registerPlugin(plugin);
    },
    registerRenderer: (renderer: ResourceRenderer) => {
      server.registerRenderer(renderer);
    },
    on: (event: string, handler: EventHandler) => {
      server.on(event, handler);
    },
    configure: (config: Partial<FrameworkConfig>) => {
      server.configure(config);
    }
  };
}

//#endregion

/**
 * HyperDeno API
 */
export default {
  createApp,
  createResource,
  createCollection,
  Resource,
  Collection,
  Server,
  Router,
  STANDARD_RELS,
  HTTP_METHODS,
  MEDIA_TYPES,
  HookType,
  FrameworkEvent,
  // Resource definition
  defineResource,
  getResourceDefinition,
  registerResourceRoutes,
  // Middleware and plugins
  MiddlewareChain,
  PluginManager,
  // Renderers
  RendererRegistry,
  JsonRenderer,
  HalRenderer,
  TextRenderer,
  // Events
  EventEmitter,
  // Configuration
  ConfigurationManager,
  // Export error types
  ApiError,
  ValidationError,
  NotFoundError,
  AuthError,
  ServerError,
  StateTransitionError,
  InvalidArgumentError,
  ContentNegotiationError,
  // Export utility functions
  createResponse,
  createJsonResponse,
  createErrorResponse,
  validate,
  validateBody,
  negotiateContentType
};