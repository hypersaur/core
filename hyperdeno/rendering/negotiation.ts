/**
 * Content Negotiation
 * 
 * Handles content negotiation between client and server,
 * selecting the most appropriate renderer based on client preferences.
 */

import { Renderer } from './renderer.ts';
import { MEDIA_TYPES } from '../http/content-type.ts';
import { ContentNegotiationError } from '../core/errors.ts';
import { Resource } from '../core/resource.ts';
import { Collection } from '../core/collection.ts';

/**
 * Content negotiator options interface
 */
export interface ContentNegotiatorOptions {
  defaultMediaType?: string;
  strict?: boolean;
}

/**
 * Class responsible for content negotiation
 */
export class ContentNegotiator {
  private renderers: Renderer[] = [];
  private options: Required<ContentNegotiatorOptions>;
  
  /**
   * Create a new content negotiator
   * @param options - Negotiator options
   */
  constructor(options: ContentNegotiatorOptions = {}) {
    this.options = {
      defaultMediaType: MEDIA_TYPES.JSON,
      strict: false,
      ...options
    };
  }
  
  /**
   * Add a renderer to the negotiator
   * @param renderer - Renderer to add
   * @returns For chaining
   */
  addRenderer(renderer: Renderer): this {
    if (!(renderer instanceof Renderer)) {
      throw new Error('Renderer must be an instance of Renderer');
    }
    
    this.renderers.push(renderer);
    return this;
  }
  
  /**
   * Add multiple renderers
   * @param renderers - Renderers to add
   * @returns For chaining
   */
  addRenderers(renderers: Renderer[]): this {
    for (const renderer of renderers) {
      this.addRenderer(renderer);
    }
    return this;
  }
  
  /**
   * Get all registered renderers
   * @returns Array of renderers
   */
  getRenderers(): Renderer[] {
    return [...this.renderers];
  }
  
  /**
   * Get available media types
   * @returns Array of media types
   */
  getAvailableMediaTypes(): string[] {
    return this.renderers.map(renderer => renderer.getMediaType());
  }
  
  /**
   * Negotiate the best renderer for a request
   * @param request - Web standard Request
   * @returns Selected renderer
   * @throws {ContentNegotiationError} If no suitable renderer found
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
   * Find a renderer that can handle a media type
   * @param mediaType - Media type to handle
   * @returns Matching renderer or null
   * @private
   */
  #findRenderer(mediaType: string): Renderer | null {
    return this.renderers.find(renderer => renderer.canHandle(mediaType)) || null;
  }
  
  /**
   * Get media type from format parameter
   * @param format - Format value
   * @returns Media type or null
   * @private
   */
  #getMediaTypeFromFormat(format: string): string | null {
    const mediaType = MEDIA_TYPES[format.toUpperCase() as keyof typeof MEDIA_TYPES];
    return mediaType || null;
  }
  
  /**
   * Parse Accept header
   * @param acceptHeader - Accept header value
   * @returns Array of accepted types with quality
   * @private
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
   * Render a resource using the negotiated renderer
   * @param request - Web standard Request
   * @param resource - Resource to render
   * @returns Web standard Response
   */
  render(request: Request, resource: Resource | Collection): Response {
    const renderer = this.negotiate(request);
    return renderer.render(resource);
  }
} 