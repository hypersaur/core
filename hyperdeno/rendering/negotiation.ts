/**
 * Content Negotiation
 * 
 * Handles content negotiation between client and server,
 * selecting the most appropriate renderer based on client preferences.
 * 
 * This class implements HTTP content negotiation as specified in RFC 7231,
 * supporting both Accept headers and format query parameters.
 * 
 * @example
 * ```typescript
 * const negotiator = new ContentNegotiator({
 *   defaultMediaType: 'application/json',
 *   strict: false
 * });
 * 
 * negotiator.addRenderers([
 *   new JsonRenderer(),
 *   new HtmlRenderer()
 * ]);
 * 
 * // Later in request handling:
 * const response = negotiator.render(request, resource);
 * ```
 */

import { Renderer } from './renderer.ts';
import { MEDIA_TYPES } from '../http/content-type.ts';
import { ContentNegotiationError } from '../core/errors.ts';
import { Resource } from '../core/resource.ts';
import { Collection } from '../core/collection.ts';

/**
 * Options for configuring the content negotiator
 * @interface ContentNegotiatorOptions
 * @property {string} [defaultMediaType='application/json'] - The default media type to use when no match is found
 * @property {boolean} [strict=false] - Whether to strictly enforce media type matching
 */
export interface ContentNegotiatorOptions {
  defaultMediaType?: string;
  strict?: boolean;
}

/**
 * Class responsible for content negotiation between client and server
 * 
 * This class manages a collection of renderers and selects the most appropriate
 * one based on the client's preferences expressed through HTTP headers and
 * query parameters.
 * 
 * @class ContentNegotiator
 */
export class ContentNegotiator {
  private renderers: Renderer[] = [];
  private options: Required<ContentNegotiatorOptions>;
  
  /**
   * Creates a new content negotiator instance
   * @param {ContentNegotiatorOptions} [options] - Configuration options for the negotiator
   */
  constructor(options: ContentNegotiatorOptions = {}) {
    this.options = {
      defaultMediaType: MEDIA_TYPES.JSON,
      strict: false,
      ...options
    };
  }
  
  /**
   * Adds a single renderer to the negotiator
   * @param {Renderer} renderer - The renderer to add
   * @throws {Error} If renderer is not an instance of Renderer
   * @returns {this} The negotiator instance for method chaining
   */
  addRenderer(renderer: Renderer): this {
    if (!(renderer instanceof Renderer)) {
      throw new Error('Renderer must be an instance of Renderer');
    }
    
    this.renderers.push(renderer);
    return this;
  }
  
  /**
   * Adds multiple renderers to the negotiator
   * @param {Renderer[]} renderers - Array of renderers to add
   * @returns {this} The negotiator instance for method chaining
   */
  addRenderers(renderers: Renderer[]): this {
    for (const renderer of renderers) {
      this.addRenderer(renderer);
    }
    return this;
  }
  
  /**
   * Gets all registered renderers
   * @returns {Renderer[]} A copy of the registered renderers array
   */
  getRenderers(): Renderer[] {
    return [...this.renderers];
  }
  
  /**
   * Gets the list of available media types from registered renderers
   * @returns {string[]} Array of supported media types
   */
  getAvailableMediaTypes(): string[] {
    return this.renderers.map(renderer => renderer.getMediaType());
  }
  
  /**
   * Negotiates the best renderer for a given request
   * 
   * This method implements the content negotiation algorithm:
   * 1. Checks for format query parameter
   * 2. Parses and evaluates Accept header
   * 3. Falls back to default media type if not strict
   * 
   * @param {Request} request - The incoming request to negotiate for
   * @throws {ContentNegotiationError} If no suitable renderer is found
   * @returns {Renderer} The selected renderer
   */
  negotiate(request: Request): Renderer {
    // Get Accept header
    const acceptHeader = request.headers.get('Accept') || '*/*';
    
    // Check for format query parameter
    const url = new URL(request.url);
    const formatParam = url.searchParams.get('format');
    
    if (formatParam) {
      const mediaType = this.#getMediaTypeFromFormat(formatParam);
      if (mediaType) {
        const renderer = this.#findRenderer(mediaType);
        if (renderer) {
          return renderer;
        }
      }
    }
    
    // Parse Accept header
    const acceptedTypes = this.#parseAcceptHeader(acceptHeader);
    
    // Find best matching renderer
    for (const { type, quality } of acceptedTypes) {
      const renderer = this.#findRenderer(type);
      if (renderer) {
        return renderer;
      }
    }
    
    // If no match found and not strict, use default
    if (!this.options.strict) {
      const defaultRenderer = this.#findRenderer(this.options.defaultMediaType);
      if (defaultRenderer) {
        return defaultRenderer;
      }
    }
    
    // No suitable renderer found
    throw new ContentNegotiationError(
      'No suitable renderer found for the requested media types',
      'NO_SUITABLE_RENDERER',
      {
        requested: acceptHeader,
        available: this.getAvailableMediaTypes()
      }
    );
  }
  
  /**
   * Finds a renderer that can handle a specific media type
   * @private
   * @param {string} mediaType - The media type to find a renderer for
   * @returns {Renderer|null} The matching renderer or null if not found
   */
  #findRenderer(mediaType: string): Renderer | null {
    return this.renderers.find(renderer => renderer.canHandle(mediaType)) || null;
  }
  
  /**
   * Converts a format parameter to its corresponding media type
   * @private
   * @param {string} format - The format parameter value
   * @returns {string|null} The corresponding media type or null if not found
   */
  #getMediaTypeFromFormat(format: string): string | null {
    const mediaType = MEDIA_TYPES[format.toUpperCase() as keyof typeof MEDIA_TYPES];
    return mediaType || null;
  }
  
  /**
   * Parses an Accept header into an array of accepted types with quality factors
   * @private
   * @param {string} acceptHeader - The Accept header value
   * @returns {Array<{type: string, quality: number}>} Array of accepted types sorted by quality
   */
  #parseAcceptHeader(acceptHeader: string): Array<{ type: string; quality: number }> {
    return acceptHeader
      .split(',')
      .map(part => {
        const [type, ...params] = part.trim().split(';');
        let quality = 1.0;
        
        // Parse quality factor
        for (const param of params) {
          const [key, value] = param.trim().split('=');
          if (key === 'q') {
            quality = parseFloat(value) || 1.0;
          }
        }
        
        return {
          type: type.trim(),
          quality
        };
      })
      .sort((a, b) => b.quality - a.quality);
  }
  
  /**
   * Renders a resource using the negotiated renderer
   * 
   * This is a convenience method that combines negotiation and rendering
   * into a single step.
   * 
   * @param {Request} request - The incoming request
   * @param {Resource|Collection} resource - The resource to render
   * @returns {Response} The rendered response
   */
  render(request: Request, resource: Resource | Collection): Response {
    const renderer = this.negotiate(request);
    return renderer.render(resource);
  }
} 